"""Test data factories for dangdai-api domain objects.

All factories accept keyword overrides and return complete typed dicts or
dataclass instances. Values default to valid, realistic data so tests only
specify what matters for the scenario under test.

Chapter ID convention: book_id * 100 + chapter_number (e.g. Book 1 Ch 5 → 105).

Usage::

    from tests.support.factories import make_quiz_request, make_quiz_question

    def test_validation(make_quiz_request):
        req = make_quiz_request(chapter_id=205, num_questions=3)
        assert req["chapter_id"] == 205
"""

from __future__ import annotations

import uuid
from typing import Any

# ---------------------------------------------------------------------------
# Exercise types
# ---------------------------------------------------------------------------
EXERCISE_TYPES = [
    "vocabulary",
    "grammar",
    "fill_in_blank",
    "matching",
    "dialogue_completion",
    "sentence_construction",
    "reading_comprehension",
    "mixed",
]


def _uid() -> str:
    """Return a short unique ID safe for parallel test runs."""
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Quiz factories
# ---------------------------------------------------------------------------


def make_quiz_question(**overrides: Any) -> dict[str, Any]:
    """Return a valid quiz question dict."""
    return {
        "id": _uid(),
        "question_text": "What is the meaning of 你好?",
        "options": ["Hello", "Goodbye", "Thank you", "Sorry"],
        "correct_answer": "Hello",
        "exercise_type": "vocabulary",
        "difficulty": "easy",
        "chapter_id": 101,
        "explanation": "你好 (nǐ hǎo) means 'Hello' in Mandarin.",
        **overrides,
    }


def make_quiz_request(**overrides: Any) -> dict[str, Any]:
    """Return a valid quiz generation request payload."""
    return {
        "chapter_id": 101,
        "exercise_type": "vocabulary",
        "num_questions": 5,
        "user_id": _uid(),
        **overrides,
    }


def make_quiz_result(num_questions: int = 5, **overrides: Any) -> dict[str, Any]:
    """Return a valid quiz result dict with `num_questions` questions."""
    chapter_id = overrides.get("chapter_id", 101)
    exercise_type = overrides.get("exercise_type", "vocabulary")
    questions = overrides.pop(
        "questions",
        [
            make_quiz_question(chapter_id=chapter_id, exercise_type=exercise_type)
            for _ in range(num_questions)
        ],
    )
    return {
        "quiz_id": _uid(),
        "chapter_id": chapter_id,
        "exercise_type": exercise_type,
        "questions": questions,
        "total_questions": len(questions),
        "generation_time_ms": 1234,
        **overrides,
    }


# ---------------------------------------------------------------------------
# Chapter / Book factories
# ---------------------------------------------------------------------------


def make_chapter(**overrides: Any) -> dict[str, Any]:
    """Return a valid chapter dict."""
    book_id = overrides.get("book_id", 1)
    chapter_number = overrides.get("chapter_number", 1)
    return {
        "id": book_id * 100 + chapter_number,
        "book_id": book_id,
        "chapter_number": chapter_number,
        "title": f"Lesson {chapter_number}",
        "vocabulary_count": 20,
        **overrides,
    }


def make_book(**overrides: Any) -> dict[str, Any]:
    """Return a valid book dict."""
    return {
        "id": 1,
        "title": "當代中文課程",
        "subtitle": "A Course in Contemporary Chinese",
        "total_chapters": 15,
        **overrides,
    }


# ---------------------------------------------------------------------------
# User / Auth factories
# ---------------------------------------------------------------------------


def make_user(**overrides: Any) -> dict[str, Any]:
    """Return a valid user dict (mirrors Supabase auth.users subset)."""
    uid = _uid()
    return {
        "id": uid,
        "email": f"test-{uid[:8]}@example.com",
        "role": "authenticated",
        **overrides,
    }
