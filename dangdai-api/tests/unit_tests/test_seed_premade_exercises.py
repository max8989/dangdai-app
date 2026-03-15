"""Tests for premade exercises seeding script."""

import json
from unittest.mock import MagicMock, patch

import pytest

from src.scripts.seed_premade_exercises import (
    assign_exercise_order,
    extract_exercise_llm,
    filter_exercise_chunks,
    load_chunks,
    map_difficulty,
    seed_premade_exercises,
    validate_exercise_content,
)

# ── Sample chunk fixtures ──────────────────────────────────────────────

FILL_IN_BLANK_CHUNK = {
    "content": (
        "Fill in the Blank\n1. 你好，我叫___。\n2. 他是___人。\nWord bank: 美國, 王明\n"
    ),
    "metadata": {
        "book": 1,
        "lesson": 1,
        "lesson_title": "歡迎你來臺灣！",
        "section": "fill_in_blank",
        "exercise_type": "fill_in_blank",
        "material_type": "lesson",
        "script": "traditional",
        "content_type": "workbook",
        "page_range": "5-6",
        "difficulty": "beginner",
        "content_quality": 0.92,
    },
    "page_numbers": [5, 6],
    "element_ids": ["abc123"],
}

MATCHING_CHUNK = {
    "content": ("Match the sentences\n1. 你好 → A. 謝謝\n2. 歡迎 → B. 你好\n"),
    "metadata": {
        "book": 1,
        "lesson": 1,
        "lesson_title": "歡迎你來臺灣！",
        "section": "matching",
        "exercise_type": "matching",
        "material_type": "lesson",
        "script": "traditional",
        "content_type": "workbook",
        "page_range": "7",
        "difficulty": "beginner",
        "content_quality": 0.88,
    },
    "page_numbers": [7],
    "element_ids": ["def456"],
}

LISTENING_CHUNK = {
    "content": ("Listen and respond\n1. nǐ hǎo → 你好\n2. xiè xiè → 謝謝\n"),
    "metadata": {
        "book": 1,
        "lesson": 1,
        "lesson_title": "歡迎你來臺灣！",
        "section": "listening",
        "exercise_type": "listening",
        "material_type": "lesson",
        "script": "traditional",
        "content_type": "workbook",
        "page_range": "3-5",
        "difficulty": "beginner",
        "content_quality": 0.59,
    },
    "page_numbers": [3, 4, 5],
    "element_ids": ["ghi789"],
}

LESSON_INTRO_CHUNK = {
    "content": "Welcome to Taiwan!",
    "metadata": {
        "book": 1,
        "lesson": 1,
        "lesson_title": "歡迎你來臺灣！",
        "section": "lesson_intro",
        "exercise_type": "lesson_intro",
        "material_type": "lesson",
        "script": "traditional",
        "content_type": "workbook",
        "page_range": "3",
        "difficulty": "beginner",
        "content_quality": 0.95,
    },
    "page_numbers": [3],
    "element_ids": ["jkl012"],
}

NULL_EXERCISE_TYPE_CHUNK = {
    "content": "Front matter content",
    "metadata": {
        "book": 1,
        "lesson": None,
        "lesson_title": None,
        "section": None,
        "exercise_type": None,
        "material_type": "front_matter",
        "script": "traditional",
        "content_type": "workbook",
        "page_range": "1-2",
        "difficulty": "beginner",
        "content_quality": 0.91,
    },
    "page_numbers": [1, 2],
    "element_ids": ["mno345"],
}

SENTENCE_CONSTRUCTION_CHUNK = {
    "content": (
        "Rearrange the words\n1. 我 / 是 / 學生 → 我是學生\n2. 你 / 好 / 嗎 → 你好嗎\n"
    ),
    "metadata": {
        "book": 1,
        "lesson": 2,
        "lesson_title": "我的家人",
        "section": "sentence_construction",
        "exercise_type": "sentence_construction",
        "material_type": "lesson",
        "script": "traditional",
        "content_type": "workbook",
        "page_range": "12-13",
        "difficulty": "beginner",
        "content_quality": 0.90,
    },
    "page_numbers": [12, 13],
    "element_ids": ["pqr678"],
}

