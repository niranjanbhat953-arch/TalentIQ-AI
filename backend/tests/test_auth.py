def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_missing_auth_token_rejected(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "Missing Authorization header" in response.json()["detail"]

def test_invalid_auth_token_rejected(client):
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer bad-token"}
    )
    assert response.status_code == 401

def test_valid_auth_token_derives_identity(client, auth_headers_user_a):
    response = client.get("/api/v1/auth/me", headers=auth_headers_user_a)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "recruiter_alpha_123"
    assert "recruiter_alpha_123" in data["email"]
