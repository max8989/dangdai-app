"""Tests for grammar points seeding script."""

import json
from unittest.mock import MagicMock, patch

import pytest

from src.scripts.seed_grammar_points import (
    assign_grammar_order,
    extract_grammar_points_llm,
    filter_grammar_chunks,
    load_chunks,
    seed_grammar_points,
    validate_grammar_point,
)

# ── Sample chunk fixtures ──────────────────────────────────────────────


GRAMMAR_CHUNK_BOOK1_L1 = {
    "content": (
        "Grammar I. Ways to Ask Questions\n"
        "Function: The A-not-A form of making a question...\n"
        "Structures: Subject + Verb-not-Verb + Object?\n"
        "你是不是學生？ Nǐ shì bú shì xuéshēng? Are you a student?\n"
        "他來不來？ Tā lái bù lái? Is he coming?\n"
        "Usage: Used in yes/no questions.\n"
        "II. The Particle 呢 ne\n"
        "Function: 呢 is used to ask reciprocal questions.\n"
        "Structures: Noun/Pronoun + 呢?\n"
        "我很好，你呢？ Wǒ hěn hǎo, nǐ ne? I'm fine, and you?\n"
    ),
    "metadata": {
        "book": 1,
        "lesson": 1,
        "section": "grammar",
        "category": "grammar",
        "topic": "自我介紹 Introducing Myself",
        "script": "traditional",
        "content_type": None,
        "material_type": "chapter",
        "page_range": "34-42",
        "difficulty": "beginner",
        "content_quality": 0.89,
    },
    "page_numbers": [34, 35, 36, 37, 38, 39, 40, 41, 42],
    "element_ids": ["abc123"],
}

VOCAB_CHUNK = {
    "content": "Vocabulary section content...",
    "metadata": {
        "book": 1,
        "lesson": 1,
        "section": "vocab",
        "category": "vocab",
        "topic": "自我介紹 Introducing Myself",
        "script": "traditional",
        "content_type": None,
        "material_type": "chapter",
        "page_range": "28-33",
        "difficulty": "beginner",
        "content_quality": 0.92,
    },
    "page_numbers": [28, 29, 30, 31, 32, 33],
    "element_ids": ["def456"],
}

DIALOGUE_CHUNK = {
    "content": "Dialogue section content...",
    "metadata": {
        "book": 1,
        "lesson": 1,
        "section": "dialogue",
        "category": "dialogue",
        "topic": "自我介紹 Introducing Myself",
        "script": "traditional",
        "content_type": None,
        "material_type": "chapter",
        "page_range": "24-27",
        "difficulty": "beginner",
        "content_quality": 0.95,
    },
    "page_numbers": [24, 25, 26, 27],
    "element_ids": ["ghi789"],
}

GRAMMAR_CHUNK_BOOK2_L3 = {
    "content": "Grammar III. Using 了 le for completed actions...",
    "metadata": {
        "book": 2,
        "lesson": 3,
        "section": "grammar",
        "category": "grammar",
        "topic": "購物 Shopping",
        "script": "traditional",
        "content_type": None,
        "material_type": "chapter",
        "page_range": "78-85",
        "difficulty": "beginner",
        "content_quality": 0.91,
    },
    "page_numbers": [78, 79, 80, 81, 82, 83, 84, 85],
    "element_ids": ["jkl012"],
}

INTRO_CHUNK = {
    "content": "Introduction to the textbook...",
    "metadata": {
        "book": 1,
        "lesson": None,
        "section": None,
        "category": None,
        "topic": None,
        "script": "traditional",
        "content_type": None,
        "material_type": "intro",
        "page_range": "1-10",
        "difficulty": "beginner",
        "content_quality": 0.95,
    },
    "page_numbers": [1, 2, 3],
    "element_ids": ["mno345"],
}


# ── Test: filter_grammar_chunks ────────────────────────────────────────