READING_CHUNK = {
    "content": (
        "Reading Comprehension\n"
        "我叫王明，我是美國人。我喜歡喝茶。\n"
        "1. 王明是哪國人？ a. 美國 b. 日本\n"
    ),
    "metadata": {
        "book": 1,
        "lesson": 3,
        "lesson_title": "週末做什麼？",
        "section": "reading",
        "exercise_type": "reading",
        "material_type": "lesson",
        "script": "traditional",
        "content_type": "workbook",
        "page_range": "20-21",
        "difficulty": "beginner",
        "content_quality": 0.85,
    },
    "page_numbers": [20, 21],
    "element_ids": ["stu901"],
}

COMPOSITION_CHUNK = {
    "content": (
        "Write a short paragraph about your family.\n"
        "Suggested vocabulary: 家人, 爸爸, 媽媽, 哥哥, 姐姐\n"
        "Word count: 50-80 words\n"
    ),
    "metadata": {
        "book": 1,
        "lesson": 2,
        "lesson_title": "我的家人",
        "section": "composition",
        "exercise_type": "composition",
        "material_type": "lesson",
        "script": "traditional",
        "content_type": "workbook",
        "page_range": "15",
        "difficulty": "beginner",
        "content_quality": 0.93,
    },
    "page_numbers": [15],
    "element_ids": ["vwx234"],
}

PRONUNCIATION_CHUNK = {
    "content": ("Differentiating Tones\n1. mā (媽) mǎ (馬)\n2. bā (八) bǎ (把)\n"),
    "metadata": {
        "book": 1,
        "lesson": 1,
        "lesson_title": "歡迎你來臺灣！",
        "section": "pronunciation",
        "exercise_type": "pronunciation",
        "material_type": "lesson",
        "script": "traditional",
        "content_type": "workbook",
        "page_range": "3",
        "difficulty": "beginner",
        "content_quality": 1.0,
    },
    "page_numbers": [3],
    "element_ids": ["yza567"],
}

DIALOGUE_COMPLETION_CHUNK = {
    "content": ("Complete the dialogue\nA: 你好！\nB: ___\nA: 你是哪國人？\nB: ___\n"),
    "metadata": {
        "book": 1,
        "lesson": 1,
        "lesson_title": "歡迎你來臺灣！",
        "section": "dialogue_completion",
        "exercise_type": "dialogue_completion",
        "material_type": "lesson",
        "script": "traditional",
        "content_type": "workbook",
        "page_range": "8-9",
        "difficulty": "beginner",
        "content_quality": 0.87,
    },
    "page_numbers": [8, 9],
    "element_ids": ["bcd890"],
}

CHARACTER_WRITING_CHUNK = {
    "content": (
        "Character Writing Practice\n1. 好 (hǎo) - good\n2. 人 (rén) - person\n"
    ),
    "metadata": {
        "book": 1,
        "lesson": 1,
        "lesson_title": "歡迎你來臺灣！",
        "section": "character_writing",
        "exercise_type": "character_writing",
        "material_type": "lesson",
        "script": "traditional",
        "content_type": "workbook",
        "page_range": "10",
        "difficulty": "beginner",
        "content_quality": 0.95,
    },
    "page_numbers": [10],
    "element_ids": ["efg123"],
}


# ── Test: filter_exercise_chunks ───────────────────────────────────────


