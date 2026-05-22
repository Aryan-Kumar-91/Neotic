from fastapi.testclient import TestClient
from server import APP

client = TestClient(APP)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_invalid_endpoint():
    response = client.get("/api/invalid-endpoint-that-does-not-exist")
    assert response.status_code == 404