class TestFilterGrammarChunks:
    """Tests for filtering chunks by grammar section type."""

    def test_filters_grammar_chunks_only(self):
        chunks = [GRAMMAR_CHUNK_BOOK1_L1, VOCAB_CHUNK, DIALOGUE_CHUNK]
        result = filter_grammar_chunks(chunks)
        assert len(result) == 1
        assert result[0]["metadata"]["section"] == "grammar"

    def test_returns_empty_for_no_grammar_chunks(self):
        chunks = [VOCAB_CHUNK, DIALOGUE_CHUNK]
        result = filter_grammar_chunks(chunks)
        assert len(result) == 0

    def test_returns_multiple_grammar_chunks(self):
        chunks = [
            GRAMMAR_CHUNK_BOOK1_L1,
            VOCAB_CHUNK,
            GRAMMAR_CHUNK_BOOK2_L3,
        ]
        result = filter_grammar_chunks(chunks)
        assert len(result) == 2

    def test_skips_intro_chunks_without_section(self):
        chunks = [INTRO_CHUNK, GRAMMAR_CHUNK_BOOK1_L1]
        result = filter_grammar_chunks(chunks)
        assert len(result) == 1

    def test_empty_input_returns_empty(self):
        result = filter_grammar_chunks([])
        assert len(result) == 0

    def test_filters_by_book_id(self):
        chunks = [GRAMMAR_CHUNK_BOOK1_L1, GRAMMAR_CHUNK_BOOK2_L3]
        result = filter_grammar_chunks(chunks, book_id=1)
        assert len(result) == 1
        assert result[0]["metadata"]["book"] == 1


# ── Test: validate_grammar_point ───────────────────────────────────────


class TestValidateGrammarPoint:
    """Tests for grammar point validation."""

    def test_valid_grammar_point(self):
        point = {
            "title_english": "A-not-A Questions",
            "title_chinese": "正反問句",
            "function_description": "Used to form yes/no questions",
            "structure_pattern": "Subject + Verb-not-Verb + Object?",
            "usage_notes": "Common in spoken Chinese",
            "examples": [
                {
                    "traditional": "你是不是學生？",
                    "pinyin": "Nǐ shì bú shì xuéshēng?",
                    "english": "Are you a student?",
                }
            ],
        }
        assert validate_grammar_point(point) is True

    def test_missing_title_english_fails(self):
        point = {
            "title_english": "",
            "title_chinese": "正反問句",
            "function_description": "Used to form yes/no questions",
            "examples": [],
        }
        assert validate_grammar_point(point) is False

    def test_missing_title_english_key_fails(self):
        point = {
            "title_chinese": "正反問句",
            "function_description": "Used to form yes/no questions",
            "examples": [],
        }
        assert validate_grammar_point(point) is False

    def test_examples_not_list_fails(self):
        point = {
            "title_english": "A-not-A Questions",
            "examples": "not a list",
        }
        assert validate_grammar_point(point) is False

    def test_minimal_valid_point(self):
        point = {
            "title_english": "The Particle 呢",
            "examples": [],
        }
        assert validate_grammar_point(point) is True

    def test_none_examples_defaults_to_empty(self):
        point = {
            "title_english": "The Particle 呢",
        }
        # Missing examples key should still validate (defaults to [])
        assert validate_grammar_point(point) is True


# ── Test: assign_grammar_order ─────────────────────────────────────────


class TestAssignGrammarOrder:
    """Tests for grammar_order and sort_order assignment."""

    def test_sequential_order_within_lesson(self):
        points = [
            {"book_id": 1, "lesson_id": 1, "title_english": "A-not-A"},
            {"book_id": 1, "lesson_id": 1, "title_english": "Particle 呢"},
            {"book_id": 1, "lesson_id": 1, "title_english": "是 sentences"},
        ]
        result = assign_grammar_order(points)
        assert result[0]["grammar_order"] == 1
        assert result[1]["grammar_order"] == 2
        assert result[2]["grammar_order"] == 3

    def test_sort_order_matches_grammar_order(self):
        points = [
            {"book_id": 1, "lesson_id": 1, "title_english": "A-not-A"},
            {"book_id": 1, "lesson_id": 1, "title_english": "Particle 呢"},
        ]
        result = assign_grammar_order(points)
        assert result[0]["sort_order"] == 1
        assert result[1]["sort_order"] == 2

    def test_order_resets_per_lesson(self):
        points = [
            {"book_id": 1, "lesson_id": 1, "title_english": "A-not-A"},
            {"book_id": 1, "lesson_id": 1, "title_english": "Particle 呢"},
            {"book_id": 1, "lesson_id": 2, "title_english": "了 completed"},
            {"book_id": 1, "lesson_id": 2, "title_english": "在 progressive"},
        ]
        result = assign_grammar_order(points)
        # Lesson 1
        assert result[0]["grammar_order"] == 1
        assert result[1]["grammar_order"] == 2
        # Lesson 2 resets
        assert result[2]["grammar_order"] == 1
        assert result[3]["grammar_order"] == 2

    def test_order_resets_across_books(self):
        points = [
            {"book_id": 1, "lesson_id": 15, "title_english": "Review"},
            {"book_id": 2, "lesson_id": 1, "title_english": "New pattern"},
        ]
        result = assign_grammar_order(points)
        assert result[0]["grammar_order"] == 1
        assert result[1]["grammar_order"] == 1

    def test_empty_input(self):
        result = assign_grammar_order([])
        assert result == []

    def test_preserves_existing_fields(self):
        points = [
            {
                "book_id": 1,
                "lesson_id": 1,
                "title_english": "A-not-A",
                "title_chinese": "正反問句",
                "examples": [],
            },
        ]
        result = assign_grammar_order(points)
        assert result[0]["title_chinese"] == "正反問句"
        assert result[0]["examples"] == []


