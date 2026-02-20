"""LangGraph graph nodes.

Implement nodes for the quiz generation graph:
- retrieve_content: RAG retrieval node
- query_weakness: Weakness profile node
- generate_quiz: Quiz generation via LLM
- validate_quiz: Self-check validation node
"""

from __future__ import annotations

import json
import logging
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from src.agent.prompts import (
    EXERCISE_TYPE_INSTRUCTIONS,
    QUIZ_GENERATION_PROMPT,
    SYSTEM_PROMPT,
)
from src.agent.state import QuizGenerationState
from src.repositories.chapter_repo import ChapterRepository
from src.services.rag_service import RagService
from src.services.weakness_service import WeaknessService
from src.utils.llm import get_llm_client

logger = logging.getLogger(__name__)

# Maximum number of validation/regeneration retries
MAX_RETRIES = 2


def retrieve_content(state: QuizGenerationState) -> dict[str, Any]:
    """Retrieve chapter content via RAG service with fallback strategy.

    Args:
        state: Current graph state with chapter_id, book_id, exercise_type.

    Returns:
        State update with retrieved_content.
    """
    book_id = state["book_id"]
    chapter_id = state["chapter_id"]
    exercise_type = state["exercise_type"]

    _, lesson = ChapterRepository.parse_chapter_id(chapter_id)

    rag_service = RagService()

    if exercise_type == "mixed":
        # Get available types and retrieve content for each
        chapter_repo = ChapterRepository()
        available_types = chapter_repo.get_available_exercise_types(book_id, lesson)
        if not available_types:
            available_types = ["vocabulary", "grammar", "fill_in_blank"]
        chunks = rag_service.retrieve_mixed_content(book_id, lesson, available_types)
    else:
        chunks = rag_service.retrieve_content(book_id, lesson, exercise_type)

    logger.info(
        "Retrieved %d content chunks for book=%d, lesson=%d, type=%s",
        len(chunks),
        book_id,
        lesson,
        exercise_type,
    )

    return {"retrieved_content": chunks}


def query_weakness(state: QuizGenerationState) -> dict[str, Any]:
    """Query user weakness profile for adaptive quiz generation.

    Args:
        state: Current graph state with user_id.

    Returns:
        State update with weakness_profile.
    """
    user_id = state.get("user_id", "")

    weakness_service = WeaknessService()
    profile = weakness_service.get_weakness_profile(user_id)

    logger.info("Weakness profile for user %s: %s", user_id, profile)

    return {"weakness_profile": profile}


def generate_quiz(state: QuizGenerationState) -> dict[str, Any]:
    """Generate quiz questions using LLM with structured output.

    Args:
        state: Current graph state with retrieved_content, exercise_type,
               weakness_profile.

    Returns:
        State update with questions list.
    """
    book_id = state["book_id"]
    chapter_id = state["chapter_id"]
    exercise_type = state["exercise_type"]
    retrieved_content = state.get("retrieved_content", [])
    weakness_profile = state.get("weakness_profile", {})

    _, lesson = ChapterRepository.parse_chapter_id(chapter_id)

    # Prepare chapter content text from RAG chunks
    chapter_content = _format_chapter_content(retrieved_content)

    # Get exercise-type-specific instructions
    if exercise_type == "mixed":
        # For mixed, combine instructions for multiple types
        exercise_instructions = "\n\n".join(
            f"### {etype.upper()} Questions:\n{instructions}"
            for etype, instructions in EXERCISE_TYPE_INSTRUCTIONS.items()
            if etype in ["vocabulary", "grammar", "fill_in_blank", "matching"]
        )
    else:
        exercise_instructions = EXERCISE_TYPE_INSTRUCTIONS.get(
            exercise_type,
            EXERCISE_TYPE_INSTRUCTIONS["vocabulary"],
        )

    # Build weakness context
    weakness_context = ""
    weak_types = weakness_profile.get("weak_exercise_types", [])
    if weak_types:
        weakness_context = (
            f"## Student Weakness Profile\n"
            f"The student struggles with: {', '.join(weak_types)}.\n"
            f"Bias question difficulty toward these weak areas when possible."
        )

    # Determine question count
    question_count = 12 if exercise_type != "reading_comprehension" else 5

    # Build output schema hint
    output_schema = _get_output_schema_hint(exercise_type)

    # Format the generation prompt
    prompt_text = QUIZ_GENERATION_PROMPT.format(
        question_count=question_count,
        exercise_type=exercise_type,
        book_id=book_id,
        lesson=lesson,
        exercise_type_instructions=exercise_instructions,
        chapter_content=chapter_content,
        weakness_context=weakness_context,
        output_schema=output_schema,
    )

    # Call LLM
    llm = get_llm_client()
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=prompt_text),
    ]

    try:
        response = llm.invoke(messages)
        content = (
            response.content
            if isinstance(response.content, str)
            else str(response.content)
        )

        # Parse JSON from response
        questions = _parse_questions_json(content)

        logger.info(
            "Generated %d questions for exercise_type=%s", len(questions), exercise_type
        )
        return {"questions": questions}

    except Exception as e:
        logger.error("LLM generation failed: %s", e)
        return {"questions": [], "validation_errors": [f"LLM generation failed: {e}"]}


