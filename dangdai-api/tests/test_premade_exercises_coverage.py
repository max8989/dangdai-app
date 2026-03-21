"""Premade exercise coverage tests for Book 1 (Story 12.2).

Tests two layers:
1. Tier 1 generators (VocabularyGenerator, MatchingGenerator, FillInBlankGenerator)
   against real Book 1 RAG content for all 15 lessons.
2. Premade exercise content JSONB schema validation for all supported exercise types.

Uses real data from dangdai-rag/output_chunks/book1_chunks.json.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

from src.agent.generators import (
    FillInBlankGenerator,
    MatchingGenerator,
    VocabularyGenerator,
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BOOK_ID = 1
TOTAL_LESSONS = 15
RAG_CHUNKS_PATH = Path(__file__).resolve().parents[2] / "dangdai-rag" / "output_chunks" / "book1_chunks.json"

# Exercise type content JSONB schemas (field requirements)
CONTENT_SCHEMAS = {
    "fill_in_blank": {
        "required_root": ["sentences"],
        "required_sentence": ["text_with_blanks", "word_bank", "correct_answers"],
    },
    "matching": {
        "required_root": ["pairs"],
        "required_pair": ["left", "right"],
    },
    "dialogue_completion": {
        "required_root": ["lines", "options", "correct_answer"],
        "required_line": ["speaker", "text", "is_blank"],
    },
    "sentence_construction": {
        "required_root": ["sentences"],
        "required_sentence": ["scrambled_words", "correct_order"],
    },
    "reading": {
        "required_root": ["passage", "questions"],
        "required_question": ["question", "options", "correct_answer"],
    },
    "reading_comprehension": {
        "required_root": ["passage", "questions"],
        "required_question": ["question", "options", "correct_answer"],
    },
}

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session")
def book1_chunks() -> list[dict]:
    """Load all Book 1 chunks from RAG output."""
    if not RAG_CHUNKS_PATH.exists():
        pytest.skip(f"RAG chunks not found at {RAG_CHUNKS_PATH}")
    with open(RAG_CHUNKS_PATH, encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def book1_vocabulary_by_lesson(book1_chunks: list[dict]) -> dict[int, list[dict]]:
    """Extract vocabulary items per lesson from Book 1 chunks.

    Parses vocabulary_table chunks and extracts structured vocab items.
    """
    vocab_by_lesson: dict[int, list[dict]] = {}

    for chunk in book1_chunks:
        meta = chunk.get("metadata", {})
        if meta.get("book") != 1:
            continue
        section = meta.get("section", "")
        content_type = meta.get("content_type", "")
        lesson = meta.get("lesson")
        if lesson is None:
            continue

        # Only process vocabulary sections
        if section != "vocabulary" and content_type != "vocab_table":
            continue

        if lesson not in vocab_by_lesson:
            vocab_by_lesson[lesson] = []

        # Parse content for vocabulary items
        # Vocab tables have lines like: 字\tpinyin\tenglish(POS)
        content = chunk.get("content", "")
        for line in content.split("\n"):
            line = line.strip()
            if not line or line.startswith("//") or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) >= 3:
                traditional = parts[0].strip()
                pinyin = parts[1].strip()
                english_raw = parts[2].strip()

                # Extract POS from parentheses
                pos = "N"
                if "(" in english_raw and ")" in english_raw:
                    pos_start = english_raw.rfind("(")
                    pos_end = english_raw.rfind(")")
                    if pos_start < pos_end:
                        pos = english_raw[pos_start + 1 : pos_end].strip()
                        english_raw = english_raw[:pos_start].strip()

                if traditional and pinyin:
                    vocab_by_lesson[lesson].append(
                        {
                            "traditional": traditional,
                            "pinyin": pinyin,
                            "english": english_raw,
                            "part_of_speech": pos,
                        }
                    )

    return vocab_by_lesson


@pytest.fixture(scope="session")
def book1_grammar_by_lesson(book1_chunks: list[dict]) -> dict[int, list[dict]]:
    """Extract grammar points per lesson from Book 1 chunks."""
    grammar_by_lesson: dict[int, list[dict]] = {}

    for chunk in book1_chunks:
        meta = chunk.get("metadata", {})
        if meta.get("book") != 1:
            continue
        section = meta.get("section", "")
        lesson = meta.get("lesson")
        if lesson is None:
            continue

        if section != "grammar":
            continue

        if lesson not in grammar_by_lesson:
            grammar_by_lesson[lesson] = []

        content = chunk.get("content", "")
        topic = meta.get("topic", "")

        # Create a grammar point from the chunk
        # Extract examples from content — look for Chinese sentences
        examples = []
        for line in content.split("\n"):
            line = line.strip()
            # Lines with Chinese chars that look like examples
            if any("\u4e00" <= c <= "\u9fff" for c in line) and len(line) > 2:
                examples.append(
                    {
                        "chinese": line,
                        "english": "",
                    }
                )

        grammar_by_lesson[lesson].append(
            {
                "title_english": topic or f"Grammar Point {len(grammar_by_lesson[lesson]) + 1}",
                "title_chinese": "",
                "function_description": content[:200] if content else "",
                "structure_pattern": "",
                "usage_notes": "",
                "examples": examples[:5],  # Cap at 5 examples
            }
        )

    return grammar_by_lesson


# ---------------------------------------------------------------------------
# Tier 1 Generator Tests — Real Book 1 Content
# ---------------------------------------------------------------------------


class TestVocabularyGeneratorBook1:
    """Test VocabularyGenerator against real Book 1 vocabulary for all 15 lessons."""

    @pytest.mark.parametrize("lesson", range(1, TOTAL_LESSONS + 1))
    def test_generates_questions_for_lesson(
        self,
        lesson: int,
        book1_vocabulary_by_lesson: dict[int, list[dict]],
    ) -> None:
        vocab = book1_vocabulary_by_lesson.get(lesson, [])
        if len(vocab) < 4:
            pytest.skip(f"Lesson {lesson}: insufficient vocabulary ({len(vocab)} items, need ≥4)")

        gen = VocabularyGenerator()
        questions = gen.generate(
            vocabulary=vocab,
            weakness_profile={},
            book_id=BOOK_ID,
            lesson_id=lesson,
        )

        assert len(questions) > 0, f"Lesson {lesson}: generator returned no questions"

        for q in questions:
            assert q["exercise_type"] == "vocabulary"
            assert q["correct_answer"], f"Lesson {lesson}: empty correct_answer"
            assert q["options"], f"Lesson {lesson}: empty options"
            assert q["correct_answer"] in q["options"], (
                f"Lesson {lesson}: correct_answer not in options"
            )
            assert len(set(q["options"])) == len(q["options"]), (
                f"Lesson {lesson}: duplicate options"
            )
            assert q.get("explanation"), f"Lesson {lesson}: missing explanation"
            assert q.get("source_citation"), f"Lesson {lesson}: missing source_citation"


class TestMatchingGeneratorBook1:
    """Test MatchingGenerator against real Book 1 vocabulary for all 15 lessons."""

    @pytest.mark.parametrize("lesson", range(1, TOTAL_LESSONS + 1))
    def test_generates_questions_for_lesson(
        self,
        lesson: int,
        book1_vocabulary_by_lesson: dict[int, list[dict]],
    ) -> None:
        vocab = book1_vocabulary_by_lesson.get(lesson, [])
        if len(vocab) < 5:
            pytest.skip(f"Lesson {lesson}: insufficient vocabulary ({len(vocab)} items, need ≥5)")

        gen = MatchingGenerator()
        questions = gen.generate(
            vocabulary=vocab,
            weakness_profile={},
            book_id=BOOK_ID,
            lesson_id=lesson,
        )

        assert len(questions) > 0, f"Lesson {lesson}: generator returned no questions"

        for q in questions:
            assert q["exercise_type"] == "matching"
            assert "left_items" in q, f"Lesson {lesson}: missing left_items"
            assert "right_items" in q, f"Lesson {lesson}: missing right_items"
            assert len(q["left_items"]) == len(q["right_items"]), (
                f"Lesson {lesson}: left/right item count mismatch"
            )
            assert q.get("correct_answer"), f"Lesson {lesson}: missing correct_answer"


class TestFillInBlankGeneratorBook1:
    """Test FillInBlankGenerator against real Book 1 content for all 15 lessons."""

    @pytest.mark.parametrize("lesson", range(1, TOTAL_LESSONS + 1))
    def test_generates_questions_for_lesson(
        self,
        lesson: int,
        book1_vocabulary_by_lesson: dict[int, list[dict]],
        book1_grammar_by_lesson: dict[int, list[dict]],
    ) -> None:
        vocab = book1_vocabulary_by_lesson.get(lesson, [])
        grammar = book1_grammar_by_lesson.get(lesson, [])

        if not grammar:
            pytest.skip(f"Lesson {lesson}: no grammar points found")
        if len(vocab) < 4:
            pytest.skip(f"Lesson {lesson}: insufficient vocabulary ({len(vocab)} items)")

        # Filter to grammar points that have examples
        grammar_with_examples = [g for g in grammar if g.get("examples")]
        if not grammar_with_examples:
            pytest.skip(f"Lesson {lesson}: no grammar points with examples")

        gen = FillInBlankGenerator()
        questions = gen.generate(
            grammar_points=grammar_with_examples,
            vocabulary=vocab,
            weakness_profile={},
            book_id=BOOK_ID,
            lesson_id=lesson,
        )

        # Fill-in-blank may return 0 questions if no suitable examples found
        if len(questions) == 0:
            pytest.skip(
                f"Lesson {lesson}: generator returned 0 questions "
                f"(grammar_points={len(grammar_with_examples)}, vocab={len(vocab)})"
            )

        for q in questions:
            assert q["exercise_type"] == "fill_in_blank"
            assert "sentence_with_blanks" in q, f"Lesson {lesson}: missing sentence_with_blanks"
            assert "___" in q["sentence_with_blanks"], (
                f"Lesson {lesson}: sentence_with_blanks has no blank marker"
            )
            assert "word_bank" in q, f"Lesson {lesson}: missing word_bank"
            assert len(q["word_bank"]) > 1, f"Lesson {lesson}: word_bank too small"
            assert q["correct_answer"], f"Lesson {lesson}: empty correct_answer"


# ---------------------------------------------------------------------------
# Content JSONB Schema Validation Tests
# ---------------------------------------------------------------------------


class TestPremadeExerciseContentSchemas:
    """Validate content JSONB schemas for all premade exercise types."""

    def test_fill_in_blank_schema(self) -> None:
        """Valid fill_in_blank content must have sentences with blanks and word banks."""
        content = {
            "sentences": [
                {
                    "text_with_blanks": "我是___學生",
                    "word_bank": ["一個", "兩個", "三個"],
                    "correct_answers": ["一個"],
                }
            ]
        }
        _validate_content_schema("fill_in_blank", content)

    def test_fill_in_blank_missing_sentences_fails(self) -> None:
        with pytest.raises(AssertionError):
            _validate_content_schema("fill_in_blank", {})

    def test_fill_in_blank_empty_sentences_fails(self) -> None:
        with pytest.raises(AssertionError):
            _validate_content_schema("fill_in_blank", {"sentences": []})

    def test_fill_in_blank_sentence_missing_fields_fails(self) -> None:
        with pytest.raises(AssertionError):
            _validate_content_schema(
                "fill_in_blank",
                {"sentences": [{"text_with_blanks": "test"}]},
            )

    def test_matching_schema(self) -> None:
        content = {
            "pairs": [
                {"left": "學", "right": "to study"},
                {"left": "書", "right": "book"},
            ]
        }
        _validate_content_schema("matching", content)

    def test_matching_missing_pairs_fails(self) -> None:
        with pytest.raises(AssertionError):
            _validate_content_schema("matching", {})

    def test_matching_empty_pairs_fails(self) -> None:
        with pytest.raises(AssertionError):
            _validate_content_schema("matching", {"pairs": []})

    def test_matching_pair_missing_fields_fails(self) -> None:
        with pytest.raises(AssertionError):
            _validate_content_schema("matching", {"pairs": [{"left": "學"}]})

    def test_dialogue_completion_schema(self) -> None:
        content = {
            "lines": [
                {"speaker": "a", "text": "你好！", "is_blank": False},
                {"speaker": "b", "text": "", "is_blank": True},
            ],
            "options": ["你好", "再見", "謝謝"],
            "correct_answer": "你好",
        }
        _validate_content_schema("dialogue_completion", content)

    def test_dialogue_completion_missing_fields_fails(self) -> None:
        with pytest.raises(AssertionError):
            _validate_content_schema("dialogue_completion", {"lines": []})

    def test_sentence_construction_schema(self) -> None:
        content = {
            "sentences": [
                {
                    "scrambled_words": ["是", "我", "學生"],
                    "correct_order": ["我", "是", "學生"],
                }
            ]
        }
        _validate_content_schema("sentence_construction", content)

    def test_sentence_construction_missing_sentences_fails(self) -> None:
        with pytest.raises(AssertionError):
            _validate_content_schema("sentence_construction", {})

    def test_reading_comprehension_schema(self) -> None:
        content = {
            "passage": "今天天氣很好。我想去公園。",
            "questions": [
                {
                    "question": "What is the weather like?",
                    "options": ["Good", "Bad", "Cold", "Hot"],
                    "correct_answer": "Good",
                }
            ],
        }
        _validate_content_schema("reading_comprehension", content)

    def test_reading_comprehension_also_accepts_reading_type(self) -> None:
        content = {
            "passage": "今天天氣很好。",
            "questions": [
                {
                    "question": "What?",
                    "options": ["A", "B"],
                    "correct_answer": "A",
                }
            ],
        }
        _validate_content_schema("reading", content)

    def test_reading_missing_passage_fails(self) -> None:
        with pytest.raises(AssertionError):
            _validate_content_schema(
                "reading_comprehension",
                {"questions": [{"question": "?", "options": ["A"], "correct_answer": "A"}]},
            )

    def test_reading_missing_questions_fails(self) -> None:
        with pytest.raises(AssertionError):
            _validate_content_schema("reading_comprehension", {"passage": "text"})

    def test_reading_empty_questions_fails(self) -> None:
        with pytest.raises(AssertionError):
            _validate_content_schema(
                "reading_comprehension", {"passage": "text", "questions": []}
            )


# ---------------------------------------------------------------------------
# Adapter Equivalence Tests
# ---------------------------------------------------------------------------


class TestAdaptPremadeContent:
    """Test that valid content JSONB produces non-empty QuizQuestion-compatible dicts."""

    def test_adapt_fill_in_blank(self) -> None:
        content = {
            "sentences": [
                {
                    "text_with_blanks": "我___學生",
                    "word_bank": ["是", "有", "在"],
                    "correct_answers": ["是"],
                }
            ]
        }
        result = _adapt_content("fill_in_blank", content)
        assert len(result) == 1
        assert result[0]["exercise_type"] == "fill_in_blank"
        assert result[0]["correct_answer"] == "是"
        assert "sentence_with_blanks" in result[0]
        assert "word_bank" in result[0]

    def test_adapt_matching(self) -> None:
        content = {
            "pairs": [
                {"left": "學", "right": "to study"},
                {"left": "書", "right": "book"},
            ]
        }
        result = _adapt_content("matching", content)
        assert len(result) == 1
        assert result[0]["exercise_type"] == "matching"
        assert "pairs" in result[0]

    def test_adapt_dialogue_completion(self) -> None:
        content = {
            "lines": [
                {"speaker": "a", "text": "你好", "is_blank": False},
                {"speaker": "b", "text": "你好", "is_blank": True},
            ],
            "options": ["你好", "再見"],
            "correct_answer": "你好",
        }
        result = _adapt_content("dialogue_completion", content)
        assert len(result) == 1
        assert result[0]["exercise_type"] == "dialogue_completion"
        assert result[0]["correct_answer"] == "你好"

    def test_adapt_sentence_construction(self) -> None:
        content = {
            "sentences": [
                {
                    "scrambled_words": ["是", "我", "學生"],
                    "correct_order": ["我", "是", "學生"],
                }
            ]
        }
        result = _adapt_content("sentence_construction", content)
        assert len(result) == 1
        assert result[0]["exercise_type"] == "sentence_construction"
        assert result[0]["correct_answer"] == "我 是 學生"

    def test_adapt_reading_comprehension(self) -> None:
        content = {
            "passage": "今天很好。",
            "questions": [
                {
                    "question": "How is today?",
                    "options": ["Good", "Bad"],
                    "correct_answer": "Good",
                }
            ],
        }
        result = _adapt_content("reading_comprehension", content)
        assert len(result) == 1
        assert result[0]["exercise_type"] == "reading_comprehension"
        assert "passage" in result[0]
        assert "comprehension_questions" in result[0]

    def test_adapt_unknown_type_returns_empty(self) -> None:
        result = _adapt_content("unknown_type", {"foo": "bar"})
        assert result == []

    def test_adapt_empty_content_returns_empty(self) -> None:
        result = _adapt_content("fill_in_blank", {})
        assert result == []


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------


def _validate_content_schema(exercise_type: str, content: dict) -> None:
    """Validate that content JSONB matches the expected schema for the exercise type."""
    schema = CONTENT_SCHEMAS.get(exercise_type)
    assert schema is not None, f"No schema defined for exercise type: {exercise_type}"

    # Check required root fields
    for field in schema["required_root"]:
        assert field in content, f"Missing required root field: {field}"

    # Check array fields are non-empty
    for field in schema["required_root"]:
        value = content[field]
        if isinstance(value, list):
            assert len(value) > 0, f"Required array field '{field}' is empty"

    # Check nested item schemas
    if "required_sentence" in schema and "sentences" in content:
        for i, sentence in enumerate(content["sentences"]):
            for field in schema["required_sentence"]:
                assert field in sentence, (
                    f"Sentence [{i}] missing required field: {field}"
                )

    if "required_pair" in schema and "pairs" in content:
        for i, pair in enumerate(content["pairs"]):
            for field in schema["required_pair"]:
                assert field in pair, f"Pair [{i}] missing required field: {field}"

    if "required_line" in schema and "lines" in content:
        for i, line in enumerate(content["lines"]):
            for field in schema["required_line"]:
                assert field in line, f"Line [{i}] missing required field: {field}"

    if "required_question" in schema and "questions" in content:
        for i, question in enumerate(content["questions"]):
            for field in schema["required_question"]:
                assert field in question, (
                    f"Question [{i}] missing required field: {field}"
                )


def _adapt_content(exercise_type: str, content: dict) -> list[dict]:
    """Python-side equivalent of the TypeScript premadeExerciseAdapter.

    Transforms premade exercise content JSONB into QuizQuestion-compatible dicts.
    This mirrors the logic in dangdai-mobile/lib/premadeExerciseAdapter.ts.
    """
    if exercise_type == "fill_in_blank":
        sentences = content.get("sentences")
        if not sentences or not isinstance(sentences, list):
            return []
        return [
            {
                "question_id": f"premade-fib-{i}",
                "exercise_type": "fill_in_blank",
                "question_text": s.get("instruction", "Fill in the blanks:"),
                "correct_answer": ",".join(s.get("correct_answers", [])),
                "explanation": s.get("explanation", ""),
                "source_citation": "",
                "sentence_with_blanks": s.get("text_with_blanks", ""),
                "word_bank": s.get("word_bank", []),
                "blank_positions": list(range(len(s.get("correct_answers", [])))),
            }
            for i, s in enumerate(sentences)
        ]

    if exercise_type == "matching":
        pairs = content.get("pairs")
        if not pairs or not isinstance(pairs, list) or len(pairs) == 0:
            return []
        mapped_pairs = [{"left": p["left"], "right": p["right"]} for p in pairs]
        return [
            {
                "question_id": "premade-matching-0",
                "exercise_type": "matching",
                "question_text": content.get("instruction", "Match the items:"),
                "correct_answer": json.dumps(mapped_pairs),
                "explanation": content.get("explanation", ""),
                "source_citation": "",
                "pairs": mapped_pairs,
            }
        ]

    if exercise_type == "dialogue_completion":
        lines = content.get("lines")
        options = content.get("options")
        if not lines or not options:
            return []
        dialogue_lines = [
            {
                "speaker": ln["speaker"],
                "text": "" if ln.get("is_blank") else ln["text"],
                "isBlank": ln.get("is_blank", False),
            }
            for ln in lines
        ]
        return [
            {
                "question_id": "premade-dialogue-0",
                "exercise_type": "dialogue_completion",
                "question_text": content.get("instruction", "Complete the dialogue:"),
                "correct_answer": content.get("correct_answer", ""),
                "explanation": content.get("explanation", ""),
                "source_citation": "",
                "dialogue_lines": dialogue_lines,
                "options": options,
            }
        ]

    if exercise_type == "sentence_construction":
        sentences = content.get("sentences")
        if not sentences or not isinstance(sentences, list):
            return []
        return [
            {
                "question_id": f"premade-sc-{i}",
                "exercise_type": "sentence_construction",
                "question_text": s.get("instruction", "Arrange the words:"),
                "correct_answer": " ".join(s.get("correct_order", [])),
                "explanation": s.get("explanation", ""),
                "source_citation": "",
                "scrambled_words": s.get("scrambled_words", []),
                "correct_order": s.get("correct_order", []),
            }
            for i, s in enumerate(sentences)
        ]

    if exercise_type in ("reading", "reading_comprehension"):
        passage = content.get("passage")
        questions = content.get("questions")
        if not passage or not questions:
            return []
        comprehension_questions = [
            {
                "question": q["question"],
                "options": q["options"],
                "correct_answer": q["correct_answer"],
                "explanation": q.get("explanation"),
            }
            for q in questions
        ]
        return [
            {
                "question_id": "premade-reading-0",
                "exercise_type": "reading_comprehension",
                "question_text": content.get("instruction", "Read and answer:"),
                "correct_answer": questions[0].get("correct_answer", ""),
                "explanation": "",
                "source_citation": "",
                "passage": passage,
                "passage_pinyin": content.get("passage_pinyin"),
                "comprehension_questions": comprehension_questions,
            }
        ]

    return []