class TestFilterExerciseChunks:
    """Tests for filtering chunks to exercise-only chunks."""

    def test_filters_out_lesson_intro(self):
        chunks = [FILL_IN_BLANK_CHUNK, LESSON_INTRO_CHUNK]
        result = filter_exercise_chunks(chunks)
        assert len(result) == 1
        assert result[0]["metadata"]["exercise_type"] == "fill_in_blank"

    def test_filters_out_null_exercise_type(self):
        chunks = [FILL_IN_BLANK_CHUNK, NULL_EXERCISE_TYPE_CHUNK]
        result = filter_exercise_chunks(chunks)
        assert len(result) == 1
        assert result[0]["metadata"]["exercise_type"] == "fill_in_blank"

    def test_filters_out_null_lesson(self):
        chunks = [FILL_IN_BLANK_CHUNK, NULL_EXERCISE_TYPE_CHUNK]
        result = filter_exercise_chunks(chunks)
        assert all(c["metadata"].get("lesson") is not None for c in result)

    def test_keeps_all_valid_exercise_types(self):
        chunks = [
            FILL_IN_BLANK_CHUNK,
            MATCHING_CHUNK,
            LISTENING_CHUNK,
            SENTENCE_CONSTRUCTION_CHUNK,
            READING_CHUNK,
            COMPOSITION_CHUNK,
            PRONUNCIATION_CHUNK,
            DIALOGUE_COMPLETION_CHUNK,
            CHARACTER_WRITING_CHUNK,
        ]
        result = filter_exercise_chunks(chunks)
        assert len(result) == 9

    def test_empty_input_returns_empty(self):
        result = filter_exercise_chunks([])
        assert result == []

    def test_filters_by_book_id(self):
        chunk_book2 = {
            **FILL_IN_BLANK_CHUNK,
            "metadata": {**FILL_IN_BLANK_CHUNK["metadata"], "book": 2},
        }
        chunks = [FILL_IN_BLANK_CHUNK, chunk_book2]
        result = filter_exercise_chunks(chunks, book_id=1)
        assert len(result) == 1
        assert result[0]["metadata"]["book"] == 1

    def test_no_book_filter_returns_all(self):
        chunk_book2 = {
            **FILL_IN_BLANK_CHUNK,
            "metadata": {**FILL_IN_BLANK_CHUNK["metadata"], "book": 2},
        }
        chunks = [FILL_IN_BLANK_CHUNK, chunk_book2]
        result = filter_exercise_chunks(chunks)
        assert len(result) == 2


# ── Test: map_difficulty ───────────────────────────────────────────────


class TestMapDifficulty:
    """Tests for mapping chunk difficulty to premade_exercises difficulty."""

    def test_beginner_maps_to_easy(self):
        assert map_difficulty("beginner") == "easy"

    def test_intermediate_maps_to_medium(self):
        assert map_difficulty("intermediate") == "medium"

    def test_advanced_maps_to_hard(self):
        assert map_difficulty("advanced") == "hard"

    def test_none_returns_none(self):
        assert map_difficulty(None) is None

    def test_unknown_returns_none(self):
        assert map_difficulty("unknown_value") is None

    def test_easy_maps_to_easy(self):
        assert map_difficulty("easy") == "easy"

    def test_medium_maps_to_medium(self):
        assert map_difficulty("medium") == "medium"

    def test_hard_maps_to_hard(self):
        assert map_difficulty("hard") == "hard"


# ── Test: validate_exercise_content ───────────────────────────────────


class TestValidateExerciseContent:
    """Tests for JSONB schema validation per exercise type."""

    def test_valid_fill_in_blank(self):
        content = {
            "sentences": [
                {
                    "text_with_blanks": "你好，我叫___。",
                    "word_bank": ["王明", "美國"],
                    "correct_answers": ["王明"],
                }
            ]
        }
        assert validate_exercise_content("fill_in_blank", content) is True

    def test_invalid_fill_in_blank_missing_sentences(self):
        content = {"pairs": [{"prompt": "你好", "response": "你好"}]}
        assert validate_exercise_content("fill_in_blank", content) is False

    def test_valid_matching(self):
        content = {
            "pairs": [
                {"prompt": "你好", "response": "Hello"},
                {"prompt": "謝謝", "response": "Thank you"},
            ]
        }
        assert validate_exercise_content("matching", content) is True

    def test_invalid_matching_missing_pairs(self):
        content = {"sentences": []}
        assert validate_exercise_content("matching", content) is False

    def test_valid_dialogue_completion(self):
        content = {
            "pairs": [
                {"prompt": "你好！", "response": "你好！"},
            ]
        }
        assert validate_exercise_content("dialogue_completion", content) is True

    def test_valid_sentence_construction(self):
        content = {
            "sentences": [
                {
                    "scrambled_words": ["我", "是", "學生"],
                    "correct_order": "我是學生",
                }
            ]
        }
        assert validate_exercise_content("sentence_construction", content) is True

    def test_invalid_sentence_construction_missing_sentences(self):
        content = {"pairs": []}
        assert validate_exercise_content("sentence_construction", content) is False

    def test_valid_reading(self):
        content = {
            "passage": "我叫王明，我是美國人。",
            "questions": [
                {
                    "question": "王明是哪國人？",
                    "options": ["美國", "日本"],
                    "correct_answer": "美國",
                }
            ],
        }
        assert validate_exercise_content("reading", content) is True

    def test_invalid_reading_missing_passage(self):
        content = {
            "questions": [
                {
                    "question": "王明是哪國人？",
                    "options": ["美國", "日本"],
                    "correct_answer": "美國",
                }
            ]
        }
        assert validate_exercise_content("reading", content) is False

    def test_valid_listening(self):
        content = {
            "sentences": [
                {"pinyin": "nǐ hǎo", "expected_chinese": "你好"},
            ]
        }
        assert validate_exercise_content("listening", content) is True

    def test_valid_composition(self):
        content = {
            "prompt": "Write about your family.",
            "word_count": 50,
            "suggested_vocabulary": ["家人", "爸爸"],
        }
        assert validate_exercise_content("composition", content) is True

    def test_invalid_composition_missing_prompt(self):
        content = {
            "word_count": 50,
            "suggested_vocabulary": ["家人"],
        }
        assert validate_exercise_content("composition", content) is False

    def test_valid_pronunciation(self):
        content = {
            "sentences": [
                {"pinyin": "mā", "expected_chinese": "媽"},
            ]
        }
        assert validate_exercise_content("pronunciation", content) is True

    def test_valid_character_writing(self):
        content = {
            "characters": [
                {
                    "character": "好",
                    "pinyin": "hǎo",
                    "stroke_order_hint": "女 + 子",
                }
            ]
        }
        assert validate_exercise_content("character_writing", content) is True

    def test_invalid_character_writing_missing_characters(self):
        content = {"sentences": []}
        assert validate_exercise_content("character_writing", content) is False

    def test_empty_content_is_invalid(self):
        assert validate_exercise_content("fill_in_blank", {}) is False

    def test_unknown_exercise_type_returns_false(self):
        assert validate_exercise_content("unknown_type", {"data": "value"}) is False