# ── Test: load_chunks ──────────────────────────────────────────────────


class TestLoadChunks:
    """Tests for loading chunk files."""

    def test_load_chunks_from_file(self, tmp_path):
        chunks = [GRAMMAR_CHUNK_BOOK1_L1, VOCAB_CHUNK]
        chunk_file = tmp_path / "book1_chunks.json"
        chunk_file.write_text(json.dumps(chunks), encoding="utf-8")

        result = load_chunks(str(chunk_file))
        assert len(result) == 2
        assert result[0]["metadata"]["section"] == "grammar"

    def test_load_chunks_nonexistent_file(self):
        with pytest.raises(FileNotFoundError):
            load_chunks("/nonexistent/path/book1_chunks.json")

    def test_load_chunks_invalid_json(self, tmp_path):
        chunk_file = tmp_path / "bad.json"
        chunk_file.write_text("not valid json", encoding="utf-8")

        with pytest.raises(json.JSONDecodeError):
            load_chunks(str(chunk_file))


# ── Test: seed_grammar_points ──────────────────────────────────────────


class TestSeedGrammarPoints:
    """Tests for the upsert/seeding logic."""

    @patch("src.scripts.seed_grammar_points.get_supabase_client")
    def test_seed_calls_upsert(self, mock_get_client):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_table = MagicMock()
        mock_client.table.return_value = mock_table
        mock_upsert = MagicMock()
        mock_table.upsert.return_value = mock_upsert
        mock_upsert.execute.return_value = MagicMock()

        rows = [
            {
                "book_id": 1,
                "lesson_id": 1,
                "grammar_order": 1,
                "title_english": "A-not-A Questions",
                "title_chinese": "正反問句",
                "function_description": "Used to form yes/no questions",
                "structure_pattern": "S + V-not-V + O?",
                "usage_notes": "Common in spoken Chinese",
                "examples": [
                    {
                        "traditional": "你是不是學生？",
                        "pinyin": "Nǐ shì bú shì xuéshēng?",
                        "english": "Are you a student?",
                    }
                ],
                "sort_order": 1,
            }
        ]

        seed_grammar_points(rows)

        mock_client.table.assert_called_with("grammar_points")
        mock_table.upsert.assert_called_once()
        call_args = mock_table.upsert.call_args
        assert call_args[0][0] == rows
        assert call_args[1]["on_conflict"] == "book_id,lesson_id,grammar_order"

    @patch("src.scripts.seed_grammar_points.get_supabase_client")
    def test_seed_batches_large_datasets(self, mock_get_client):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_table = MagicMock()
        mock_client.table.return_value = mock_table
        mock_upsert = MagicMock()
        mock_table.upsert.return_value = mock_upsert
        mock_upsert.execute.return_value = MagicMock()

        # Create 250 rows to test batching (should be 3 batches of 100, 100, 50)
        rows = [
            {
                "book_id": 1,
                "lesson_id": 1,
                "grammar_order": i,
                "title_english": f"Grammar Point {i}",
                "title_chinese": None,
                "function_description": None,
                "structure_pattern": None,
                "usage_notes": None,
                "examples": [],
                "sort_order": i,
            }
            for i in range(1, 251)
        ]

        seed_grammar_points(rows, batch_size=100)

        assert mock_table.upsert.call_count == 3

    @patch("src.scripts.seed_grammar_points.get_supabase_client")
    def test_seed_empty_rows(self, mock_get_client):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        seed_grammar_points([])

        mock_client.table.assert_not_called()

    @patch("src.scripts.seed_grammar_points.get_supabase_client")
    def test_seed_raises_on_upsert_failure(self, mock_get_client):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_table = MagicMock()
        mock_client.table.return_value = mock_table
        mock_upsert = MagicMock()
        mock_table.upsert.return_value = mock_upsert
        mock_upsert.execute.side_effect = Exception("Connection refused")

        rows = [
            {
                "book_id": 1,
                "lesson_id": 1,
                "grammar_order": 1,
                "title_english": "Test",
                "title_chinese": None,
                "function_description": None,
                "structure_pattern": None,
                "usage_notes": None,
                "examples": [],
                "sort_order": 1,
            }
        ]

        with pytest.raises(Exception, match="Connection refused"):
            seed_grammar_points(rows)


