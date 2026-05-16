"""Graph state definitions.

Define state structures for the LangGraph quiz generation graph.
"""

from __future__ import annotations

from typing import Any, TypedDict

from starlette.requests import Request


class QuizGenerationState(TypedDict, total=False):
    """State for the quiz generation graph.

    Required fields (set at invocation):
        chapter_id, book_id, exercise_type, user_id

    Optional fields (populated by graph nodes):
        retrieved_content, weakness_profile, questions,
        validation_errors, retry_count, quiz_payload, request,
        generation_tier
    """

    # Input (set at invocation)
    chapter_id: int
    book_id: int
    exercise_type: str  # one of 7 types or "mixed"
    user_id: str

    # HTTP request object for client disconnection detection (optional).
    # When present, graph nodes check request.is_disconnected() before
    # expensive operations (LLM calls, database queries) to abort early
    # if the client has navigated away.
    request: Request

    # Tier routing (set by route_by_tier node — Story 4.15)
    # Values: "tier1" (algorithmic) | "tier2" (single LLM) | "mixed"
    generation_tier: str

    # RAG output (set by retrieve_content node — supplementary only)
    retrieved_content: list[dict[str, Any]]

    # Structured content (set by retrieve_structured_content node)
    structured_content: dict[str, Any]  # {vocabulary, grammar_points, dialogues}
    grammar_points_list: list[dict[str, Any]]  # For grammar coverage validation

    # Weakness profile (set by query_weakness node)
    weakness_profile: dict[str, Any]

    # Generation output (set by generate_quiz or algorithmic_generate node)
    questions: list[dict[str, Any]]

    # Validation (set by validate_structure node)
    validation_errors: list[str]
    retry_count: int

    # Final output (set on successful validation)
    quiz_payload: dict[str, Any]

    # Diversity controls (set by the custom quiz path; optional otherwise).
    # When present, generate_quiz injects them into the Tier 2 prompt so the
    # LLM produces noticeably different questions across runs and avoids
    # repeating texts the client has already seen.
    diversity_seed: int
    avoid_question_texts: list[str]
    generation_temperature: float