# ── Test: assign_exercise_order ────────────────────────────────────────


class TestAssignExerciseOrder:
    """Tests for sequential exercise_order assignment per (book_id, lesson_id)."""

    def test_assigns_sequential_order_within_lesson(self):
        exercises = [
            {"book_id": 1, "lesson_id": 1, "exercise_type": "pronunciation"},
            {"book_id": 1, "lesson_id": 1, "exercise_type": "listening"},
            {"book_id": 1, "lesson_id": 1, "exercise_type": "fill_in_blank"},
        ]
        result = assign_exercise_order(exercises)
        orders = [e["exercise_order"] for e in result]
        assert orders == [1, 2, 3]

    def test_resets_order_for_new_lesson(self):
        exercises = [
            {"book_id": 1, "lesson_id": 1, "exercise_type": "fill_in_blank"},
            {"book_id": 1, "lesson_id": 2, "exercise_type": "fill_in_blank"},
        ]
        result = assign_exercise_order(exercises)
        assert result[0]["exercise_order"] == 1
        assert result[1]["exercise_order"] == 1

    def test_resets_order_for_new_book(self):
        exercises = [
            {"book_id": 1, "lesson_id": 1, "exercise_type": "fill_in_blank"},
            {"book_id": 2, "lesson_id": 1, "exercise_type": "fill_in_blank"},
        ]
        result = assign_exercise_order(exercises)
        assert result[0]["exercise_order"] == 1
        assert result[1]["exercise_order"] == 1

    def test_multiple_exercise_types_same_lesson(self):
        exercises = [
            {"book_id": 1, "lesson_id": 1, "exercise_type": "pronunciation"},
            {"book_id": 1, "lesson_id": 1, "exercise_type": "listening"},
            {"book_id": 1, "lesson_id": 1, "exercise_type": "matching"},
            {"book_id": 1, "lesson_id": 1, "exercise_type": "fill_in_blank"},
        ]
        result = assign_exercise_order(exercises)
        orders = [e["exercise_order"] for e in result]
        assert orders == [1, 2, 3, 4]

    def test_empty_input_returns_empty(self):
        result = assign_exercise_order([])
        assert result == []

    def test_preserves_other_fields(self):
        exercises = [
            {
                "book_id": 1,
                "lesson_id": 1,
                "exercise_type": "fill_in_blank",
                "content": {"sentences": []},
            }
        ]
        result = assign_exercise_order(exercises)
        assert result[0]["content"] == {"sentences": []}
        assert result[0]["exercise_order"] == 1


