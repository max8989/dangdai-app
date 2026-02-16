"""Health check endpoint for container orchestration."""

from fastapi import APIRouter

from src.api.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint for container orchestration.

    Returns:
        HealthResponse: Health status response.
    """
    return HealthResponse(status="healthy")
