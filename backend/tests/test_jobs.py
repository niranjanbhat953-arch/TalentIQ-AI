"""
Tests for Job CRUD endpoints covering ownership, validation, and dependency handling.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

VALID_JOB = {
    "title": "Backend Python Engineer",
    "department": "Engineering",
    "location": "Remote",
    "employmentType": "FULL_TIME",
    "status": "ACTIVE",
    "description": "We need an experienced Python engineer who can build scalable microservices.",
    "responsibilities": ["Design microservice APIs", "Maintain CI/CD pipelines"],
    "requiredSkills": ["Python", "FastAPI", "PostgreSQL"],
    "preferredSkills": ["Docker", "Redis"],
    "minExperienceYears": 3.0,
    "educationRequirements": ["Bachelor's degree in Computer Science"],
    "certifications": [],
    "scoringWeights": {
        "requiredSkills": 40.0,
        "experience": 25.0,
        "projects": 20.0,
        "educationCerts": 15.0
    }
}

HEADERS_A = {"Authorization": "Bearer dev-token-test_jobs_user_alpha"}
HEADERS_B = {"Authorization": "Bearer dev-token-test_jobs_user_beta"}


def test_create_job_requires_auth():
    resp = client.post("/api/v1/jobs", json=VALID_JOB)
    assert resp.status_code == 401


def test_create_job_success():
    resp = client.post("/api/v1/jobs", json=VALID_JOB, headers=HEADERS_A)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == VALID_JOB["title"]
    assert data["ownerId"] == "test_jobs_user_alpha"
    assert data["criteriaVersion"] == 1


def test_create_job_invalid_weights():
    bad_job = VALID_JOB.copy()
    bad_job["scoringWeights"] = {
        "requiredSkills": 50.0,
        "experience": 30.0,
        "projects": 20.0,
        "educationCerts": 20.0  # Total = 120, invalid
    }
    resp = client.post("/api/v1/jobs", json=bad_job, headers=HEADERS_A)
    assert resp.status_code == 422


def test_list_jobs_only_returns_own():
    # Create jobs as user A and user B
    client.post("/api/v1/jobs", json={**VALID_JOB, "title": "Job For Alpha"}, headers=HEADERS_A)
    client.post("/api/v1/jobs", json={**VALID_JOB, "title": "Job For Beta"}, headers=HEADERS_B)

    jobs_a = client.get("/api/v1/jobs", headers=HEADERS_A).json()
    jobs_b = client.get("/api/v1/jobs", headers=HEADERS_B).json()

    titles_a = {j["title"] for j in jobs_a}
    titles_b = {j["title"] for j in jobs_b}

    # User A should not see user B's job and vice versa
    assert "Job For Beta" not in titles_a
    assert "Job For Alpha" not in titles_b


def test_update_job_increments_criteria_version():
    create_resp = client.post("/api/v1/jobs", json=VALID_JOB, headers=HEADERS_A)
    job_id = create_resp.json()["id"]
    initial_version = create_resp.json()["criteriaVersion"]

    update_resp = client.put(f"/api/v1/jobs/{job_id}", json={"title": "Updated Python Engineer"}, headers=HEADERS_A)
    assert update_resp.status_code == 200
    assert update_resp.json()["criteriaVersion"] == initial_version + 1


def test_delete_job_requires_ownership():
    create_resp = client.post("/api/v1/jobs", json=VALID_JOB, headers=HEADERS_A)
    job_id = create_resp.json()["id"]

    # User B cannot delete user A's job
    del_resp = client.delete(f"/api/v1/jobs/{job_id}", headers=HEADERS_B)
    assert del_resp.status_code == 403

    # User A can delete their own job
    del_resp_a = client.delete(f"/api/v1/jobs/{job_id}", headers=HEADERS_A)
    assert del_resp_a.status_code == 200


def test_archive_toggle():
    create_resp = client.post("/api/v1/jobs", json=VALID_JOB, headers=HEADERS_A)
    job_id = create_resp.json()["id"]

    # Archive
    arch_resp = client.patch(f"/api/v1/jobs/{job_id}/archive", headers=HEADERS_A)
    assert arch_resp.json()["status"] == "ARCHIVED"

    # Unarchive (toggle back)
    unarch_resp = client.patch(f"/api/v1/jobs/{job_id}/archive", headers=HEADERS_A)
    assert unarch_resp.json()["status"] == "ACTIVE"


def test_job_description_parse_endpoint():
    resp = client.post(
        "/api/v1/jobs/parse-description",
        json={"rawText": "We are hiring a Senior Python engineer with 5+ years of experience in FastAPI, PostgreSQL, and Docker. Must have strong problem solving skills and Bachelor's degree in Computer Science."},
        headers=HEADERS_A
    )
    assert resp.status_code == 200
    data = resp.json()
    # Should return some structured output
    assert "requiredSkills" in data
    assert "minExperienceYears" in data
