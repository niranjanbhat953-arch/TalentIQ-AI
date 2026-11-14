def test_user_a_cannot_access_or_modify_user_b_job(client, auth_headers_user_a, auth_headers_user_b):
    # 1. User A creates a job
    job_payload = {
        "title": "Confidential Staff Lead Engineer",
        "department": "Core Platform",
        "location": "Remote",
        "employmentType": "FULL_TIME",
        "status": "ACTIVE",
        "description": "Leading distributed cloud infrastructure and kubernetes services.",
        "responsibilities": ["Architect microservices", "Lead 6 engineers"],
        "requiredSkills": ["Python", "Kubernetes", "AWS"],
        "preferredSkills": ["Terraform", "PostgreSQL"],
        "minExperienceYears": 5.0,
        "educationRequirements": ["B.S. in Computer Science"],
        "certifications": ["AWS Certified Solutions Architect"],
        "scoringWeights": {
            "requiredSkills": 40.0,
            "experience": 25.0,
            "projects": 20.0,
            "educationCerts": 15.0
        }
    }
    create_resp = client.post("/api/v1/jobs", json=job_payload, headers=auth_headers_user_a)
    assert create_resp.status_code == 201
    job_id = create_resp.json()["id"]

    # 2. User A can view their own job
    get_a_resp = client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers_user_a)
    assert get_a_resp.status_code == 200

    # 3. User B attempts to view User A's job -> 403 Forbidden
    get_b_resp = client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers_user_b)
    assert get_b_resp.status_code == 403

    # 4. User B attempts to edit User A's job -> 403 Forbidden
    put_b_resp = client.put(f"/api/v1/jobs/{job_id}", json={"title": "Hacked Title"}, headers=auth_headers_user_b)
    assert put_b_resp.status_code == 403

    # 5. User B attempts to delete User A's job -> 403 Forbidden
    del_b_resp = client.delete(f"/api/v1/jobs/{job_id}", headers=auth_headers_user_b)
    assert del_b_resp.status_code == 403

    # Verify job remained unchanged
    verify_resp = client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers_user_a)
    assert verify_resp.json()["title"] == "Confidential Staff Lead Engineer"
