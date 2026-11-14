from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.core.security import get_current_user, enforce_ownership, AuthenticatedUser
from app.core.database import db
from app.services.reports.export_service import ExportService

router = APIRouter()

@router.get("/csv/{run_id}")
async def export_screening_csv(
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

    csv_data = ExportService.generate_screening_csv(
        job_title=run.get("jobTitle", "Role"),
        results=results
    )

    filename = f"talentiq_screening_{run_id[:8]}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/pdf/{result_id}")
async def export_candidate_pdf(
    result_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    result = await db.get_document("candidateResults", result_id)
    if not result:
        raise HTTPException(status_code=404, detail="Candidate result not found.")
    
    enforce_ownership(result.get("ownerId", ""), current_user)

    job_title = result.get("jobTitle", "Position")
    pdf_bytes = ExportService.generate_candidate_pdf(result, job_title)

    filename = f"talentiq_candidate_{result.get('candidateName', 'dossier').replace(' ', '_')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
