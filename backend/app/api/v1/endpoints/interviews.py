import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user, enforce_ownership, AuthenticatedUser
from app.core.database import db
from app.models.schemas import (
    InterviewGenerateRequest, InterviewQuestionSetResponse, ExtractedProfile
)
from app.services.interviews.generator import InterviewQuestionGenerator

router = APIRouter()

@router.post("/generate", response_model=InterviewQuestionSetResponse, status_code=status.HTTP_201_CREATED)
async def generate_interview_questions(
    req: InterviewGenerateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    job = await db.get_document("jobs", req.jobId)
    if not job:
        raise HTTPException(status_code=404, detail="Target job not found.")
    
    enforce_ownership(job.get("ownerId", ""), current_user)

    candidate_profile = None
    candidate_name = None
    if req.candidateResultId:
        c_res = await db.get_document("candidateResults", req.candidateResultId)
        if c_res:
            enforce_ownership(c_res.get("ownerId", ""), current_user)
            candidate_name = c_res.get("candidateName")
            if c_res.get("extractedProfile"):
                candidate_profile = ExtractedProfile(**c_res["extractedProfile"])

    questions, source = await InterviewQuestionGenerator.generate(
        job_data=job,
        profile=candidate_profile,
        categories=req.categories,
        question_count=req.questionCount,
        target_difficulty=req.targetDifficulty
    )

    set_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc_data = {
        "id": set_id,
        "ownerId": current_user.uid,
        "jobId": req.jobId,
        "jobTitle": job.get("title", "Role"),
        "candidateResultId": req.candidateResultId,
        "candidateName": candidate_name,
        "questions": [q.model_dump() for q in questions],
        "generationSource": source,
        "createdAt": now
    }

    await db.set_document("interviewQuestionSets", set_id, doc_data)
    return InterviewQuestionSetResponse(**doc_data)

@router.get("/{job_id}", response_model=List[InterviewQuestionSetResponse])
async def list_interview_question_sets(
    job_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    job = await db.get_document("jobs", job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Target job not found.")
    
    enforce_ownership(job.get("ownerId", ""), current_user)

    sets = await db.query_documents(
        "interviewQuestionSets",
        filters=[("jobId", "==", job_id), ("ownerId", "==", current_user.uid)],
        order_by="createdAt",
        descending=True
    )
    return [InterviewQuestionSetResponse(**s) for s in sets]
