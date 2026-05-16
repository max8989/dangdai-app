"""Pydantic request/response models.

Define API schemas for request validation and response serialization.
"""

from __future__ import annotations

from enum import StrEnum
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


class ExerciseType(StrEnum):
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
    question_count: int | None = Field(
        default=None,
        ge=1,
        le=30,
        description=(
            "Optional override for the number of questions to generate. "
            "When omitted, the backend picks a sensible default per exercise "
            "type (12 for most, 5 for reading comprehension)."
        ),
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
    character: str | None = Field(
        None, description="Chinese character(s) — None when hidden (pinyin_to_char)"
    )
    pinyin: str | None = Field(
        None, description="Pinyin romanization — None when hidden (char_to_pinyin)"
    )
    meaning: str = Field(..., description="English meaning")
    question_subtype: str = Field(
        ...,
        description="Sub-type: pinyin_to_char or char_to_pinyin",
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
    sentence_with_blanks: str = Field(
        ..., description="Sentence with ___ blank markers"
    )
    word_bank: list[str] = Field(..., description="Available words to fill blanks")
    blank_positions: list[int] = Field(
        ..., description="Positions of blanks in sentence"
    )
    english_translation: str = Field(
        default="", description="English translation of the sentence"
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
    acceptable_answer_variants: list[str] = Field(
        default_factory=list,
        description=(
            "Semantically equivalent valid answers for local runtime validation "
            "(Story 4.17). Always includes correct_answer as the first entry."
        ),
    )
    semantic_rubric: str = Field(
        default="",
        description=(
            "One-sentence English grading rule used when a student answer does "
            "not match any entry in acceptable_answer_variants."
        ),
    )


class SentenceConstructionQuestion(QuizQuestionBase):
    """Sentence construction (word ordering) exercise question."""

    exercise_type: Literal[ExerciseType.SENTENCE_CONSTRUCTION] = (
        ExerciseType.SENTENCE_CONSTRUCTION
    )
    scrambled_words: list[str] = Field(..., description="Words in scrambled order")
    correct_order: list[int] = Field(..., description="Correct indices order")
    acceptable_answer_variants: list[str] = Field(
        default_factory=list,
        description=(
            "Semantically equivalent valid sentence orderings for local runtime "
            "validation (Story 4.17). Always includes the canonical correct_answer."
        ),
    )
    semantic_rubric: str = Field(
        default="",
        description=(
            "One-sentence English grading rule used when a student answer does "
            "not match any entry in acceptable_answer_variants."
        ),
    )


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
# Multi-chapter quiz generation
# ---------------------------------------------------------------------------


class QuizGenerateMultiRequest(BaseModel):
    """Multi-chapter quiz generation request.

    Generates a single quiz spanning a range of chapter IDs, sampled across
    one or more exercise types.
    """

    chapter_id_start: int = Field(
        ..., ge=100, description="Start of the chapter_id range (inclusive)"
    )
    chapter_id_end: int = Field(
        ..., ge=100, description="End of the chapter_id range (inclusive)"
    )
    question_count: int = Field(
        ..., ge=5, le=50, description="Total number of questions to generate"
    )
    exercise_types: list[ExerciseType] = Field(
        ..., min_length=1, description="One or more exercise types to sample from"
    )


class QuizGenerateMultiResponse(BaseModel):
    """Multi-chapter quiz generation response."""

    quiz_id: str = Field(..., description="Unique quiz identifier")
    chapter_id_start: int = Field(..., description="Start of the chapter_id range")
    chapter_id_end: int = Field(..., description="End of the chapter_id range")
    chapter_ids: list[int] = Field(
        ..., description="Concrete list of chapter_ids covered (gaps skipped)"
    )
    exercise_types: list[str] = Field(..., description="Exercise types sampled")
    question_count: int = Field(..., description="Number of questions returned")
    questions: list[QuizQuestion] = Field(..., description="Generated quiz questions")


# ---------------------------------------------------------------------------
# Custom quiz generation (explicit chapter list, anti-repetition)
# ---------------------------------------------------------------------------


class QuizGenerateCustomRequest(BaseModel):
    """Custom quiz generation request.

    Generates a single quiz from an explicit list of chapter IDs and one or
    more exercise types. Unlike `/generate` (single chapter) and
    `/generate-multi` (contiguous range), this endpoint:

    - Accepts any explicit list of chapter_ids (any books, non-contiguous).
    - Pools vocabulary and grammar across the selected chapters so Tier 1
      generators draw distractors from the full set.
    - Injects a per-call diversity seed and uses a higher LLM temperature so
      successive calls with the same inputs produce noticeably different
      content.
    - Optionally accepts question texts to avoid (anti-repetition).
    - Never writes to `premade_exercises` — output is always fresh.
    """

    chapter_ids: list[int] = Field(
        ...,
        min_length=1,
        max_length=30,
        description=(
            "Explicit list of composite chapter IDs (book_id * 100 + chapter). "
            "Need not be contiguous. Each must be a valid lesson in books 1-4."
        ),
    )
    question_count: int = Field(
        ..., ge=5, le=50, description="Total number of questions to generate"
    )
    exercise_types: list[ExerciseType] = Field(
        ..., min_length=1, description="One or more exercise types to sample from"
    )
    seed: int | None = Field(
        default=None,
        description=(
            "Optional integer seed for reproducible randomness. When omitted "
            "(the common case), a fresh seed is used per call so two calls "
            "with the same inputs produce different quizzes."
        ),
    )
    avoid_question_texts: list[str] = Field(
        default_factory=list,
        max_length=50,
        description=(
            "Optional list of question_text strings the client has seen "
            "recently. Tier 2 LLM is instructed to avoid producing these."
        ),
    )
    temperature: float = Field(
        default=0.9,
        ge=0.0,
        le=1.5,
        description=(
            "LLM sampling temperature for Tier 2 generation. Higher = more "
            "variety. Default 0.9 (vs 0.7 for single-chapter)."
        ),
    )


class QuizGenerateCustomResponse(BaseModel):
    """Custom quiz generation response."""

    quiz_id: str = Field(..., description="Unique quiz identifier")
    chapter_ids: list[int] = Field(
        ..., description="Concrete list of chapter_ids actually covered"
    )
    exercise_types: list[str] = Field(..., description="Exercise types sampled")
    question_count: int = Field(..., description="Number of questions returned")
    seed: int = Field(..., description="Effective random seed used for this call")
    questions: list[QuizQuestion] = Field(..., description="Generated quiz questions")


# ---------------------------------------------------------------------------
# Error response
# ---------------------------------------------------------------------------


class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str = Field(..., description="Error description")


# ---------------------------------------------------------------------------
# On-the-fly exercise generation schemas (Story 4.17)
# ---------------------------------------------------------------------------


class ExerciseGenerateRequest(BaseModel):
    """On-the-fly AI exercise generation request."""

    chapter_id: int = Field(
        ..., description="Composite chapter ID (book_id * 100 + chapter_number)"
    )
    book_id: int = Field(..., ge=1, le=6, description="Book number (1-6)")
    exercise_type: ExerciseType = Field(
        ..., description="Exercise type to generate on-the-fly"
    )
    question_count: int | None = Field(
        default=None,
        ge=1,
        le=30,
        description=(
            "Optional override for the number of questions to generate. "
            "When omitted, the backend chooses a sensible default per "
            "exercise type (12 for most types, 5 for reading comprehension)."
        ),
    )
    cache: bool = Field(
        default=False,
        description=(
            "When true, upserts the generated content into `premade_exercises` "
            "so the Premade path will serve it back on subsequent loads. "
            "Defaults to false (since 2026-05) so on-the-fly generation does "
            "not freeze one variant per (chapter, type) for every user. "
            "Pass true only when explicitly seeding curriculum content."
        ),
    )


class ExerciseGenerateResponse(BaseModel):
    """On-the-fly exercise generation response.

    Returns the exercise payload in the same JSONB shape that
    `premade_exercises.content` uses so the mobile premade adapter can
    consume both paths identically (Story 4.17).
    """

    exercise_type: str = Field(..., description="Exercise type generated")
    book_id: int = Field(..., description="Book ID")
    lesson_id: int = Field(..., description="Lesson number within the book")
    title: str = Field(..., description="Exercise title")
    instructions: str = Field(..., description="Exercise instructions")
    content: dict = Field(
        ...,
        description="Exercise content — matches premade_exercises.content JSONB shape",
    )


# ---------------------------------------------------------------------------
# Chat (RAG Q&A) schemas
# ---------------------------------------------------------------------------


class ChatTurn(BaseModel):
    """A single past message in a chat conversation."""

    role: Literal["user", "assistant"] = Field(
        ..., description="Who produced this turn"
    )
    content: str = Field(..., min_length=1, max_length=8000)


class ChatRequest(BaseModel):
    """Chat / RAG question request."""

    query: str = Field(..., min_length=1, description="User's question")
    book: int | None = Field(
        None, ge=1, le=6, description="Optional book filter (1-6)"
    )
    lesson: int | None = Field(
        None, ge=1, description="Optional lesson filter within the selected book"
    )
    content_type: Literal["textbook", "workbook"] | None = Field(
        None, description="Optional filter for textbook or workbook content"
    )
    num_chunks: int = Field(
        5, ge=1, le=15, description="Number of chunks to retrieve"
    )
    history: list[ChatTurn] = Field(
        default_factory=list,
        max_length=20,
        description=(
            "Prior conversation turns (oldest first), excluding the current "
            "query. The server keeps only the most recent few to bound tokens."
        ),
    )


class ChatSource(BaseModel):
    """A single retrieved chunk citation returned with a chat answer."""

    book: int | None = None
    lesson: int | None = None
    section: str | None = None
    content_type: str | None = None
    exercise_type: str | None = None
    similarity: float | None = None
    page_range: str | None = None


class ChatResponse(BaseModel):
    """Chat / RAG answer response."""

    answer: str = Field(..., description="Generated answer")
    sources: list[ChatSource] = Field(
        default_factory=list, description="Source citations for the answer"
    )
    model: str = Field(..., description="LLM model used for generation")


# ---------------------------------------------------------------------------
# Legacy aliases (kept for backward compatibility with HealthResponse import)
# ---------------------------------------------------------------------------

QuizRequest = QuizGenerateRequest
QuizResponse = QuizGenerateResponse
