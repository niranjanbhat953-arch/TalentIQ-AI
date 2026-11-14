from collections import Counter
from typing import Dict, Any, List
from fastapi import APIRouter, Depends

from app.core.security import get_current_user, AuthenticatedUser
from app.core.database import db
from app.models.schemas import AnalyticsDashboardResponse, ReviewStatus, ProcessingStatus

router = APIRouter()

@router.get("/dashboard", response_model=AnalyticsDashboardResponse)
async def get_dashboard_analytics(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    # Fetch real records owned by user
    jobs = await db.query_documents("jobs", filters=[("ownerId", "==", current_user.uid)])
    resumes = await db.query_documents("resumes", filters=[("ownerId", "==", current_user.uid)])
    runs = await db.query_documents("screeningRuns", filters=[("ownerId", "==", current_user.uid)])
    results = await db.query_documents("candidateResults", filters=[("ownerId", "==", current_user.uid)])

    # Parsing metrics
    parsing_success = sum(1 for r in resumes if r.get("processingStatus") == ProcessingStatus.EXTRACTED.value)
    parsing_failed = sum(1 for r in resumes if r.get("processingStatus") == ProcessingStatus.FAILED.value)

    # Review status counts
    review_counts = {
        ReviewStatus.NOT_REVIEWED.value: 0,
        ReviewStatus.IN_REVIEW.value: 0,
        ReviewStatus.SHORTLISTED.value: 0,
        ReviewStatus.NEEDS_VERIFICATION.value: 0,
        ReviewStatus.NOT_PROCEEDING.value: 0,
    }
    for res in results:
        st = res.get("reviewStatus", ReviewStatus.NOT_REVIEWED.value)
        if st in review_counts:
            review_counts[st] += 1

    awaiting_review = review_counts[ReviewStatus.NOT_REVIEWED.value]

    # Score distribution
    score_buckets = {
        "0-20": 0,
        "21-40": 0,
        "41-60": 0,
        "61-80": 0,
        "81-100": 0
    }
    for res in results:
        sc = res.get("overallScore", 0.0)
        if sc <= 20:
            score_buckets["0-20"] += 1
        elif sc <= 40:
            score_buckets["21-40"] += 1
        elif sc <= 60:
            score_buckets["41-60"] += 1
        elif sc <= 80:
            score_buckets["61-80"] += 1
        else:
            score_buckets["81-100"] += 1

    # Skills demand
    skill_counter = Counter()
    for j in jobs:
        for s in j.get("requiredSkills", []):
            skill_counter[s] += 1

    top_skills = [{"skill": s, "count": c} for s, c in skill_counter.most_common(8)]

    # Recent screening runs
    recent_screenings = []
    for r in sorted(runs, key=lambda x: str(x.get("startedAt", "")), reverse=True)[:5]:
        recent_screenings.append({
            "id": r.get("id"),
            "jobTitle": r.get("jobTitle"),
            "totalProcessed": r.get("totalProcessed", 0),
            "status": r.get("status"),
            "startedAt": r.get("startedAt")
        })

    return AnalyticsDashboardResponse(
        totalJobs=len(jobs),
        totalResumes=len(resumes),
        totalScreeningRuns=len(runs),
        candidatesAwaitingReview=awaiting_review,
        parsingSuccessCount=parsing_success,
        parsingFailedCount=parsing_failed,
        scoreDistribution=score_buckets,
        reviewStatusCounts=review_counts,
        topSkillsDemanded=top_skills,
        recentScreenings=recent_screenings
    )
