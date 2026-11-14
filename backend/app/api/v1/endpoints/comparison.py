from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user, enforce_ownership, AuthenticatedUser
from app.core.database import db
from app.models.schemas import (
    CandidateComparisonRequest, CandidateComparisonResponse, CandidateResultResponse
)

router = APIRouter()

@router.post("/compare", response_model=CandidateComparisonResponse)
async def compare_candidates(
    req: CandidateComparisonRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    if len(req.candidateResultIds) < 2 or len(req.candidateResultIds) > 5:
        raise HTTPException(
            status_code=400,
            detail="Candidate comparison requires between 2 and 5 candidates."
        )

    job = await db.get_document("jobs", req.jobId)
    if not job:
        raise HTTPException(status_code=404, detail="Target job not found.")
    
    enforce_ownership(job.get("ownerId", ""), current_user)

    candidates = []
    run_ids = set()

    for cid in req.candidateResultIds:
        cand = await db.get_document("candidateResults", cid)
        if not cand:
            raise HTTPException(status_code=404, detail=f"Candidate result '{cid}' not found.")
        
        enforce_ownership(cand.get("ownerId", ""), current_user)

        if cand.get("jobId") != req.jobId:
            raise HTTPException(
                status_code=400,
                detail=f"Candidate '{cand.get('candidateName')}' was screened for a different job."
            )

        run_ids.add(cand.get("screeningRunId"))
        candidates.append(CandidateResultResponse(**cand))

    # Verify criteria version consistency across runs
    version_consistent = True
    warning_message = None
    if len(run_ids) > 1:
        versions = []
        for rid in run_ids:
            run = await db.get_document("screeningRuns", rid)
            if run:
                versions.append(run.get("criteriaVersion", 1))
        
        if len(set(versions)) > 1:
            version_consistent = False
            warning_message = (
                "These candidates were screened against different criteria versions. "
                "Consider re-screening all candidates with the current job criteria for a strictly normalized comparison."
            )

    return CandidateComparisonResponse(
        jobId=req.jobId,
        jobTitle=job.get("title", "Role"),
        criteriaVersionConsistent=version_consistent,
        warningMessage=warning_message,
        candidates=candidates
    )