# ── Test: extract_exercise_llm ─────────────────────────────────────────


class TestExtractExerciseLlm:
    """Tests for LLM-based exercise content extraction."""

    def test_extracts_fill_in_blank(self):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(
            content=json.dumps(
                {
                    "title": "Fill in the Blank",
                    "instructions": "Fill in the blanks with the correct words.",
                    "content": {
                        "sentences": [
                            {
                                "text_with_blanks": "你好，我叫___。",
                                "word_bank": ["王明", "美國"],
                                "correct_answers": ["王明"],
                            }
                        ]
                    },
                    "low_confidence": False,
                }
            )
        )

        result = extract_exercise_llm(FILL_IN_BLANK_CHUNK, llm=mock_llm)
        assert result is not None
        assert result["title"] == "Fill in the Blank"
        assert "sentences" in result["content"]

    def test_extracts_listening_as_reading_format(self):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(
            content=json.dumps(
                {
                    "title": "Listen and Respond",
                    "instructions": "Match the pinyin to the Chinese characters.",
                    "content": {
                        "sentences": [
                            {"pinyin": "nǐ hǎo", "expected_chinese": "你好"},
                        ]
                    },
                    "low_confidence": False,
                }
            )
        )

        result = extract_exercise_llm(LISTENING_CHUNK, llm=mock_llm)
        assert result is not None
        assert "sentences" in result["content"]

    def test_returns_none_on_invalid_json(self):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(content="not valid json")

        result = extract_exercise_llm(FILL_IN_BLANK_CHUNK, llm=mock_llm)
        assert result is None

    def test_returns_none_on_llm_exception(self):
        mock_llm = MagicMock()
        mock_llm.invoke.side_effect = RuntimeError("API error")

        result = extract_exercise_llm(FILL_IN_BLANK_CHUNK, llm=mock_llm)
        assert result is None

    def test_handles_markdown_code_blocks(self):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(
            content=(
                "```json\n"
                '{"title": "Fill in the Blank", "instructions": "Fill in.", '
                '"content": {"sentences": [{"text_with_blanks": "你好___", '
                '"word_bank": ["王明"], "correct_answers": ["王明"]}]}, '
                '"low_confidence": false}\n'
                "```"
            )
        )

        result = extract_exercise_llm(FILL_IN_BLANK_CHUNK, llm=mock_llm)
        assert result is not None
        assert result["title"] == "Fill in the Blank"

    def test_flags_low_confidence(self):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(
            content=json.dumps(
                {
                    "title": "Ambiguous Exercise",
                    "instructions": "Complete the exercise.",
                    "content": {
                        "sentences": [
                            {"pinyin": "nǐ hǎo", "expected_chinese": "你好"},
                        ]
                    },
                    "low_confidence": True,
                }
            )
        )

        result = extract_exercise_llm(LISTENING_CHUNK, llm=mock_llm)
        assert result is not None
        assert result.get("low_confidence") is True

    def test_returns_none_on_invalid_content_schema(self):
        """When LLM returns content that fails schema validation, return None."""
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(
            content=json.dumps(
                {
                    "title": "Bad Exercise",
                    "instructions": "Do something.",
                    "content": {"wrong_key": "wrong_value"},
                    "low_confidence": False,
                }
            )
        )

        result = extract_exercise_llm(FILL_IN_BLANK_CHUNK, llm=mock_llm)
        assert result is None

    def test_handles_string_response_without_content_attr(self):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = json.dumps(
            {
                "title": "Fill in the Blank",
                "instructions": "Fill in the blanks.",
                "content": {
                    "sentences": [
                        {
                            "text_with_blanks": "你好___",
                            "word_bank": ["王明"],
                            "correct_answers": ["王明"],
                        }
                    ]
                },
                "low_confidence": False,
            }
        )

        result = extract_exercise_llm(FILL_IN_BLANK_CHUNK, llm=mock_llm)
        assert result is not None


# ── Test: load_chunks ──────────────────────────────────────────────────


