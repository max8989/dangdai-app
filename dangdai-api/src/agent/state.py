"""Graph state definitions.

This module defines the state structures for the LangGraph quiz generation graph.
"""

from typing import TypedDict


class QuizGenerationState(TypedDict):
    """State for the quiz generation graph."""

    chapter_id: int
    book_id: int
    quiz_type: str
    retrieved_content: str
    generated_questions: list
    validated_questions: list
