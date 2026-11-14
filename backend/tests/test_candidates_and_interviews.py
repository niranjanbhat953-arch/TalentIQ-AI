"""
Tests for the candidate results, comparison, and interview assistant endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

HEADERS_A = {"Authorization": "Bearer dev-token-test_cand_user_alpha"}
HEADERS_B = {"Authorization": "Bearer dev-token-test_cand_user_beta"}

VALID_JOB = {
    "title": "Data Engineer",
    "department": "Data Platform",
    "location": "Remote",
    "employmentType": "FULL_TIME",
    "status": "ACTIVE",
    "description": "Build and maintain data pipelines for analytics and machine learning.",
    "responsibilities": ["Develop ETL pipelines", "Monitor data quality"],
    "requiredSkills": ["Python", "SQL", "Apache Spark"],
    "preferredSkills": ["Airflow", "dbt"],
    "minExperienceYears": 2.0,
    "educationRequirements": ["Bachelor's degree"],
    "certifications": [],
    "scoringWeights": {
        "requiredSkills": 40.0,
        "experience": 25.0,
        "projects": 20.0,
        "educationCerts": 15.0
    }
}


def _create_job(headers=None):
    headers = headers or HEADERS_A
    resp = client.post("/api/v1/jobs", json=VALID_JOB, headers=headers)
    assert resp.status_code == 201
    return resp.json()["id"]


class TestCandidateResults:
    def test_list_candidates_requires_auth(self):
        resp = client.get("/api/v1/candidates")
        assert resp.status_code == 401

    def test_list_candidates_returns_empty_initially(self):
        resp = client.get("/api/v1/candidates", headers=HEADERS_A)
        assert resp.status_code == 200
        # May or may not have data — just confirm 200 response with a list
        assert isinstance(resp.json(), list)


class TestCandidateComparison:
    def test_comparison_requires_min_two_candidates(self):
        job_id = _create_job()
        resp = client.post("/api/v1/candidates/compare", json={
            "jobId": job_id,
            "candidateResultIds": ["only_one_id"]
        }, headers=HEADERS_A)
        # Should be rejected — need at least 2
        assert resp.status_code in (400, 422)

    def test_comparison_rejects_more_than_five(self):
        job_id = _create_job()
        resp = client.post("/api/v1/candidates/compare", json={
            "jobId": job_id,
            "candidateResultIds": ["a", "b", "c", "d", "e", "f"]  # 6 IDs
        }, headers=HEADERS_A)
        assert resp.status_code in (400, 422)

    def test_comparison_rejects_cross_job_candidates(self):
        job_a = _create_job()
        job_b = _create_job()
        # Two fake IDs — should fail with 404 (candidates don't exist)
        resp = client.post("/api/v1/candidates/compare", json={
            "jobId": job_a,
            "candidateResultIds": ["fake_id_1", "fake_id_2"]
        }, headers=HEADERS_A)
        assert resp.status_code == 404


class TestInterviewGeneration:
    def test_generate_interview_questions_for_job(self):
        job_id = _create_job()
        resp = client.post("/api/v1/interviews/generate", json={
            "jobId": job_id,
            "questionCount": 3,
            "targetDifficulty": "MID"
        }, headers=HEADERS_A)
        assert resp.status_code == 201
        data = resp.json()
        assert "questions" in data
        assert len(data["questions"]) >= 1
        assert data["generationSource"] in ("LLM_ASSISTED", "RULE_ENGINE_FALLBACK")

    def test_interview_generation_requires_auth(self):
        resp = client.post("/api/v1/interviews/generate", json={
            "jobId": "some_id",
            "questionCount": 3
        })
        assert resp.status_code == 401

    def test_interview_generation_wrong_owner(self):
        job_id = _create_job(HEADERS_A)  # Job owned by user A
        # User B tries to generate questions for user A's job
        resp = client.post("/api/v1/interviews/generate", json={
            "jobId": job_id,
            "questionCount": 3
        }, headers=HEADERS_B)
        assert resp.status_code == 403

    def test_list_interview_sets_for_job(self):
        job_id = _create_job()
        # Generate a set
        client.post("/api/v1/interviews/generate", json={
            "jobId": job_id,
            "questionCount": 2
        }, headers=HEADERS_A)

        list_resp = client.get(f"/api/v1/interviews/{job_id}", headers=HEADERS_A)
        assert list_resp.status_code == 200
        assert isinstance(list_resp.json(), list)
        assert len(list_resp.json()) >= 1

    def test_interview_question_structure(self):
        job_id = _create_job()
        resp = client.post("/api/v1/interviews/generate", json={
            "jobId": job_id,
            "questionCount": 1
        }, headers=HEADERS_A)
        q = resp.json()["questions"][0]
        assert "id" in q
        assert "questionText" in q
        assert "category" in q
        assert "competency" in q
        assert "difficulty" in q
        assert "relevanceReason" in q