class TestLoadChunks:
    """Tests for loading chunk files."""

    def test_load_chunks_from_file(self, tmp_path):
        chunks = [FILL_IN_BLANK_CHUNK, MATCHING_CHUNK]
        chunk_file = tmp_path / "workbook1_chunks.json"
        chunk_file.write_text(json.dumps(chunks), encoding="utf-8")

        result = load_chunks(str(chunk_file))
        assert len(result) == 2

    def test_load_chunks_nonexistent_file(self):
        with pytest.raises(FileNotFoundError):
            load_chunks("/nonexistent/path/workbook1_chunks.json")

    def test_load_chunks_invalid_json(self, tmp_path):
        chunk_file = tmp_path / "bad.json"
        chunk_file.write_text("not valid json", encoding="utf-8")

        with pytest.raises(json.JSONDecodeError):
            load_chunks(str(chunk_file))


# ── Test: seed_premade_exercises ───────────────────────────────────────


class TestSeedPremadeExercises:
    """Tests for the upsert/seeding logic."""

    @patch("src.scripts.seed_premade_exercises.get_supabase_client")
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
                "exercise_type": "fill_in_blank",
                "exercise_order": 1,
                "title": "Fill in the Blank",
                "instructions": "Fill in the blanks.",
                "content": {
                    "sentences": [
                        {
                            "text_with_blanks": "你好___",
                            "word_bank": ["王明"],
                            "correct_answers": ["王明"],
                        }
                    ]
                },
                "difficulty": "easy",
                "source_page_range": "5-6",
            }
        ]

        seed_premade_exercises(rows)

        mock_client.table.assert_called_with("premade_exercises")
        mock_table.upsert.assert_called_once()
        call_args = mock_table.upsert.call_args
        assert call_args[1]["on_conflict"] == (
            "book_id,lesson_id,exercise_type,exercise_order"
        )

    @patch("src.scripts.seed_premade_exercises.get_supabase_client")
    def test_seed_batches_large_datasets(self, mock_get_client):
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
                "lesson_id": i,
                "exercise_type": "fill_in_blank",
                "exercise_order": 1,
                "title": f"Exercise {i}",
                "instructions": "Fill in.",
                "content": {
                    "sentences": [
                        {
                            "text_with_blanks": "你好___",
                            "word_bank": ["王明"],
                            "correct_answers": ["王明"],
                        }
                    ]
                },
                "difficulty": "easy",
                "source_page_range": "5-6",
            }
            for i in range(1, 251)
        ]

        seed_premade_exercises(rows, batch_size=100)

        assert mock_table.upsert.call_count == 3

    @patch("src.scripts.seed_premade_exercises.get_supabase_client")
    def test_seed_empty_rows(self, mock_get_client):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        seed_premade_exercises([])

        mock_client.table.assert_not_called()

    @patch("src.scripts.seed_premade_exercises.get_supabase_client")
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
                "exercise_type": "fill_in_blank",
                "exercise_order": 1,
                "title": "Fill in the Blank",
                "instructions": "Fill in.",
                "content": {"sentences": []},
                "difficulty": "easy",
                "source_page_range": "5-6",
            }
        ]

        with pytest.raises(Exception, match="Connection refused"):
            seed_premade_exercises(rows)


# ── Test: process_chunks integration ──────────────────────────────────


