"""Quiz API endpoints.

POST /api/quizzes - Generate a new quiz
GET /api/quizzes/{id} - Get quiz by ID
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])


@router.post("")
async def create_quiz() -> dict:
    """Generate a new quiz.

    Returns:
        dict: Quiz generation response.
    """
    # TODO: Implement in future story
    raise NotImplementedError("Quiz creation not yet implemented")


@router.get("/{quiz_id}")
async def get_quiz(quiz_id: str) -> dict:
    """Get a quiz by ID.

    Args:
        quiz_id: The quiz identifier.

    Returns:
        dict: Quiz data.
    """
    # TODO: Implement in future story
    raise NotImplementedError("Quiz retrieval not yet implemented")
