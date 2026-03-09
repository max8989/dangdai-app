"""LangGraph graph nodes.

Implement nodes for the quiz generation graph:
- retrieve_content: RAG retrieval node
- query_weakness: Weakness profile node
- generate_quiz: Quiz generation via LLM
- validate_structure: Rule-based structural validation node
- evaluate_content: LLM-based content quality evaluation node
"""

from __future__ import annotations

import json
import logging
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from src.agent.prompts import (
    CONTENT_EVALUATION_PROMPT,
    CONTENT_EVALUATION_SYSTEM_PROMPT,
    EXERCISE_TYPE_INSTRUCTIONS,
    QUIZ_GENERATION_PROMPT,
    SYSTEM_PROMPT,
)
from src.agent.state import QuizGenerationState
from src.repositories.chapter_repo import ChapterRepository
from src.services.rag_service import RagService
from src.services.weakness_service import WeaknessService
from src.utils.llm_factory import get_llm

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
    import time

    start = time.perf_counter()
    book_id = state["book_id"]
    chapter_id = state["chapter_id"]
    exercise_type = state["exercise_type"]

    logger.info(
        "[Node:retrieve_content] START book=%d chapter=%d type=%s",
        book_id,
        chapter_id,
        exercise_type,
    )

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

    elapsed = (time.perf_counter() - start) * 1000
    logger.info(
        "[Node:retrieve_content] DONE %d chunks in %.0fms for book=%d, lesson=%d, type=%s",
        len(chunks),
        elapsed,
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


async def generate_quiz(state: QuizGenerationState) -> dict[str, Any]:
    """Generate quiz questions using LLM with structured output.

    Args:
        state: Current graph state with retrieved_content, exercise_type,
               weakness_profile.

    Returns:
        State update with questions list.
    """
    import time

    start = time.perf_counter()
    book_id = state["book_id"]
    chapter_id = state["chapter_id"]
    exercise_type = state["exercise_type"]
    retrieved_content = state.get("retrieved_content", [])
    weakness_profile = state.get("weakness_profile", {})

    logger.info(
        "[Node:generate_quiz] START type=%s chunks=%d retry=%d",
        exercise_type,
        len(retrieved_content),
        state.get("retry_count", 0),
    )

    _, lesson = ChapterRepository.parse_chapter_id(chapter_id)

    # Prepare chapter content text from RAG chunks
    chapter_content = _format_chapter_content(retrieved_content)

    # Get exercise-type-specific instructions, biased toward weak areas (AC #2)
    if exercise_type == "mixed":
        weak_types: list[str] = weakness_profile.get("weak_exercise_types", [])
        # Select types biased toward weaknesses
        weakness_service = WeaknessService()
        all_mixed_types = list(EXERCISE_TYPE_INSTRUCTIONS.keys())
        selected_types = weakness_service.select_mixed_exercise_types(
            weakness_profile, all_mixed_types, count=4
        )
        if not selected_types:
            selected_types = ["vocabulary", "grammar", "fill_in_blank", "matching"]
        exercise_instructions = "\n\n".join(
            f"### {etype.upper()} Questions:\n{EXERCISE_TYPE_INSTRUCTIONS[etype]}"
            for etype in selected_types
            if etype in EXERCISE_TYPE_INSTRUCTIONS
        )
    else:
        weak_types = weakness_profile.get("weak_exercise_types", [])
        exercise_instructions = EXERCISE_TYPE_INSTRUCTIONS.get(
            exercise_type,
            EXERCISE_TYPE_INSTRUCTIONS["vocabulary"],
        )

    # Build weakness context
    weakness_context = ""
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

    # Append evaluator feedback for self-correction on retry
    evaluator_feedback = state.get("evaluator_feedback", "")
    if evaluator_feedback:
        prompt_text += (
            "\n\n## CRITICAL: Previous Attempt Failed Content Evaluation\n"
            "The following issues were found in your previous generation. "
            "You MUST fix ALL of these issues in this attempt:\n\n"
            f"{evaluator_feedback}\n\n"
            "Pay special attention to:\n"
            "- Use ONLY Traditional Chinese characters (繁體字) — NEVER Simplified\n"
            "- Pinyin MUST use tone diacritics (nǐ, xué) — NEVER tone numbers\n"
            "- question_text MUST be in English — NEVER in Chinese\n"
        )

    # Call LLM asynchronously
    llm = get_llm()
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=prompt_text),
    ]

    try:
        llm_start = time.perf_counter()
        logger.info("[Node:generate_quiz] Calling LLM...")
        response = await llm.ainvoke(messages)
        llm_elapsed = (time.perf_counter() - llm_start) * 1000
        logger.info("[Node:generate_quiz] LLM responded in %.0fms", llm_elapsed)

        # Log token usage if available
        usage = getattr(response, "usage_metadata", None)
        if usage:
            logger.info(
                "[Node:generate_quiz] Token usage: input=%s output=%s total=%s",
                usage.get("input_tokens", "?"),
                usage.get("output_tokens", "?"),
                usage.get("total_tokens", "?"),
            )

        content = (
            response.content
            if isinstance(response.content, str)
            else str(response.content)
        )

        # Parse JSON from response
        questions = _parse_questions_json(content)

        elapsed = (time.perf_counter() - start) * 1000
        logger.info(
            "[Node:generate_quiz] DONE %d questions in %.0fms (LLM=%.0fms)",
            len(questions),
            elapsed,
            llm_elapsed,
        )
        return {"questions": questions}

    except Exception as e:
        elapsed = (time.perf_counter() - start) * 1000
        logger.error(
            "[Node:generate_quiz] FAILED after %.0fms: %s: %s",
            elapsed,
            type(e).__name__,
            e,
        )
        return {"questions": [], "validation_errors": [f"LLM generation failed: {e}"]}


