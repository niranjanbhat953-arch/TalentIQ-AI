from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_user, enforce_ownership, AuthenticatedUser
from app.core.database import db
from app.models.schemas import (
    CandidateResultResponse, ReviewStatusUpdate, ReviewStatus
)

router = APIRouter()

@router.get("", response_model=List[CandidateResultResponse])
async def list_candidates(
    job_id: Optional[str] = None,
    review_status: Optional[ReviewStatus] = None,
    search: Optional[str] = None,
    min_score: Optional[float] = None,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    filters = [("ownerId", "==", current_user.uid)]
    if job_id:
        filters.append(("jobId", "==", job_id))
    if review_status:
        filters.append(("reviewStatus", "==", review_status.value))

    results = await db.query_documents("candidateResults", filters=filters, order_by="overallScore", descending=True)
    
    filtered = []
    for r in results:
        if search:
            q = search.lower()
            name_match = q in r.get("candidateName", "").lower()
            skill_match = any(q in s.lower() for s in r.get("matchedRequirements", []))
            if not (name_match or skill_match):
                continue
        if min_score is not None and r.get("overallScore", 0.0) < min_score:
            continue
        filtered.append(CandidateResultResponse(**r))

    return filtered

@router.get("/{result_id}", response_model=CandidateResultResponse)
async def get_candidate_result(
    result_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    result = await db.get_document("candidateResults", result_id)
    if not result:
        raise HTTPException(status_code=404, detail="Candidate result not found.")
    
    enforce_ownership(result.get("ownerId", ""), current_user)
    return CandidateResultResponse(**result)

@router.patch("/{result_id}/review", response_model=CandidateResultResponse)
async def update_candidate_review(
    result_id: str,
    req: ReviewStatusUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    result = await db.get_document("candidateResults", result_id)
    if not result:
        raise HTTPException(status_code=404, detail="Candidate result not found.")
    
    enforce_ownership(result.get("ownerId", ""), current_user)

    updates = {
        "reviewStatus": req.reviewStatus.value,
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    if req.recruiterNotes is not None:
        updates["recruiterNotes"] = req.recruiterNotes

    updated = await db.update_document("candidateResults", result_id, updates)
    return CandidateResultResponse(**updated)
