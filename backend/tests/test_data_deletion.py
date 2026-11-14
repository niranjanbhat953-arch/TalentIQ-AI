def test_deletion_requires_explicit_confirmation(client, auth_headers_user_a):
    bad_req = {
        "scope": "FULL_ACCOUNT_DATA",
        "confirmationText": "yes"
    }
    resp = client.post("/api/v1/settings/delete-data", json=bad_req, headers=auth_headers_user_a)
    assert resp.status_code == 400
    assert "Confirmation text must equal 'DELETE'" in resp.json()["detail"]

def test_job_and_results_deletion_workflow(client, auth_headers_user_a):
    # Create job
    job_payload = {
        "title": "Temporary Job To Delete",
        "department": "QA",
        "location": "Remote",
        "description": "Short-lived job to test full cascading deletion workflow.",
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

    # Delete job via settings data deletion endpoint
    del_req = {
        "scope": "JOB_AND_RESULTS",
        "resourceId": job_id,
        "confirmationText": "DELETE"
    }
    del_resp = client.post("/api/v1/settings/delete-data", json=del_req, headers=auth_headers_user_a)
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True

    # Verify job is gone
    get_resp = client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers_user_a)
    assert get_resp.status_code == 404