def validate_structure(state: QuizGenerationState) -> dict[str, Any]:
    """Validate generated quiz questions for structural correctness.

    Performs rule-based validation (no LLM call):
    - Correct answers exist
    - Options are distinct
    - No duplicate questions
    - Required fields present

    Questions that fail validation are dropped rather than failing the entire
    quiz. Only triggers a retry if zero valid questions remain.

    Content quality checks (Traditional Chinese, pinyin, etc.) are handled
    by the evaluate_content node downstream.

    Args:
        state: Current graph state with questions.

    Returns:
        State update with valid questions, validation_errors, and retry_count.
    """
    questions = state.get("questions", [])
    retry_count = state.get("retry_count", 0)
    errors: list[str] = []
    valid_questions: list[dict[str, Any]] = []

    logger.info(
        "[Node:validate_structure] START questions=%d retry=%d",
        len(questions),
        retry_count,
    )

    if not questions:
        errors.append("No questions were generated")
        logger.warning("[Node:validate_structure] No questions to validate")
        return {
            "validation_errors": errors,
            "retry_count": retry_count + 1,
        }

    seen_texts: set[str] = set()

    for i, q in enumerate(questions):
        qid = q.get("question_id", f"q{i + 1}")
        question_errors: list[str] = []

        # Check required base fields
        for field in ["question_text", "correct_answer", "exercise_type"]:
            if not q.get(field):
                question_errors.append(f"{qid}: missing required field '{field}'")

        # Check for duplicate question text
        qtext = q.get("question_text", "")
        if qtext in seen_texts:
            question_errors.append(f"{qid}: duplicate question text")
        seen_texts.add(qtext)

        # Check options are distinct (for types that have options)
        options = q.get("options", [])
        if options and len(options) != len(set(options)):
            question_errors.append(f"{qid}: duplicate options found")

        # Check correct answer is in options (for MC types)
        correct = q.get("correct_answer", "")
        if options and correct and correct not in options:
            question_errors.append(f"{qid}: correct_answer not in options")

        # Check explanation exists
        if not q.get("explanation"):
            question_errors.append(f"{qid}: missing explanation")

        if question_errors:
            errors.extend(question_errors)
            logger.warning(
                "[Node:validate_structure] Dropping %s: %s", qid, question_errors
            )
        else:
            valid_questions.append(q)

    dropped = len(questions) - len(valid_questions)
    if dropped > 0:
        logger.warning(
            "[Node:validate_structure] DONE — dropped %d/%d questions, %d valid: %s",
            dropped,
            len(questions),
            len(valid_questions),
            errors,
        )
    else:
        logger.info(
            "[Node:validate_structure] DONE — all %d questions passed",
            len(questions),
        )

    # Only trigger retry if no valid questions remain
    needs_retry = len(valid_questions) == 0

    return {
        "questions": valid_questions,
        "validation_errors": errors if needs_retry else [],
        "retry_count": retry_count + (1 if needs_retry else 0),
    }