# ── Test: extract_grammar_points_llm ───────────────────────────────────


class TestExtractGrammarPointsLlm:
    """Tests for LLM-based grammar point extraction."""

    def test_extracts_valid_grammar_points(self):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(
            content=json.dumps(
                [
                    {
                        "title_english": "A-not-A Questions",
                        "title_chinese": "正反問句",
                        "function_description": "Used to form yes/no questions",
                        "structure_pattern": "S + V-not-V + O?",
                        "usage_notes": "Common in spoken Chinese",
                        "examples": [
                            {
                                "traditional": "你是不是學生？",
                                "pinyin": "Nǐ shì bú shì xuéshēng?",
                                "english": "Are you a student?",
                            }
                        ],
                    }
                ]
            )
        )

        result = extract_grammar_points_llm(GRAMMAR_CHUNK_BOOK1_L1, llm=mock_llm)
        assert len(result) == 1
        assert result[0]["title_english"] == "A-not-A Questions"
        assert result[0]["title_chinese"] == "正反問句"
        assert len(result[0]["examples"]) == 1

    def test_handles_markdown_code_blocks(self):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(
            content='```json\n[{"title_english": "Test Point", "examples": []}]\n```'
        )

        result = extract_grammar_points_llm(GRAMMAR_CHUNK_BOOK1_L1, llm=mock_llm)
        assert len(result) == 1
        assert result[0]["title_english"] == "Test Point"

    def test_filters_invalid_points(self):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(
            content=json.dumps(
                [
                    {"title_english": "Valid Point", "examples": []},
                    {"title_english": "", "examples": []},
                    {"title_chinese": "No English Title", "examples": []},
                ]
            )
        )

        result = extract_grammar_points_llm(GRAMMAR_CHUNK_BOOK1_L1, llm=mock_llm)
        assert len(result) == 1
        assert result[0]["title_english"] == "Valid Point"

    def test_handles_non_list_response(self):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(
            content=json.dumps({"title_english": "Single Point", "examples": []})
        )

        result = extract_grammar_points_llm(GRAMMAR_CHUNK_BOOK1_L1, llm=mock_llm)
        assert len(result) == 1
        assert result[0]["title_english"] == "Single Point"

    def test_returns_empty_on_invalid_json(self):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(content="not valid json at all")

        result = extract_grammar_points_llm(GRAMMAR_CHUNK_BOOK1_L1, llm=mock_llm)
        assert result == []

    def test_returns_empty_on_llm_exception(self):
        mock_llm = MagicMock()
        mock_llm.invoke.side_effect = RuntimeError("API error")

        result = extract_grammar_points_llm(GRAMMAR_CHUNK_BOOK1_L1, llm=mock_llm)
        assert result == []

    def test_defaults_missing_examples_to_empty_list(self):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(
            content=json.dumps(
                [
                    {"title_english": "No Examples Point"},
                ]
            )
        )

        result = extract_grammar_points_llm(GRAMMAR_CHUNK_BOOK1_L1, llm=mock_llm)
        assert len(result) == 1
        assert result[0]["examples"] == []

    def test_handles_string_response_without_content_attr(self):
        mock_llm = MagicMock()
        # Return a plain string (no .content attribute) to test str() fallback
        mock_llm.invoke.return_value = json.dumps(
            [{"title_english": "String Response", "examples": []}]
        )

        result = extract_grammar_points_llm(GRAMMAR_CHUNK_BOOK1_L1, llm=mock_llm)
        assert len(result) == 1
        assert result[0]["title_english"] == "String Response"


# ── Test: Malformed content handling ───────────────────────────────────


class TestMalformedContent:
    """Tests for handling malformed or noisy chunk content."""

    def test_validate_rejects_none_title(self):
        point = {
            "title_english": None,
            "examples": [],
        }
        assert validate_grammar_point(point) is False

    def test_validate_rejects_whitespace_only_title(self):
        point = {
            "title_english": "   ",
            "examples": [],
        }
        assert validate_grammar_point(point) is False

    def test_validate_accepts_missing_optional_fields(self):
        point = {
            "title_english": "A-not-A Questions",
            "examples": [
                {
                    "traditional": "你是不是學生？",
                    "pinyin": "Nǐ shì bú shì xuéshēng?",
                    "english": "Are you a student?",
                }
            ],
        }
        assert validate_grammar_point(point) is True

    def test_validate_rejects_non_dict_examples(self):
        point = {
            "title_english": "A-not-A Questions",
            "examples": ["not a dict", "also not a dict"],
        }
        assert validate_grammar_point(point) is False
