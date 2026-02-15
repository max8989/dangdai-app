"""FastAPI application entry point for Dangdai API."""

from fastapi import FastAPI

from src.api.routes import health

app = FastAPI(
    title="Dangdai API",
    description="Python backend for Dangdai Chinese learning app with LangGraph quiz generation",
    version="0.1.0",
)

# Register routes
app.include_router(health.router, tags=["health"])