async def evaluate_content(state: QuizGenerationState) -> dict[str, Any]:
    """Evaluate generated quiz content quality using LLM as judge.

    Checks 5 rules via an LLM evaluator:
    1. Traditional Chinese only (no Simplified)
    2. Pinyin uses tone diacritics (not tone numbers)
    3. question_text is in English (not Chinese)
    4. Curriculum alignment (content from specified chapter)
    5. Pedagogical quality (plausible distractors, good explanations)

    On failure, sets evaluator_feedback for the generator to self-correct.
    If the evaluator LLM itself fails, defaults to pass (don't block the quiz).

    Performance Budget:
    - Latency: ~1-2 seconds per evaluation (LLM call)
    - Cost: ~$0.005 per evaluation (varies by LLM model)
    - Happy path: 0 retries (4-7s total quiz generation)
    - With 1 retry: ~8-12s total (within 30s service timeout)

    Args:
        state: Current graph state with questions from generate_quiz.

    Returns:
        State update with validation_errors, evaluator_feedback,
        retry_count, and quiz_payload.
    """
    import time

    start = time.perf_counter()
    questions = state.get("questions", [])
    retry_count = state.get("retry_count", 0)

    # Skip evaluation if structural validation already failed
    structural_errors = state.get("validation_errors", [])
    if structural_errors:
        logger.info("[Node:evaluate_content] SKIPPED — structural errors present")
        return {}

    logger.info(
        "[Node:evaluate_content] START evaluating %d questions (retry=%d)",
        len(questions),
        retry_count,
    )

    try:
        questions_json = json.dumps(questions, ensure_ascii=False, indent=2)

        prompt_text = CONTENT_EVALUATION_PROMPT.format(
            questions_json=questions_json,
        )

        llm = get_llm()
        messages = [
            SystemMessage(content=CONTENT_EVALUATION_SYSTEM_PROMPT),
            HumanMessage(content=prompt_text),
        ]

        llm_start = time.perf_counter()
        response = await llm.ainvoke(messages)
        llm_elapsed = (time.perf_counter() - llm_start) * 1000
        logger.info("[Node:evaluate_content] LLM responded in %.0fms", llm_elapsed)

        # Log token usage if available
        usage = getattr(response, "usage_metadata", None)
        if usage:
            logger.info(
                "[Node:evaluate_content] Token usage: input=%s output=%s total=%s",
                usage.get("input_tokens", "?"),
                usage.get("output_tokens", "?"),
                usage.get("total_tokens", "?"),
            )

        content = (
            response.content
            if isinstance(response.content, str)
            else str(response.content)
        )

        evaluation = _parse_evaluation_response(content)

        if evaluation.get("passed", False):
            elapsed = (time.perf_counter() - start) * 1000
            logger.info(
                "[Node:evaluate_content] PASSED in %.0fms — all rules satisfied",
                elapsed,
            )
            return {
                "validation_errors": [],
                "evaluator_feedback": "",
                "quiz_payload": {"questions": questions},
            }

        # Evaluation found issues — drop failing questions, keep valid ones
        issues = evaluation.get("issues", [])
        feedback_lines: list[str] = []
        failed_qids: set[str] = set()
        for issue in issues:
            qid = issue.get("question_id", "unknown")
            rule = issue.get("rule", "unknown")
            detail = issue.get("detail", "no detail")
            feedback_lines.append(f"- [{qid}] {rule}: {detail}")
            failed_qids.add(qid)

        feedback = "\n".join(feedback_lines)

        # Filter out questions with issues, keep the rest
        valid_questions = [
            q for q in questions if q.get("question_id", "") not in failed_qids
        ]
        dropped = len(questions) - len(valid_questions)

        elapsed = (time.perf_counter() - start) * 1000

        # Minimum viable quiz: at least 3 questions
        min_questions = 3
        if len(valid_questions) >= min_questions:
            logger.warning(
                "[Node:evaluate_content] PARTIAL PASS in %.0fms — "
                "dropped %d/%d questions with %d issues, %d valid:\n%s",
                elapsed,
                dropped,
                len(questions),
                len(issues),
                len(valid_questions),
                feedback,
            )
            return {
                "validation_errors": [],
                "evaluator_feedback": "",
                "quiz_payload": {"questions": valid_questions},
            }

        # Too few valid questions — retry with full regeneration
        logger.warning(
            "[Node:evaluate_content] FAILED in %.0fms — only %d valid "
            "questions after dropping %d (min=%d), retrying:\n%s",
            elapsed,
            len(valid_questions),
            dropped,
            min_questions,
            feedback,
        )

        return {
            "validation_errors": [
                f"Content evaluation failed: {len(issues)} issues, "
                f"only {len(valid_questions)} valid (min={min_questions})"
            ],
            "evaluator_feedback": feedback,
            "retry_count": retry_count + 1,
            "quiz_payload": {},
        }

    except Exception as e:
        # If the evaluator itself fails, don't block the quiz
        # This is a safety mechanism to ensure quizzes are delivered even if
        # the evaluator LLM has issues (cost: potential quality degradation)
        elapsed = (time.perf_counter() - start) * 1000
        logger.error(
            "[Node:evaluate_content] EVALUATOR ERROR after %.0fms: %s: %s "
            "— defaulting to PASS",
            elapsed,
            type(e).__name__,
            e,
        )
        logger.warning(
            "[Node:evaluate_content] Auto-passed %d questions without content validation. "
            "Questions: %s",
            len(questions),
            [q.get("question_id", "unknown") for q in questions],
        )
        return {
            "validation_errors": [],
            "evaluator_feedback": "",
            "quiz_payload": {"questions": questions},
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
        "fill_in_blank": ', "sentence_with_blanks": "I ___ Chinese", '
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


def _parse_evaluation_response(content: str) -> dict[str, Any]:
    """Parse JSON evaluation response from evaluator LLM.

    Handles markdown code blocks and various JSON formats.

    Args:
        content: Raw LLM response text.

    Returns:
        Parsed evaluation dict with 'passed' and 'issues' keys.
        Defaults to passed=True if parsing fails.
    """
    text = content.strip()
    if text.startswith("```"):
        first_newline = text.index("\n") if "\n" in text else len(text)
        text = text[first_newline + 1 :]
        if text.rstrip().endswith("```"):
            text = text.rstrip()[:-3].rstrip()

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            result: dict[str, Any] = parsed
            return result
        logger.warning("Evaluation response is not a dict: %s", type(parsed))
        return {"passed": True, "issues": []}
    except json.JSONDecodeError as e:
        logger.error("Failed to parse evaluation JSON response: %s", e)
        return {"passed": True, "issues": []}


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
            result: list[dict[str, Any]] = parsed
            return result
        if isinstance(parsed, dict) and "questions" in parsed:
            questions: list[dict[str, Any]] = parsed["questions"]
            return questions
        return [parsed]
    except json.JSONDecodeError as e:
        logger.error("Failed to parse LLM JSON response: %s", e)
        return []
