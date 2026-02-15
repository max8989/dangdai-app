"""Health check endpoint for container orchestration."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint for container orchestration.

    Returns:
        dict: Health status response.
    """
    return {"status": "healthy"}
