"""FastAPI middleware.

This module provides CORS configuration, request logging, and error handling.
"""

import logging
import time
from typing import Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log every incoming request and outgoing response with timing."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:  # type: ignore[override]
        """Process and log the request/response cycle.

        Args:
            request: The incoming HTTP request.
            call_next: The next middleware or route handler.

        Returns:
            The HTTP response.
        """
        start = time.perf_counter()
        method = request.method
        path = request.url.path
        client = request.client.host if request.client else "unknown"

        logger.info(
            "[REQ] %s %s from %s",
            method,
            path,
            client,
        )

        try:
            response = await call_next(request)
        except Exception:
            elapsed = (time.perf_counter() - start) * 1000
            logger.exception(
                "[ERR] %s %s — unhandled exception after %.0fms",
                method,
                path,
                elapsed,
            )
            raise

        elapsed = (time.perf_counter() - start) * 1000
        logger.info(
            "[RES] %s %s — %d in %.0fms",
            method,
            path,
            response.status_code,
            elapsed,
        )
        return response


def setup_middleware(app: FastAPI) -> None:
    """Configure middleware for the FastAPI application.

    Args:
        app: The FastAPI application instance.
    """
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
