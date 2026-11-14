from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, jobs, resumes, screening, candidates, comparison,
    interviews, analytics, reports, settings
)

api_router = APIRouter()

api_router.include_router(auth.router, tags=["Authentication & System"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Jobs Management"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["Resumes & Extraction"])
api_router.include_router(screening.router, prefix="/screening", tags=["Screening & Matching"])
api_router.include_router(candidates.router, prefix="/candidates", tags=["Candidates & Review"])
api_router.include_router(comparison.router, prefix="/candidates", tags=["Candidate Comparison"])
api_router.include_router(interviews.router, prefix="/interviews", tags=["Interview Assistant"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports & Exports"])
api_router.include_router(settings.router, prefix="/settings", tags=["Settings & Deletion"])
