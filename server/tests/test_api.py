"""
API Tests for the FastAPI backend.
"""
# pylint: disable=import-error
from fastapi.testclient import TestClient
from server import APP

CLIENT = TestClient(APP)

def test_health_check():
    """Test the /api/health endpoint to ensure the server is running."""
    response = CLIENT.get("/api/health")
    assert response.status_code == 200  # nosec B101
    assert response.json() == {"status": "healthy"}  # nosec B101

def test_invalid_endpoint():
    """Test that an invalid endpoint returns a 404 status code."""
    response = CLIENT.get("/api/invalid-endpoint-that-does-not-exist")
    assert response.status_code == 404  # nosec B101
