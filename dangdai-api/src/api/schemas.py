"""Pydantic request/response models.

Define API schemas for request validation and response serialization.
"""

from __future__ import annotations

from enum import Enum
from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str


# ---------------------------------------------------------------------------
# Exercise type enum
# ---------------------------------------------------------------------------


class ExerciseType(str, Enum):
    """Supported exercise types for quiz generation."""

    VOCABULARY = "vocabulary"
    GRAMMAR = "grammar"
    FILL_IN_BLANK = "fill_in_blank"
    MATCHING = "matching"
    DIALOGUE_COMPLETION = "dialogue_completion"
    SENTENCE_CONSTRUCTION = "sentence_construction"
    READING_COMPREHENSION = "reading_comprehension"
    MIXED = "mixed"


# ---------------------------------------------------------------------------
# Quiz generation request
# ---------------------------------------------------------------------------


class QuizGenerateRequest(BaseModel):
    """Quiz generation request schema."""

    chapter_id: int = Field(
        ..., description="Composite chapter ID (book_id * 100 + chapter_number)"
    )
    book_id: int = Field(..., ge=1, le=6, description="Book number (1-6)")
    exercise_type: ExerciseType = Field(
        default=ExerciseType.VOCABULARY,
        description="Exercise type or 'mixed' for variety",
    )


# ---------------------------------------------------------------------------
# Quiz question base and type-specific variants
# ---------------------------------------------------------------------------


class QuizQuestionBase(BaseModel):
    """Base fields shared by all quiz question types."""

    question_id: str = Field(..., description="Unique question identifier")
    exercise_type: ExerciseType = Field(
        ..., description="The exercise type of this question"
    )
    question_text: str = Field(..., description="The question prompt")
    correct_answer: str = Field(..., description="The correct answer")
    explanation: str = Field(..., description="Pre-generated explanation of the answer")
    source_citation: str = Field(..., description="Textbook source citation")


class VocabularyQuestion(QuizQuestionBase):
    """Vocabulary exercise question with character, pinyin, meaning."""

    exercise_type: Literal[ExerciseType.VOCABULARY] = ExerciseType.VOCABULARY
    character: str = Field(..., description="Chinese character(s)")
    pinyin: str = Field(..., description="Pinyin romanization")
    meaning: str = Field(..., description="English meaning")
    question_subtype: str = Field(
        ...,
        description="Sub-type: char_to_meaning, pinyin_to_char, meaning_to_char, etc.",
    )
    options: list[str] = Field(
        ..., min_length=4, max_length=4, description="4 multiple-choice options"
    )


class GrammarQuestion(QuizQuestionBase):
    """Grammar exercise question."""

    exercise_type: Literal[ExerciseType.GRAMMAR] = ExerciseType.GRAMMAR
    sentence: str = Field(..., description="Sentence with grammar focus")
    options: list[str] = Field(
        ..., min_length=4, max_length=4, description="4 multiple-choice options"
    )
    grammar_point: str = Field(..., description="Grammar point being tested")


class FillInBlankQuestion(QuizQuestionBase):
    """Fill-in-the-blank exercise question."""

    exercise_type: Literal[ExerciseType.FILL_IN_BLANK] = ExerciseType.FILL_IN_BLANK
    sentence_with_blank: str = Field(..., description="Sentence with ___ blank markers")
    word_bank: list[str] = Field(..., description="Available words to fill blanks")
    blank_positions: list[int] = Field(
        ..., description="Positions of blanks in sentence"
    )


class MatchingQuestion(QuizQuestionBase):
    """Matching exercise question."""

    exercise_type: Literal[ExerciseType.MATCHING] = ExerciseType.MATCHING
    left_items: list[str] = Field(..., description="Left column items")
    right_items: list[str] = Field(..., description="Right column items (shuffled)")
    correct_pairs: list[list[int]] = Field(
        ..., description="Correct pair indices [[left_idx, right_idx], ...]"
    )


class DialogueCompletionQuestion(QuizQuestionBase):
    """Dialogue completion exercise question."""

    exercise_type: Literal[ExerciseType.DIALOGUE_COMPLETION] = (
        ExerciseType.DIALOGUE_COMPLETION
    )
    dialogue_bubbles: list[dict[str, str | bool]] = Field(
        ...,
        description="List of {speaker, text, is_blank} dialogue entries",
    )
    options: list[str] = Field(..., description="Options to fill the blank bubble")


class SentenceConstructionQuestion(QuizQuestionBase):
    """Sentence construction (word ordering) exercise question."""

    exercise_type: Literal[ExerciseType.SENTENCE_CONSTRUCTION] = (
        ExerciseType.SENTENCE_CONSTRUCTION
    )
    scrambled_words: list[str] = Field(..., description="Words in scrambled order")
    correct_order: list[int] = Field(..., description="Correct indices order")


class ComprehensionSubQuestion(BaseModel):
    """A sub-question within a reading comprehension passage."""

    question: str
    options: list[str] = Field(..., min_length=4, max_length=4)
    correct: int = Field(..., ge=0, le=3, description="Index of correct option")


class ReadingComprehensionQuestion(QuizQuestionBase):
    """Reading comprehension exercise question."""

    exercise_type: Literal[ExerciseType.READING_COMPREHENSION] = (
        ExerciseType.READING_COMPREHENSION
    )
    passage: str = Field(..., description="Reading passage text")
    comprehension_questions: list[ComprehensionSubQuestion] = Field(
        ..., description="Comprehension questions about the passage"
    )


# Discriminated union of all question types
QuizQuestion = Annotated[
    Union[
        VocabularyQuestion,
        GrammarQuestion,
        FillInBlankQuestion,
        MatchingQuestion,
        DialogueCompletionQuestion,
        SentenceConstructionQuestion,
        ReadingComprehensionQuestion,
    ],
    Field(discriminator="exercise_type"),
]


# ---------------------------------------------------------------------------
# Quiz generation response
# ---------------------------------------------------------------------------


class QuizGenerateResponse(BaseModel):
    """Quiz generation response containing all questions."""

    quiz_id: str = Field(..., description="Unique quiz identifier")
    chapter_id: int = Field(..., description="Chapter ID")
    book_id: int = Field(..., description="Book ID")
    exercise_type: str = Field(..., description="Requested exercise type")
    question_count: int = Field(..., description="Number of questions generated")
    questions: list[QuizQuestion] = Field(..., description="Generated quiz questions")


# ---------------------------------------------------------------------------
# Error response
# ---------------------------------------------------------------------------


class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str = Field(..., description="Error description")


# ---------------------------------------------------------------------------
# Legacy aliases (kept for backward compatibility with HealthResponse import)
# ---------------------------------------------------------------------------

QuizRequest = QuizGenerateRequest
QuizResponse = QuizGenerateResponse
