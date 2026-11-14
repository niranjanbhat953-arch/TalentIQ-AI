import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_user, enforce_ownership, AuthenticatedUser
from app.core.database import db
from app.models.schemas import (
    JobCreate, JobUpdate, JobResponse, JobStatus,
    JobParseRequest, JobParseResponse
)
from app.services.job_analysis.analyzer import JobDescriptionAnalyzer

router = APIRouter()

@router.get("", response_model=List[JobResponse])
async def list_jobs(
    status_filter: Optional[JobStatus] = None,
    search: Optional[str] = None,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    filters = [("ownerId", "==", current_user.uid)]
    if status_filter:
        filters.append(("status", "==", status_filter.value))

    jobs = await db.query_documents("jobs", filters=filters, order_by="createdAt", descending=True)
    
    # Also enrich with candidate count and screening count
    all_resumes = await db.query_documents("resumes", filters=[("ownerId", "==", current_user.uid)])
    all_runs = await db.query_documents("screeningRuns", filters=[("ownerId", "==", current_user.uid)])

    resumes_by_job = {}
    for r in all_resumes:
        jid = r.get("jobId")
        if jid:
            resumes_by_job[jid] = resumes_by_job.get(jid, 0) + 1

    runs_by_job = {}
    for run in all_runs:
        jid = run.get("jobId")
        if jid:
            runs_by_job[jid] = runs_by_job.get(jid, 0) + 1

    result = []
    for j in jobs:
        if search:
            q = search.lower()
            if q not in j.get("title", "").lower() and q not in j.get("department", "").lower():
                continue
        jid = j["id"]
        j["candidateCount"] = resumes_by_job.get(jid, 0)
        j["screeningCount"] = runs_by_job.get(jid, 0)
        result.append(JobResponse(**j))

    return result

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_in: JobCreate,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    if not job_in.scoringWeights.validate_sum():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Scoring weights must sum to exactly 100%."
        )

    now = datetime.now(timezone.utc).isoformat()
    job_id = str(uuid.uuid4())
    job_data = job_in.model_dump()
    job_data.update({
        "id": job_id,
        "ownerId": current_user.uid,
        "criteriaVersion": 1,
        "createdAt": now,
        "updatedAt": now,
        "candidateCount": 0,
        "screeningCount": 0
    })

    await db.set_document("jobs", job_id, job_data)
    return JobResponse(**job_data)

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    job = await db.get_document("jobs", job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    enforce_ownership(job.get("ownerId", ""), current_user)
    
    # Counts
    resumes = await db.query_documents("resumes", filters=[("jobId", "==", job_id), ("ownerId", "==", current_user.uid)])
    runs = await db.query_documents("screeningRuns", filters=[("jobId", "==", job_id), ("ownerId", "==", current_user.uid)])
    job["candidateCount"] = len(resumes)
    job["screeningCount"] = len(runs)

    return JobResponse(**job)

@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: str,
    job_in: JobUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    job = await db.get_document("jobs", job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    enforce_ownership(job.get("ownerId", ""), current_user)

    updates = {k: v for k, v in job_in.model_dump().items() if v is not None}
    
    # If scoringWeights updated, validate sum
    if "scoringWeights" in updates:
        weights = updates["scoringWeights"]
        total = weights["requiredSkills"] + weights["experience"] + weights["projects"] + weights["educationCerts"]
        if abs(total - 100.0) > 0.01:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Scoring weights must sum to exactly 100%."
            )

    # Increment criteriaVersion to preserve historical run reproducibility
    updates["criteriaVersion"] = job.get("criteriaVersion", 1) + 1
    updates["updatedAt"] = datetime.now(timezone.utc).isoformat()

    updated_job = await db.update_document("jobs", job_id, updates)
    return JobResponse(**updated_job)

@router.patch("/{job_id}/archive", response_model=JobResponse)
async def toggle_archive_job(
    job_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    job = await db.get_document("jobs", job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    enforce_ownership(job.get("ownerId", ""), current_user)

    current_status = job.get("status", JobStatus.ACTIVE.value)
    new_status = JobStatus.ACTIVE.value if current_status == JobStatus.ARCHIVED.value else JobStatus.ARCHIVED.value
    
    updated = await db.update_document("jobs", job_id, {"status": new_status})
    return JobResponse(**updated)

@router.delete("/{job_id}")
async def delete_job(
    job_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    job = await db.get_document("jobs", job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    enforce_ownership(job.get("ownerId", ""), current_user)

    # Delete associated candidate results and screening runs
    runs = await db.query_documents("screeningRuns", filters=[("jobId", "==", job_id), ("ownerId", "==", current_user.uid)])
    for r in runs:
        await db.delete_document("screeningRuns", r["id"])

    results = await db.query_documents("candidateResults", filters=[("jobId", "==", job_id), ("ownerId", "==", current_user.uid)])
    for res in results:
        await db.delete_document("candidateResults", res["id"])

    await db.delete_document("jobs", job_id)
    return {"message": "Job and associated screening records successfully deleted.", "jobId": job_id}

@router.post("/parse-description", response_model=JobParseResponse)
async def parse_job_description(
    req: JobParseRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    return JobDescriptionAnalyzer.parse_text(req.rawText)
