"""
API Tests for the FastAPI backend including rate limiting and validation.
"""

import os

# Set fallback dummy API key before module imports for test environment
os.environ.setdefault("GOOGLE_API_KEY", "dummy-api-key-for-testing")

# pylint: disable=import-error
from fastapi.testclient import TestClient
from server import APP
from src.middlewares.rate_limiter import RATE_LIMITER

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


def test_rate_limit_headers():
    """Test that API responses include rate limit headers."""
    response = CLIENT.post(
        "/api/chat",
        json={"prompt": ""},
        headers={"X-Forwarded-For": "192.168.1.100"},
    )
    assert "X-RateLimit-Limit" in response.headers
    assert "X-RateLimit-Remaining" in response.headers
    assert "X-RateLimit-Reset" in response.headers


def test_rate_limit_exceeded():
    """Test that exceeding the rate limit returns 429 Too Many Requests."""
    if RATE_LIMITER:
        RATE_LIMITER.reset()

    test_ip = "203.0.113.42"
    limit = RATE_LIMITER.rate_limit if RATE_LIMITER else 30

    # Exhaust quota
    for _ in range(limit):
        res = CLIENT.post(
            "/api/chat",
            json={"prompt": ""},
            headers={"X-Forwarded-For": test_ip},
        )
        assert res.status_code != 429  # nosec B101

    # Next request should be rate limited
    blocked_res = CLIENT.post(
        "/api/chat",
        json={"prompt": ""},
        headers={"X-Forwarded-For": test_ip},
    )
    assert blocked_res.status_code == 429  # nosec B101
    assert "Retry-After" in blocked_res.headers
    assert "Rate limit exceeded" in blocked_res.json()["detail"]

    # Different IP should not be blocked
    other_ip_res = CLIENT.post(
        "/api/chat",
        json={"prompt": ""},
        headers={"X-Forwarded-For": "203.0.113.99"},
    )
    assert other_ip_res.status_code != 429  # nosec B101


def test_chat_empty_prompt_validation():
    """Test that empty or whitespace prompt returns 400 Bad Request."""
    response = CLIENT.post(
        "/api/chat",
        json={"prompt": "   "},
        headers={"X-Forwarded-For": "10.0.0.1"},
    )
    assert response.status_code == 400  # nosec B101
    assert "Prompt cannot be empty" in response.json()["detail"]


def test_chat_oversized_prompt_validation():
    """Test that prompt exceeding 32,000 characters returns 400 Bad Request."""
    huge_prompt = "A" * 32_001
    response = CLIENT.post(
        "/api/chat",
        json={"prompt": huge_prompt},
        headers={"X-Forwarded-For": "10.0.0.2"},
    )
    assert response.status_code == 400  # nosec B101
    assert "exceeds maximum allowed length" in response.json()["detail"]


def test_chat_too_many_files_validation():
    """Test that attaching more than 10 files returns 400 Bad Request."""
    files = [
        {"name": f"file_{i}.txt", "mime_type": "text/plain", "data": "dGVzdA=="}
        for i in range(11)
    ]
    response = CLIENT.post(
        "/api/chat",
        json={"prompt": "Summarize these files", "files": files},
        headers={"X-Forwarded-For": "10.0.0.3"},
    )
    assert response.status_code == 400  # nosec B101
    assert "Maximum 10 files" in response.json()["detail"]


def test_chat_stream_endpoint():
    """Test that the streaming endpoint returns SSE format with thought events."""
    response = CLIENT.post(
        "/api/chat/stream",
        json={"prompt": "Test streaming reasoning"},
        headers={"X-Forwarded-For": "10.0.0.5"},
    )
    assert response.status_code == 200  # nosec B101
    assert "text/event-stream" in response.headers.get("content-type", "")
    assert "event: thought" in response.text
