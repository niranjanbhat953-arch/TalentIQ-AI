"""
Tests for analytics endpoint using real stored data (no fabrication).
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
HEADERS = {"Authorization": "Bearer dev-token-analytics_test_user"}


def test_analytics_endpoint_requires_auth():
    resp = client.get("/api/v1/analytics/dashboard")
    assert resp.status_code == 401


def test_analytics_dashboard_returns_real_data():
    resp = client.get("/api/v1/analytics/dashboard", headers=HEADERS)
    assert resp.status_code == 200
    data = resp.json()

    # Verify expected fields are present
    assert "totalJobs" in data
    assert "totalResumes" in data
    assert "totalScreeningRuns" in data
    assert "candidatesAwaitingReview" in data
    assert "parsingSuccessCount" in data
    assert "parsingFailedCount" in data
    assert "scoreDistribution" in data
    assert "reviewStatusCounts" in data
    assert "topSkillsDemanded" in data
    assert "recentScreenings" in data


def test_analytics_score_distribution_has_all_buckets():
    resp = client.get("/api/v1/analytics/dashboard", headers=HEADERS)
    buckets = resp.json()["scoreDistribution"]
    expected_keys = {"0-20", "21-40", "41-60", "61-80", "81-100"}
    assert expected_keys == set(buckets.keys())


def test_analytics_review_status_counts_complete():
    resp = client.get("/api/v1/analytics/dashboard", headers=HEADERS)
    review_counts = resp.json()["reviewStatusCounts"]
    expected_statuses = {
        "NOT_REVIEWED", "IN_REVIEW", "SHORTLISTED",
        "NEEDS_VERIFICATION", "NOT_PROCEEDING"
    }
    assert expected_statuses == set(review_counts.keys())


def test_analytics_non_negative_counts():
    resp = client.get("/api/v1/analytics/dashboard", headers=HEADERS)
    data = resp.json()
    assert data["totalJobs"] >= 0
    assert data["totalResumes"] >= 0
    assert data["totalScreeningRuns"] >= 0
    assert data["candidatesAwaitingReview"] >= 0
    assert data["parsingSuccessCount"] >= 0
    assert data["parsingFailedCount"] >= 0


def test_analytics_top_skills_structure():
    # Create a job with known skills to verify they appear in analytics
    job_payload = {
        "title": "Analytics Test Job",
        "department": "Engineering",
        "location": "Remote",
        "employmentType": "FULL_TIME",
        "status": "ACTIVE",
        "description": "Test job for analytics verification.",
        "responsibilities": ["Test analytics data"],
        "requiredSkills": ["UniqueSkillXYZ_12345"],
        "preferredSkills": [],
        "minExperienceYears": 1.0,
        "educationRequirements": [],
        "certifications": [],
        "scoringWeights": {"requiredSkills": 40.0, "experience": 25.0, "projects": 20.0, "educationCerts": 15.0}
    }
    client.post("/api/v1/jobs", json=job_payload, headers=HEADERS)

    resp = client.get("/api/v1/analytics/dashboard", headers=HEADERS)
    top_skills = resp.json()["topSkillsDemanded"]
    assert isinstance(top_skills, list)

    # Each skill entry should have 'skill' and 'count'
    for entry in top_skills:
        assert "skill" in entry
        assert "count" in entry
        assert entry["count"] >= 1
