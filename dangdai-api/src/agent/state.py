"""Graph state definitions.

Define state structures for the LangGraph quiz generation graph.
"""

from __future__ import annotations

from typing import Any, TypedDict


class QuizGenerationState(TypedDict, total=False):
    """State for the quiz generation graph.

    Required fields (set at invocation):
        chapter_id, book_id, exercise_type, user_id

    Optional fields (populated by graph nodes):
        retrieved_content, weakness_profile, questions,
        validation_errors, retry_count, quiz_payload
    """

    # Input (set at invocation)
    chapter_id: int
    book_id: int
    exercise_type: str  # one of 7 types or "mixed"
    user_id: str

    # RAG output (set by retrieve_content node)
    retrieved_content: list[dict[str, Any]]

    # Weakness profile (set by query_weakness node)
    weakness_profile: dict[str, Any]

    # Generation output (set by generate_quiz node)
    questions: list[dict[str, Any]]

    # Validation (set by validate_structure and evaluate_content nodes)
    validation_errors: list[str]
    retry_count: int

    # Evaluator feedback for self-correction (set by evaluate_content node)
    evaluator_feedback: str

    # Final output (set on successful content evaluation)
    quiz_payload: dict[str, Any]
