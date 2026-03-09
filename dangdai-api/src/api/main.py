"""FastAPI application entry point for Dangdai API."""

import logging
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.api.middleware import setup_middleware
from src.api.routes import health, quizzes

# Configure root logger so all src.* loggers output to console
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-5s [%(name)s] %(message)s",
    datefmt="%H:%M:%S",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan: log LLM provider on startup."""
    provider = os.getenv("LLM_PROVIDER", "azure_openai")
    model = os.getenv("LLM_MODEL", "(default)")
    logger.info("Using LLM provider: %s with model: %s", provider, model)
    yield


app = FastAPI(
    title="Dangdai API",
    description="Python backend for Dangdai Chinese learning app with LangGraph quiz generation",
    version="0.1.0",
    lifespan=lifespan,
)

# Setup middleware (CORS, error handling)
setup_middleware(app)

# Register routes
app.include_router(health.router, tags=["health"])
app.include_router(quizzes.router, tags=["quizzes"])
