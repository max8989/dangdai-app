"""FastAPI application entry point for Dangdai API."""

from fastapi import FastAPI

from src.api.middleware import setup_middleware
from src.api.routes import health, quizzes

app = FastAPI(
    title="Dangdai API",
    description="Python backend for Dangdai Chinese learning app with LangGraph quiz generation",
    version="0.1.0",
)

# Setup middleware (CORS, error handling)
setup_middleware(app)

# Register routes
app.include_router(health.router, tags=["health"])
app.include_router(quizzes.router, tags=["quizzes"])