def validate_quiz(state: QuizGenerationState) -> dict[str, Any]:
    """Validate generated quiz questions for quality and correctness.

    Performs rule-based validation:
    - Correct answers exist
    - Options are distinct
    - No duplicate questions
    - Required fields present

    Args:
        state: Current graph state with questions.

    Returns:
        State update with validation_errors and retry_count.
    """
    questions = state.get("questions", [])
    retry_count = state.get("retry_count", 0)
    errors: list[str] = []

    if not questions:
        errors.append("No questions were generated")
        return {
            "validation_errors": errors,
            "retry_count": retry_count + 1,
        }

    seen_texts: set[str] = set()

    for i, q in enumerate(questions):
        qid = q.get("question_id", f"q{i + 1}")

        # Check required base fields
        for field in ["question_text", "correct_answer", "exercise_type"]:
            if not q.get(field):
                errors.append(f"{qid}: missing required field '{field}'")

        # Check for duplicate question text
        qtext = q.get("question_text", "")
        if qtext in seen_texts:
            errors.append(f"{qid}: duplicate question text")
        seen_texts.add(qtext)

        # Check options are distinct (for types that have options)
        options = q.get("options", [])
        if options and len(options) != len(set(options)):
            errors.append(f"{qid}: duplicate options found")

        # Check correct answer is in options (for MC types)
        correct = q.get("correct_answer", "")
        if options and correct and correct not in options:
            errors.append(f"{qid}: correct_answer not in options")

        # Check explanation exists
        if not q.get("explanation"):
            errors.append(f"{qid}: missing explanation")

    if errors:
        logger.warning("Validation found %d errors: %s", len(errors), errors)

    return {
        "validation_errors": errors,
        "retry_count": retry_count + (1 if errors else 0),
        "quiz_payload": {"questions": questions} if not errors else {},
    }


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------


def _format_chapter_content(chunks: list[dict[str, Any]]) -> str:
    """Format RAG chunks into a readable text block for the LLM.

    Args:
        chunks: List of content chunk dictionaries.

    Returns:
        Formatted string of chapter content.
    """
    if not chunks:
        return "(No chapter content available)"

    sections: list[str] = []
    for chunk in chunks:
        section = chunk.get("section", "")
        content = chunk.get("content", "")
        exercise_type = chunk.get("exercise_type", "")
        topic = chunk.get("topic", "")

        header_parts = [p for p in [section, exercise_type, topic] if p]
        header = " | ".join(header_parts) if header_parts else "Content"
        sections.append(f"### {header}\n{content}")

    return "\n\n".join(sections)


def _get_output_schema_hint(exercise_type: str) -> str:
    """Get a JSON schema hint for the LLM output format.

    Args:
        exercise_type: The exercise type.

    Returns:
        Schema hint string.
    """
    base = (
        '{"question_id": "q1", "exercise_type": "<type>", '
        '"question_text": "...", "correct_answer": "...", '
        '"explanation": "...", "source_citation": "..."'
    )

    type_fields: dict[str, str] = {
        "vocabulary": ', "character": "...", "pinyin": "...", "meaning": "...", '
        '"question_subtype": "char_to_meaning", "options": ["a", "b", "c", "d"]}',
        "grammar": ', "sentence": "...", "options": ["a", "b", "c", "d"], '
        '"grammar_point": "..."}',
        "fill_in_blank": ', "sentence_with_blank": "I ___ Chinese", '
        '"word_bank": ["study", "eat", "read"], "blank_positions": [1]}',
        "matching": ', "left_items": ["A", "B"], "right_items": ["1", "2"], '
        '"correct_pairs": [[0, 0], [1, 1]]}',
        "dialogue_completion": ', "dialogue_bubbles": [{"speaker": "A", "text": "...", '
        '"is_blank": false}], "options": ["a", "b", "c", "d"]}',
        "sentence_construction": ', "scrambled_words": ["word1", "word2"], '
        '"correct_order": [1, 0]}',
        "reading_comprehension": ', "passage": "...", '
        '"comprehension_questions": [{"question": "...", '
        '"options": ["a", "b", "c", "d"], "correct": 0}]}',
    }

    suffix = type_fields.get(exercise_type, "}")
    return base + suffix


def _parse_questions_json(content: str) -> list[dict[str, Any]]:
    """Parse JSON question array from LLM response text.

    Handles cases where the JSON is wrapped in markdown code blocks.

    Args:
        content: Raw LLM response text.

    Returns:
        Parsed list of question dictionaries.
    """
    # Strip markdown code blocks if present
    text = content.strip()
    if text.startswith("```"):
        # Remove opening code fence
        first_newline = text.index("\n") if "\n" in text else len(text)
        text = text[first_newline + 1 :]
        # Remove closing code fence
        if text.rstrip().endswith("```"):
            text = text.rstrip()[:-3].rstrip()

    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
        if isinstance(parsed, dict) and "questions" in parsed:
            return parsed["questions"]
        return [parsed]
    except json.JSONDecodeError as e:
        logger.error("Failed to parse LLM JSON response: %s", e)
        return []