class TestProcessChunksIntegration:
    """Integration tests for process_chunks function."""

    @patch("src.utils.llm_factory.get_llm")
    @patch("src.scripts.seed_premade_exercises.extract_exercise_llm")
    @patch("src.scripts.seed_premade_exercises.load_chunks")
    @patch("src.scripts.seed_premade_exercises.time")
    def test_process_chunks_filters_and_extracts(
        self, mock_time, mock_load, mock_extract, mock_get_llm
    ):
        from src.scripts.seed_premade_exercises import process_chunks

        mock_load.return_value = [
            FILL_IN_BLANK_CHUNK,
            LESSON_INTRO_CHUNK,
            NULL_EXERCISE_TYPE_CHUNK,
        ]

        mock_extract.return_value = {
            "title": "Fill in the Blank",
            "instructions": "Fill in the blanks.",
            "content": {
                "sentences": [
                    {
                        "text_with_blanks": "你好___",
                        "word_bank": ["王明"],
                        "correct_answers": ["王明"],
                    }
                ]
            },
            "low_confidence": False,
        }

        with patch("pathlib.Path.exists", return_value=True):
            result = process_chunks("/fake/dir", book_id=1)

        # Only fill_in_blank chunk should be processed (lesson_intro and null filtered)
        assert len(result) == 1
        assert result[0]["exercise_type"] == "fill_in_blank"
        assert result[0]["book_id"] == 1
        assert result[0]["lesson_id"] == 1

    @patch("src.utils.llm_factory.get_llm")
    @patch("src.scripts.seed_premade_exercises.extract_exercise_llm")
    @patch("src.scripts.seed_premade_exercises.load_chunks")
    @patch("src.scripts.seed_premade_exercises.time")
    def test_process_chunks_assigns_exercise_order(
        self, mock_time, mock_load, mock_extract, mock_get_llm
    ):
        from src.scripts.seed_premade_exercises import process_chunks

        mock_load.return_value = [
            PRONUNCIATION_CHUNK,
            LISTENING_CHUNK,
            FILL_IN_BLANK_CHUNK,
        ]

        mock_extract.return_value = {
            "title": "Exercise",
            "instructions": "Do it.",
            "content": {
                "sentences": [
                    {"pinyin": "nǐ hǎo", "expected_chinese": "你好"},
                ]
            },
            "low_confidence": False,
        }

        with patch("pathlib.Path.exists", return_value=True):
            result = process_chunks("/fake/dir", book_id=1)

        # All 3 chunks are for lesson 1, should get sequential orders
        assert len(result) == 3
        orders = sorted(e["exercise_order"] for e in result)
        assert orders == [1, 2, 3]

    @patch("src.scripts.seed_premade_exercises.load_chunks")
    @patch("src.scripts.seed_premade_exercises.time")
    def test_process_chunks_dry_run_skips_llm(self, mock_time, mock_load):
        from src.scripts.seed_premade_exercises import process_chunks

        mock_load.return_value = [FILL_IN_BLANK_CHUNK]

        with patch("pathlib.Path.exists", return_value=True):
            result = process_chunks("/fake/dir", book_id=1, dry_run=True)

        # Dry run should return empty list (no LLM calls)
        assert result == []

    @patch("src.utils.llm_factory.get_llm")
    @patch("src.scripts.seed_premade_exercises.extract_exercise_llm")
    @patch("src.scripts.seed_premade_exercises.load_chunks")
    @patch("src.scripts.seed_premade_exercises.time")
    def test_process_chunks_skips_failed_extractions(
        self, mock_time, mock_load, mock_extract, mock_get_llm
    ):
        from src.scripts.seed_premade_exercises import process_chunks

        mock_load.return_value = [FILL_IN_BLANK_CHUNK, MATCHING_CHUNK]

        # First extraction fails, second succeeds
        mock_extract.side_effect = [
            None,
            {
                "title": "Matching",
                "instructions": "Match the pairs.",
                "content": {"pairs": [{"prompt": "你好", "response": "Hello"}]},
                "low_confidence": False,
            },
        ]

        with patch("pathlib.Path.exists", return_value=True):
            result = process_chunks("/fake/dir", book_id=1)

        # Only the successful extraction should be in results
        assert len(result) == 1
        assert result[0]["exercise_type"] == "matching"

    @patch("src.utils.llm_factory.get_llm")
    @patch("src.scripts.seed_premade_exercises.extract_exercise_llm")
    @patch("src.scripts.seed_premade_exercises.load_chunks")
    @patch("src.scripts.seed_premade_exercises.time")
    def test_process_chunks_sets_low_confidence_difficulty_to_none(
        self, mock_time, mock_load, mock_extract, mock_get_llm
    ):
        from src.scripts.seed_premade_exercises import process_chunks

        mock_load.return_value = [FILL_IN_BLANK_CHUNK]

        mock_extract.return_value = {
            "title": "Ambiguous Exercise",
            "instructions": "Do something.",
            "content": {
                "sentences": [
                    {
                        "text_with_blanks": "你好___",
                        "word_bank": ["王明"],
                        "correct_answers": ["王明"],
                    }
                ]
            },
            "low_confidence": True,
        }

        with patch("pathlib.Path.exists", return_value=True):
            result = process_chunks("/fake/dir", book_id=1)

        assert len(result) == 1
        # Low confidence exercises should have difficulty set to None
        assert result[0]["difficulty"] is None

    @patch("src.scripts.seed_premade_exercises.load_chunks")
    def test_process_chunks_missing_file_skips_book(self, mock_load):
        from src.scripts.seed_premade_exercises import process_chunks

        mock_load.side_effect = FileNotFoundError("File not found")

        with patch("pathlib.Path.exists", return_value=False):
            result = process_chunks("/fake/dir", book_id=1)

        assert result == []

    @patch("src.scripts.seed_premade_exercises.extract_exercise_llm")
    @patch("src.scripts.seed_premade_exercises.load_chunks")
    @patch("src.scripts.seed_premade_exercises.time")
    def test_process_chunks_skips_low_quality_chunks(
        self, mock_time, mock_load, mock_extract
    ):
        """Chunks with content_quality < 0.5 are skipped without LLM call."""
        from src.scripts.seed_premade_exercises import process_chunks

        low_quality_chunk = {
            **FILL_IN_BLANK_CHUNK,
            "metadata": {**FILL_IN_BLANK_CHUNK["metadata"], "content_quality": 0.3},
        }
        mock_load.return_value = [low_quality_chunk]

        with patch("pathlib.Path.exists", return_value=True):
            result = process_chunks("/fake/dir", book_id=1)

        # Low quality chunk should be skipped — no LLM call, no result
        assert result == []
        mock_extract.assert_not_called()

    @patch("src.utils.llm_factory.get_llm")
    @patch("src.scripts.seed_premade_exercises.extract_exercise_llm")
    @patch("src.scripts.seed_premade_exercises.load_chunks")
    @patch("src.scripts.seed_premade_exercises.time")
    def test_process_chunks_deduplicates_same_exercise_type(
        self, mock_time, mock_load, mock_extract, mock_get_llm
    ):
        """When two chunks produce same (book, lesson, exercise_type), keep last."""
        from src.scripts.seed_premade_exercises import process_chunks

        # Two fill_in_blank chunks for the same lesson (split OCR pages)
        chunk_page1 = {
            **FILL_IN_BLANK_CHUNK,
            "metadata": {**FILL_IN_BLANK_CHUNK["metadata"], "page_range": "5"},
        }
        chunk_page2 = {
            **FILL_IN_BLANK_CHUNK,
            "metadata": {**FILL_IN_BLANK_CHUNK["metadata"], "page_range": "6"},
        }
        mock_load.return_value = [chunk_page1, chunk_page2]

        mock_extract.side_effect = [
            {
                "title": "Fill in the Blank (page 5)",
                "instructions": "Fill in.",
                "content": {
                    "sentences": [
                        {
                            "text_with_blanks": "你好___",
                            "word_bank": ["王明"],
                            "correct_answers": ["王明"],
                        }
                    ]
                },
                "low_confidence": False,
            },
            {
                "title": "Fill in the Blank (page 6)",
                "instructions": "Fill in.",
                "content": {
                    "sentences": [
                        {
                            "text_with_blanks": "他是___人",
                            "word_bank": ["美國"],
                            "correct_answers": ["美國"],
                        }
                    ]
                },
                "low_confidence": False,
            },
        ]

        with patch("pathlib.Path.exists", return_value=True):
            result = process_chunks("/fake/dir", book_id=1)

        # Should deduplicate to 1 exercise (last chunk wins)
        assert len(result) == 1
        assert result[0]["title"] == "Fill in the Blank (page 6)"

    @patch("src.scripts.seed_premade_exercises.extract_exercise_llm")
    @patch("src.scripts.seed_premade_exercises.load_chunks")
    @patch("src.scripts.seed_premade_exercises.time")
    def test_process_chunks_skips_unknown_exercise_type(
        self, mock_time, mock_load, mock_extract
    ):
        """Chunks with exercise_type not in VALID_EXERCISE_TYPES are skipped."""
        from src.scripts.seed_premade_exercises import process_chunks

        unknown_type_chunk = {
            **FILL_IN_BLANK_CHUNK,
            "metadata": {
                **FILL_IN_BLANK_CHUNK["metadata"],
                "exercise_type": "unknown_type",
            },
        }
        mock_load.return_value = [unknown_type_chunk]

        with patch("pathlib.Path.exists", return_value=True):
            result = process_chunks("/fake/dir", book_id=1)

        # Unknown exercise type should be skipped — no LLM call, no result
        assert result == []
        mock_extract.assert_not_called()
