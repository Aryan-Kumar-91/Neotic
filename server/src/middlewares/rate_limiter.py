"""
Rate Limiting Middleware for the Neotic Backend.
Implements an in-memory sliding-window rate limiter per client IP.
"""

import os
import time
from collections import defaultdict
from threading import Lock
from typing import Dict, List, Optional, Set

# pylint: disable=import-error
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware that tracks and restricts requests per client IP.
    """

    def __init__(
        self,
        app: FastAPI,
        rate_limit: Optional[int] = None,
        window_seconds: Optional[int] = None,
        excluded_paths: Optional[Set[str]] = None,
    ):
        super().__init__(app)
        self.rate_limit = (
            rate_limit
            if rate_limit is not None
            else int(os.environ.get("RATE_LIMIT_REQUESTS", "30"))
        )
        self.window_seconds = (
            window_seconds
            if window_seconds is not None
            else int(os.environ.get("RATE_LIMIT_WINDOW_SECONDS", "60"))
        )
        self.excluded_paths: Set[str] = excluded_paths or {
            "/api/health",
            "/docs",
            "/openapi.json",
            "/redoc",
            "/favicon.ico",
        }
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self._lock = Lock()
        self._last_cleanup = time.time()

    def reset(self) -> None:
        """Clear all recorded request timestamps (useful for testing)."""
        with self._lock:
            self._requests.clear()
            self._last_cleanup = time.time()

    def _cleanup_stale_ips(self, now: float) -> None:
        """Remove IPs that have no timestamps within the active sliding window."""
        cutoff = now - self.window_seconds
        stale_keys = [
            ip
            for ip, timestamps in self._requests.items()
            if not timestamps or timestamps[-1] < cutoff
        ]
        for ip in stale_keys:
            del self._requests[ip]

    def _get_client_ip(self, request: Request) -> str:
        """Resolve client IP from forwarded headers or direct connection."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            first_ip = forwarded.split(",")[0].strip()
            if first_ip:
                return first_ip
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    async def dispatch(self, request: Request, call_next) -> Response:
        """Inspect each request and enforce rate limits."""
        path = request.url.path

        # Skip rate-limiting for excluded health, docs, and static routes
        if path in self.excluded_paths or not path.startswith("/api/"):
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        now = time.time()
        cutoff = now - self.window_seconds

        with self._lock:
            # Clean up old timestamps for this IP
            active_timestamps = [t for t in self._requests[client_ip] if t > cutoff]
            self._requests[client_ip] = active_timestamps

            # Periodically prune stale IPs every 5 minutes
            if now - self._last_cleanup > 300:
                self._cleanup_stale_ips(now)
                self._last_cleanup = now

            if len(active_timestamps) >= self.rate_limit:
                oldest = active_timestamps[0]
                retry_after = max(1, int(self.window_seconds - (now - oldest)))
                reset_time = int(oldest + self.window_seconds)

                headers = {
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(self.rate_limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_time),
                }
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": (
                            "Rate limit exceeded. "
                            f"Maximum {self.rate_limit} requests allowed per "
                            f"{self.window_seconds} seconds. Please wait before retrying."
                        )
                    },
                    headers=headers,
                )

            # Record this request
            self._requests[client_ip].append(now)
            remaining = max(0, self.rate_limit - len(self._requests[client_ip]))
            reset_time = int(now + self.window_seconds)

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.rate_limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_time)
        return response


# Shared singleton instance for configuration and testing
RATE_LIMITER: Optional[RateLimiterMiddleware] = None


def setup_rate_limiter(
    app: FastAPI,
    rate_limit: Optional[int] = None,
    window_seconds: Optional[int] = None,
) -> RateLimiterMiddleware:
    """
    Mount the rate limiter middleware onto the FastAPI application.
    """
    global RATE_LIMITER  # pylint: disable=global-statement
    middleware = RateLimiterMiddleware(
        app,
        rate_limit=rate_limit,
        window_seconds=window_seconds,
    )
    app.add_middleware(
        RateLimiterMiddleware,
        rate_limit=rate_limit,
        window_seconds=window_seconds,
    )
    RATE_LIMITER = middleware
    return middleware
