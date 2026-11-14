import os
import uuid
import aiofiles
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status

from app.core.security import get_current_user, enforce_ownership, AuthenticatedUser
from app.core.database import db
from app.core.config import settings
from app.models.schemas import (
    ResumeResponse, ResumeUploadResponse, ProcessingStatus,
    ResumeQualityAnalysisResponse
)
from app.services.document_processing.extractor import DocumentExtractor
from app.services.resume_extraction.parser import ResumeParser
from app.services.resume_extraction.quality_analyzer import ResumeQualityAnalyzer

router = APIRouter()

@router.get("", response_model=List[ResumeResponse])
async def list_resumes(
    job_id: Optional[str] = None,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    filters = [("ownerId", "==", current_user.uid)]
    if job_id:
        filters.append(("jobId", "==", job_id))

    resumes = await db.query_documents("resumes", filters=filters, order_by="uploadedAt", descending=True)
    return [ResumeResponse(**r) for r in resumes]

@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resumes(
    files: List[UploadFile] = File(...),
    job_id: Optional[str] = Form(None),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    # If job_id provided, verify ownership of the job
    if job_id:
        job = await db.get_document("jobs", job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Target job not found.")
        enforce_ownership(job.get("ownerId", ""), current_user)

    uploaded_resumes: List[ResumeResponse] = []
    duplicate_count = 0
    failed_count = 0

    # Get existing hashes for current user to detect duplicates
    user_resumes = await db.query_documents("resumes", filters=[("ownerId", "==", current_user.uid)])
    existing_hashes = {r.get("fileHash") for r in user_resumes if r.get("fileHash")}

    for f in files:
        filename = f.filename or "resume.pdf"
        ext = os.path.splitext(filename)[1].lower()
        if ext not in [".pdf", ".docx", ".doc"]:
            failed_count += 1
            continue

        file_bytes = await f.read()
        file_size = len(file_bytes)

        if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
            failed_count += 1
            continue

        file_hash = DocumentExtractor.calculate_sha256(file_bytes)
        if file_hash in existing_hashes:
            duplicate_count += 1
            continue

        resume_id = str(uuid.uuid4())
        safe_filename = f"{resume_id}_{filename}"
        saved_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

        async with aiofiles.open(saved_path, "wb") as out_file:
            await out_file.write(file_bytes)

        # Process document extraction
        now = datetime.now(timezone.utc).isoformat()
        try:
            raw_text, pages_data, is_scanned = DocumentExtractor.extract_document(saved_path, filename)
            extracted_profile = ResumeParser.parse(raw_text, pages_data, is_scanned)
            proc_status = ProcessingStatus.EXTRACTED
            err_msg = None
        except Exception as e:
            proc_status = ProcessingStatus.FAILED
            err_msg = f"Extraction failed: {str(e)}"
            extracted_profile = None
            failed_count += 1

        resume_data = {
            "id": resume_id,
            "ownerId": current_user.uid,
            "jobId": job_id,
            "fileName": filename,
            "fileSize": file_size,
            "fileHash": file_hash,
            "mimeType": f.content_type or ("application/pdf" if ext == ".pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            "storagePath": saved_path,
            "processingStatus": proc_status.value,
            "errorMessage": err_msg,
            "extractedProfile": extracted_profile.model_dump() if extracted_profile else None,
            "uploadedAt": now,
            "updatedAt": now
        }

        await db.set_document("resumes", resume_id, resume_data)
        existing_hashes.add(file_hash)
        uploaded_resumes.append(ResumeResponse(**resume_data))

    return ResumeUploadResponse(
        resumes=uploaded_resumes,
        duplicateCount=duplicate_count,
        failedCount=failed_count
    )

@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    resume = await db.get_document("resumes", resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
    
    enforce_ownership(resume.get("ownerId", ""), current_user)
    return ResumeResponse(**resume)

@router.post("/{resume_id}/retry", response_model=ResumeResponse)
async def retry_resume_processing(
    resume_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    resume = await db.get_document("resumes", resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
    
    enforce_ownership(resume.get("ownerId", ""), current_user)
    
    storage_path = resume.get("storagePath")
    if not storage_path or not os.path.exists(storage_path):
        raise HTTPException(status_code=400, detail="Original document file not found in storage.")

    try:
        raw_text, pages_data, is_scanned = DocumentExtractor.extract_document(storage_path, resume.get("fileName", "resume.pdf"))
        extracted_profile = ResumeParser.parse(raw_text, pages_data, is_scanned)
        updates = {
            "processingStatus": ProcessingStatus.EXTRACTED.value,
            "errorMessage": None,
            "extractedProfile": extracted_profile.model_dump()
        }
    except Exception as e:
        updates = {
            "processingStatus": ProcessingStatus.FAILED.value,
            "errorMessage": f"Retry extraction failed: {str(e)}"
        }

    updated = await db.update_document("resumes", resume_id, updates)
    return ResumeResponse(**updated)

@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    resume = await db.get_document("resumes", resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
    
    enforce_ownership(resume.get("ownerId", ""), current_user)

    # Delete local file safely
    storage_path = resume.get("storagePath")
    if storage_path and os.path.exists(storage_path):
        try:
            os.remove(storage_path)
        except Exception:
            pass

    # Delete candidate results linked to this resume
    results = await db.query_documents("candidateResults", filters=[("resumeId", "==", resume_id)])
    for r in results:
        await db.delete_document("candidateResults", r["id"])

    await db.delete_document("resumes", resume_id)
    return {"message": "Resume and associated files deleted.", "resumeId": resume_id}

@router.get("/{resume_id}/quality-analysis", response_model=ResumeQualityAnalysisResponse)
async def analyze_resume_quality(
    resume_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    resume = await db.get_document("resumes", resume_id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
    
    enforce_ownership(resume.get("ownerId", ""), current_user)

    profile_data = resume.get("extractedProfile")
    if not profile_data:
        raise HTTPException(status_code=400, detail="Resume has no extracted profile to analyze.")

    from app.models.schemas import ExtractedProfile
    profile = ExtractedProfile(**profile_data)
    return ResumeQualityAnalyzer.analyze(profile, resume_id)
