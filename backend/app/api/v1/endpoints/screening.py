import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_user, enforce_ownership, AuthenticatedUser
from app.core.database import db
from app.models.schemas import (
    ScreeningRunCreate, ScreeningRunResponse, ScreeningRunStatus,
    CandidateResultResponse, ExtractedProfile, ScoringWeights, ReviewStatus
)
from app.services.matching.engine import MatchingEngine

router = APIRouter()

@router.get("/runs", response_model=List[ScreeningRunResponse])
async def list_screening_runs(
    job_id: Optional[str] = None,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    filters = [("ownerId", "==", current_user.uid)]
    if job_id:
        filters.append(("jobId", "==", job_id))

    runs = await db.query_documents("screeningRuns", filters=filters, order_by="startedAt", descending=True)
    return [ScreeningRunResponse(**r) for r in runs]

@router.post("/runs", response_model=ScreeningRunResponse, status_code=status.HTTP_201_CREATED)
async def create_screening_run(
    req: ScreeningRunCreate,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    job = await db.get_document("jobs", req.jobId)
    if not job:
        raise HTTPException(status_code=404, detail="Target job not found.")
    
    enforce_ownership(job.get("ownerId", ""), current_user)

    # Determine resumes to screen
    if req.resumeIds:
        resumes_to_screen = []
        for rid in req.resumeIds:
            r = await db.get_document("resumes", rid)
            if r and r.get("ownerId") == current_user.uid and r.get("extractedProfile"):
                resumes_to_screen.append(r)
    else:
        # Screen all extracted resumes for this job
        resumes_to_screen = await db.query_documents(
            "resumes",
            filters=[("jobId", "==", req.jobId), ("ownerId", "==", current_user.uid)]
        )
        resumes_to_screen = [r for r in resumes_to_screen if r.get("extractedProfile")]

    if not resumes_to_screen:
        raise HTTPException(status_code=400, detail="No extracted resumes available to screen for this job.")

    # Freeze frozen configuration snapshot
    run_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    weights = req.customWeights or ScoringWeights(**(job.get("scoringWeights") or {}))
    criteria_version = job.get("criteriaVersion", 1)

    run_data = {
        "id": run_id,
        "ownerId": current_user.uid,
        "jobId": req.jobId,
        "jobTitle": job.get("title", "Role"),
        "criteriaVersion": criteria_version,
        "scoringWeights": weights.model_dump(),
        "matchingModel": "TalentIQ Deterministic Alignment v1.0",
        "totalSubmitted": len(resumes_to_screen),
        "totalProcessed": 0,
        "totalFailed": 0,
        "status": ScreeningRunStatus.RUNNING.value,
        "startedAt": now,
        "completedAt": None
    }
    await db.set_document("screeningRuns", run_id, run_data)

    processed_count = 0
    failed_count = 0

    for r in resumes_to_screen:
        try:
            profile = ExtractedProfile(**r["extractedProfile"])
            match_res = MatchingEngine.evaluate_candidate(job, profile, custom_weights=weights)

            result_id = str(uuid.uuid4())
            res_data = {
                "id": result_id,
                "ownerId": current_user.uid,
                "screeningRunId": run_id,
                "jobId": req.jobId,
                "jobTitle": job.get("title", "Role"),
                "resumeId": r["id"],
                "candidateName": profile.candidateName,
                "overallScore": match_res["overallScore"],
                "evaluationCoverage": match_res["evaluationCoverage"],
                "evaluableCriteriaCount": match_res["evaluableCriteriaCount"],
                "totalCriteriaCount": match_res["totalCriteriaCount"],
                "criterionScores": match_res["criterionScores"].model_dump(),
                "skillGaps": [g.model_dump() for g in match_res["skillGaps"]],
                "matchedRequirements": match_res["matchedRequirements"],
                "missingRequirements": match_res["missingRequirements"],
                "unclearRequirements": match_res["unclearRequirements"],
                "reviewStatus": ReviewStatus.NOT_REVIEWED.value,
                "recruiterNotes": "",
                "processingWarnings": match_res["processingWarnings"],
                "extractedProfile": profile.model_dump(),
                "methodologyNote": match_res["methodologyNote"],
                "createdAt": now,
                "updatedAt": now
            }
            await db.set_document("candidateResults", result_id, res_data)
            processed_count += 1
        except Exception as e:
            failed_count += 1

    # Update run status
    completed_now = datetime.now(timezone.utc).isoformat()
    run_updates = {
        "totalProcessed": processed_count,
        "totalFailed": failed_count,
        "status": ScreeningRunStatus.COMPLETED.value if failed_count == 0 else ScreeningRunStatus.PARTIAL.value,
        "completedAt": completed_now
    }
    updated_run = await db.update_document("screeningRuns", run_id, run_updates)
    return ScreeningRunResponse(**updated_run)

@router.get("/runs/{run_id}", response_model=ScreeningRunResponse)
async def get_screening_run(
    run_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    run = await db.get_document("screeningRuns", run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Screening run not found.")
    
    enforce_ownership(run.get("ownerId", ""), current_user)
    return ScreeningRunResponse(**run)

@router.get("/runs/{run_id}/results", response_model=List[CandidateResultResponse])
async def get_run_results(
    run_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    run = await db.get_document("screeningRuns", run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Screening run not found.")
    
    enforce_ownership(run.get("ownerId", ""), current_user)

    results = await db.query_documents(
        "candidateResults",
        filters=[("screeningRunId", "==", run_id), ("ownerId", "==", current_user.uid)],
        order_by="overallScore",
        descending=True
    )
    return [CandidateResultResponse(**res) for res in results]
