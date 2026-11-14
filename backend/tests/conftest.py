import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import db

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def auth_headers_user_a():
    return {"Authorization": "Bearer dev-token-recruiter_alpha_123"}

@pytest.fixture
def auth_headers_user_b():
    return {"Authorization": "Bearer dev-token-recruiter_beta_456"}
