import os
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user, AuthenticatedUser
from app.core.database import db
from app.models.schemas import DeletionRequest, DeletionResponse, DeletionScope

router = APIRouter()

@router.get("")
async def get_settings(current_user: AuthenticatedUser = Depends(get_current_user)):
    user = await db.get_document("users", current_user.uid)
    return user.get("settings", {
        "defaultWeights": {"requiredSkills": 40, "experience": 25, "projects": 20, "educationCerts": 15},
        "autoArchiveDays": 90,
        "anonymizeCandidatePII": False
    })

@router.put("")
async def update_settings(
    settings_data: Dict[str, Any],
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    user = await db.get_document("users", current_user.uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    current_settings = user.get("settings", {})
    current_settings.update(settings_data)

    await db.update_document("users", current_user.uid, {"settings": current_settings})
    return current_settings

@router.post("/delete-data", response_model=DeletionResponse)
async def delete_user_data(
    req: DeletionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    if req.confirmationText.strip() != "DELETE":
        raise HTTPException(
            status_code=400,
            detail="Confirmation text must equal 'DELETE' to confirm irreversible data removal."
        )

    deleted_count = 0

    if req.scope == DeletionScope.CANDIDATE_RESULT:
        if not req.resourceId:
            raise HTTPException(status_code=400, detail="resourceId required for candidate deletion.")
        c = await db.get_document("candidateResults", req.resourceId)
        if c and c.get("ownerId") == current_user.uid:
            await db.delete_document("candidateResults", req.resourceId)
            deleted_count = 1

    elif req.scope == DeletionScope.RESUME_DOCUMENT:
        if not req.resourceId:
            raise HTTPException(status_code=400, detail="resourceId required for resume document deletion.")
        r = await db.get_document("resumes", req.resourceId)
        if r and r.get("ownerId") == current_user.uid:
            storage_path = r.get("storagePath")
            if storage_path and os.path.exists(storage_path):
                try:
                    os.remove(storage_path)
                except Exception:
                    pass
            await db.delete_document("resumes", req.resourceId)
            # Remove associated candidate results
            results = await db.query_documents("candidateResults", filters=[("resumeId", "==", req.resourceId)])
            for res in results:
                await db.delete_document("candidateResults", res["id"])
                deleted_count += 1
            deleted_count += 1

    elif req.scope == DeletionScope.JOB_AND_RESULTS:
        if not req.resourceId:
            raise HTTPException(status_code=400, detail="resourceId required for job deletion.")
        job = await db.get_document("jobs", req.resourceId)
        if job and job.get("ownerId") == current_user.uid:
            runs = await db.query_documents("screeningRuns", filters=[("jobId", "==", req.resourceId)])
            for run in runs:
                await db.delete_document("screeningRuns", run["id"])
                deleted_count += 1
            results = await db.query_documents("candidateResults", filters=[("jobId", "==", req.resourceId)])
            for res in results:
                await db.delete_document("candidateResults", res["id"])
                deleted_count += 1
            await db.delete_document("jobs", req.resourceId)
            deleted_count += 1

    elif req.scope == DeletionScope.FULL_ACCOUNT_DATA:
        # Full wipe of recruiter resources
        for coll in ["candidateResults", "screeningRuns", "resumes", "jobs", "interviewQuestionSets"]:
            docs = await db.query_documents(coll, filters=[("ownerId", "==", current_user.uid)])
            for d in docs:
                if coll == "resumes" and d.get("storagePath") and os.path.exists(d["storagePath"]):
                    try:
                        os.remove(d["storagePath"])
                    except Exception:
                        pass
                await db.delete_document(coll, d["id"])
                deleted_count += 1
        
        await db.delete_document("users", current_user.uid)
        deleted_count += 1

    return DeletionResponse(
        success=True,
        scope=req.scope,
        deletedItemsCount=deleted_count,
        message=f"Successfully purged {deleted_count} record(s) under policy scope {req.scope.value}."
    )
