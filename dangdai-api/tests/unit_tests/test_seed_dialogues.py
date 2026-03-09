"""Tests for dialogue seeding script."""

import json
from unittest.mock import MagicMock, patch

import pytest

from src.scripts.seed_dialogues import (
    detect_dialogue_number,
    extract_dialogues_llm,
    filter_dialogue_chunks,
    load_chunks,
    seed_dialogues,
    validate_dialogue,
    validate_dialogue_line,
)

# ── Sample chunk fixtures ──────────────────────────────────────────────

DIALOGUE_CHUNK_BOOK1_L2 = {
    "content": (
        "寺 話 二 Dialogue II\n"
        "明 華 ： 田 中 ， 歡迎 ！ 歡迎 ！ 請 進 。\n"
        "Tianzhong, huanying! Huanying! Qing jin.\n"
        "田 中 ： 謝謝 。\n"
        "Xiexie.\n"
        "明 華 ： 田 中 ， 這 是 我 媽媽 。\n"
        "Tianzhong, zhe shi wo mama.\n"
    ),
    "metadata": {
        "book": 1,
        "lesson": 2,
        "section": "dialogue",
        "category": "dialogue",
        "topic": "家人 Family Members",
        "script": "traditional",
        "content_type": None,
        "material_type": "chapter",
        "page_range": "53-55",
        "difficulty": "beginner",
        "content_quality": 0.89,
    },
    "page_numbers": [53, 54, 55],
    "element_ids": ["abc123"],
}

DIALOGUE_CHUNK_BOOK1_L6 = {
    "content": (
        "對 話 一 Dialogue I\n"
        "安 同 ： 聽說怡君的 學校很漂 亮 。\n"
        "如 玉 ： 他們 學校在哪裡 ？ 遠不 遠 ？\n"
        "安 同 ： 有 一點遠 。\n"
        "\n"
        "對 話 二 Dialogue II\n"
        "怡 君 ： 歡迎你們 來 。\n"
        "安 同 ： 你們 學校真遠 ！\n"
    ),
    "metadata": {
        "book": 1,
        "lesson": 6,
        "section": "dialogue",
        "category": "dialogue",
        "topic": "地點、方位 Locations and Positions",
        "script": "traditional",
        "content_type": None,
        "material_type": "chapter",
        "page_range": "131-136",
        "difficulty": "beginner",
        "content_quality": 0.89,
    },
    "page_numbers": [131, 132, 133, 134, 135, 136],
    "element_ids": ["def456"],
}

VOCAB_CHUNK = {
    "content": "Vocabulary section content...",
    "metadata": {
        "book": 1,
        "lesson": 2,
        "section": "vocab",
        "category": "vocab",
        "topic": "家人 Family Members",
        "script": "traditional",
        "content_type": None,
        "material_type": "chapter",
        "page_range": "56-60",
        "difficulty": "beginner",
        "content_quality": 0.92,
    },
    "page_numbers": [56, 57, 58, 59, 60],
    "element_ids": ["ghi789"],
}

GRAMMAR_CHUNK = {
    "content": "Grammar section content...",
    "metadata": {
        "book": 1,
        "lesson": 2,
        "section": "grammar",
        "category": "grammar",
        "topic": "家人 Family Members",
        "script": "traditional",
        "content_type": None,
        "material_type": "chapter",
        "page_range": "61-70",
        "difficulty": "beginner",
        "content_quality": 0.90,
    },
    "page_numbers": [61, 62, 63, 64, 65, 66, 67, 68, 69, 70],
    "element_ids": ["jkl012"],
}

READING_CHUNK_BOOK2 = {
    "content": ("Reading\n李 明 華 靖安 同 和 美 玲去 參加 他妹妹 的 婚禮\n"),
    "metadata": {
        "book": 2,
        "lesson": 3,
        "section": "reading",
        "category": "reading",
        "topic": "人際關係 Inter-personal Relationships",
        "script": "traditional",
        "content_type": None,
        "material_type": "chapter",
        "page_range": "78-85",
        "difficulty": "beginner",
        "content_quality": 0.91,
    },
    "page_numbers": [78, 79, 80, 81, 82, 83, 84, 85],
    "element_ids": ["mno345"],
}


# ── Test: filter_dialogue_chunks ───────────────────────────────────────


class TestFilterDialogueChunks:
    """Tests for filtering chunks by dialogue/reading section type."""

    def test_filters_dialogue_chunks_only(self):
        chunks = [DIALOGUE_CHUNK_BOOK1_L2, VOCAB_CHUNK, GRAMMAR_CHUNK]
        result = filter_dialogue_chunks(chunks)
        assert len(result) == 1
        assert result[0]["metadata"]["section"] == "dialogue"

    def test_includes_reading_chunks(self):
        chunks = [READING_CHUNK_BOOK2, VOCAB_CHUNK]
        result = filter_dialogue_chunks(chunks)
        assert len(result) == 1
        assert result[0]["metadata"]["section"] == "reading"

    def test_returns_both_dialogue_and_reading(self):
        chunks = [
            DIALOGUE_CHUNK_BOOK1_L2,
            READING_CHUNK_BOOK2,
            VOCAB_CHUNK,
        ]
        result = filter_dialogue_chunks(chunks)
        assert len(result) == 2

    def test_returns_empty_for_no_dialogue_chunks(self):
        chunks = [VOCAB_CHUNK, GRAMMAR_CHUNK]
        result = filter_dialogue_chunks(chunks)
        assert len(result) == 0

    def test_empty_input_returns_empty(self):
        result = filter_dialogue_chunks([])
        assert len(result) == 0

    def test_filters_by_book_id(self):
        chunks = [DIALOGUE_CHUNK_BOOK1_L2, READING_CHUNK_BOOK2]
        result = filter_dialogue_chunks(chunks, book_id=1)
        assert len(result) == 1
        assert result[0]["metadata"]["book"] == 1

    def test_filters_by_book_id_2(self):
        chunks = [DIALOGUE_CHUNK_BOOK1_L2, READING_CHUNK_BOOK2]
        result = filter_dialogue_chunks(chunks, book_id=2)
        assert len(result) == 1
        assert result[0]["metadata"]["book"] == 2


# ── Test: detect_dialogue_number ───────────────────────────────────────


class TestDetectDialogueNumber:
    """Tests for dialogue number detection from content markers."""

    def test_detects_dialogue_i_english(self):
        assert detect_dialogue_number("Dialogue I content here") == 1

    def test_detects_dialogue_ii_english(self):
        assert detect_dialogue_number("Dialogue II content here") == 2

    def test_detects_dialogue_i_chinese(self):
        assert detect_dialogue_number("對話一 some content") == 1

    def test_detects_dialogue_ii_chinese(self):
        assert detect_dialogue_number("對話二 some content") == 2

    def test_detects_ocr_variant_dialogue_i(self):
        assert detect_dialogue_number("寺 話 一 Dialogue I") == 1

    def test_detects_ocr_variant_dialogue_ii(self):
        assert detect_dialogue_number("寺 話 二 Dialogue II") == 2

    def test_defaults_to_1_when_no_marker(self):
        assert detect_dialogue_number("Some content without markers") == 1

    def test_detects_dialoguei_no_space(self):
        assert detect_dialogue_number("DialogueI content") == 1

    def test_detects_dialogueii_no_space(self):
        assert detect_dialogue_number("DialogueII content") == 2


# ── Test: validate_dialogue_line ───────────────────────────────────────


class TestValidateDialogueLine:
    """Tests for dialogue line validation."""

    def test_valid_line(self):
        line = {
            "speaker": "明華",
            "traditional": "田中，歡迎！歡迎！請進。",
            "simplified": "田中，欢迎！欢迎！请进。",
            "pinyin": "Tiánzhōng, huānyíng! Huānyíng! Qǐng jìn.",
            "english": "Tanaka, welcome! Welcome! Please come in.",
        }
        assert validate_dialogue_line(line) is True

    def test_missing_speaker_fails(self):
        line = {
            "traditional": "田中，歡迎！",
            "simplified": "田中，欢迎！",
            "pinyin": "Tiánzhōng, huānyíng!",
            "english": "Tanaka, welcome!",
        }
        assert validate_dialogue_line(line) is False

    def test_empty_speaker_fails(self):
        line = {
            "speaker": "",
            "traditional": "田中，歡迎！",
            "simplified": "田中，欢迎！",
            "pinyin": "Tiánzhōng, huānyíng!",
            "english": "Tanaka, welcome!",
        }
        assert validate_dialogue_line(line) is False

    def test_missing_traditional_fails(self):
        line = {
            "speaker": "明華",
            "simplified": "田中，欢迎！",
            "pinyin": "Tiánzhōng, huānyíng!",
            "english": "Tanaka, welcome!",
        }
        assert validate_dialogue_line(line) is False

    def test_missing_simplified_fails(self):
        line = {
            "speaker": "明華",
            "traditional": "田中，歡迎！",
            "pinyin": "Tiánzhōng, huānyíng!",
            "english": "Tanaka, welcome!",
        }
        assert validate_dialogue_line(line) is False

    def test_missing_pinyin_fails(self):
        line = {
            "speaker": "明華",
            "traditional": "田中，歡迎！",
            "simplified": "田中，欢迎！",
            "english": "Tanaka, welcome!",
        }
        assert validate_dialogue_line(line) is False

    def test_missing_english_fails(self):
        line = {
            "speaker": "明華",
            "traditional": "田中，歡迎！",
            "simplified": "田中，欢迎！",
            "pinyin": "Tiánzhōng, huānyíng!",
        }
        assert validate_dialogue_line(line) is False

    def test_non_dict_fails(self):
        assert validate_dialogue_line("not a dict") is False

    def test_none_fails(self):
        assert validate_dialogue_line(None) is False


# ── Test: validate_dialogue ────────────────────────────────────────────


class TestValidateDialogue:
    """Tests for full dialogue validation."""

    def test_valid_dialogue(self):
        dialogue = {
            "title_traditional": "對話一",
            "title_english": "Dialogue I",
            "dialogue_number": 1,
            "lines": [
                {
                    "speaker": "明華",
                    "traditional": "田中，歡迎！",
                    "simplified": "田中，欢迎！",
                    "pinyin": "Tiánzhōng, huānyíng!",
                    "english": "Tanaka, welcome!",
                },
            ],
        }
        assert validate_dialogue(dialogue) is True

    def test_empty_lines_fails(self):
        dialogue = {
            "title_traditional": "對話一",
            "title_english": "Dialogue I",
            "dialogue_number": 1,
            "lines": [],
        }
        assert validate_dialogue(dialogue) is False

    def test_missing_lines_fails(self):
        dialogue = {
            "title_traditional": "對話一",
            "title_english": "Dialogue I",
            "dialogue_number": 1,
        }
        assert validate_dialogue(dialogue) is False

    def test_invalid_dialogue_number_fails(self):
        dialogue = {
            "title_traditional": "對話一",
            "title_english": "Dialogue I",
            "dialogue_number": 3,
            "lines": [
                {
                    "speaker": "明華",
                    "traditional": "你好",
                    "simplified": "你好",
                    "pinyin": "Nǐ hǎo",
                    "english": "Hello",
                },
            ],
        }
        assert validate_dialogue(dialogue) is False

    def test_invalid_line_in_dialogue_fails(self):
        dialogue = {
            "title_traditional": "對話一",
            "title_english": "Dialogue I",
            "dialogue_number": 1,
            "lines": [
                {
                    "speaker": "",
                    "traditional": "你好",
                    "simplified": "你好",
                    "pinyin": "Nǐ hǎo",
                    "english": "Hello",
                },
            ],
        }
        assert validate_dialogue(dialogue) is False

    def test_missing_title_still_valid_but_warns(self):
        """Dialogues without titles pass validation but log a warning (AC #4)."""
        dialogue = {
            "dialogue_number": 1,
            "lines": [
                {
                    "speaker": "明華",
                    "traditional": "你好",
                    "simplified": "你好",
                    "pinyin": "Nǐ hǎo",
                    "english": "Hello",
                },
            ],
        }
        assert validate_dialogue(dialogue) is True


# ── Test: extract_dialogues_llm ────────────────────────────────────────


class TestExtractDialoguesLlm:
    """Tests for LLM-based dialogue extraction."""

    def test_extracts_single_dialogue(self):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(
            content=json.dumps(
                [
                    {
                        "title_traditional": "對話二",
                        "title_english": "Dialogue II",
                        "dialogue_number": 2,
                        "lines": [
                            {
                                "speaker": "明華",
                                "traditional": "田中，歡迎！歡迎！請進。",
                                "simplified": "田中，欢迎！欢迎！请进。",
                                "pinyin": "Tiánzhōng, huānyíng! Huānyíng! Qǐng jìn.",
                                "english": "Tanaka, welcome! Welcome! Please come in.",
                            },
                            {
                                "speaker": "田中",
                                "traditional": "謝謝。",
                                "simplified": "谢谢。",
                                "pinyin": "Xièxie.",
                                "english": "Thank you.",
                            },
                        ],
                    }
                ]
            )
        )

        result = extract_dialogues_llm(DIALOGUE_CHUNK_BOOK1_L2, llm=mock_llm)
        assert len(result) == 1
        assert result[0]["dialogue_number"] == 2
        assert result[0]["title_english"] == "Dialogue II"
        assert len(result[0]["lines"]) == 2

    def test_extracts_two_dialogues_from_one_chunk(self):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(
            content=json.dumps(
                [
                    {
                        "title_traditional": "對話一",
                        "title_english": "Dialogue I",
                        "dialogue_number": 1,
                        "lines": [
                            {
                                "speaker": "安同",
                                "traditional": "聽說怡君的學校很漂亮。",
                                "simplified": "听说怡君的学校很漂亮。",
                                "pinyin": "Tīngshuō Yíjūn de xuéxiào hěn piàoliang.",
                                "english": "I heard Yijun's school is very beautiful.",
                            },
                        ],
                    },
                    {
                        "title_traditional": "對話二",
                        "title_english": "Dialogue II",
                        "dialogue_number": 2,
                        "lines": [
                            {
                                "speaker": "怡君",
                                "traditional": "歡迎你們來。",
                                "simplified": "欢迎你们来。",
                                "pinyin": "Huānyíng nǐmen lái.",
                                "english": "Welcome.",
                            },
                        ],
                    },
                ]
            )
        )

        result = extract_dialogues_llm(DIALOGUE_CHUNK_BOOK1_L6, llm=mock_llm)
        assert len(result) == 2
        assert result[0]["dialogue_number"] == 1
        assert result[1]["dialogue_number"] == 2

    def test_handles_markdown_code_blocks(self):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(
            content=(
                "```json\n"
                '[{"title_traditional": "對話一", "title_english": "Dialogue I", '
                '"dialogue_number": 1, "lines": [{"speaker": "明華", '
                '"traditional": "你好", "simplified": "你好", '
                '"pinyin": "Nǐ hǎo", "english": "Hello"}]}]\n'
                "```"
            )
        )

        result = extract_dialogues_llm(DIALOGUE_CHUNK_BOOK1_L2, llm=mock_llm)
        assert len(result) == 1
        assert result[0]["title_english"] == "Dialogue I"

    def test_filters_invalid_dialogues(self):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(
            content=json.dumps(
                [
                    {
                        "title_traditional": "對話一",
                        "title_english": "Dialogue I",
                        "dialogue_number": 1,
                        "lines": [
                            {
                                "speaker": "明華",
                                "traditional": "你好",
                                "simplified": "你好",
                                "pinyin": "Nǐ hǎo",
                                "english": "Hello",
                            },
                        ],
                    },
                    {
                        "title_traditional": "對話二",
                        "title_english": "Dialogue II",
                        "dialogue_number": 2,
                        "lines": [],
                    },
                ]
            )
        )

        result = extract_dialogues_llm(DIALOGUE_CHUNK_BOOK1_L6, llm=mock_llm)
        assert len(result) == 1
        assert result[0]["dialogue_number"] == 1

    def test_returns_empty_on_invalid_json(self):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(content="not valid json")

        result = extract_dialogues_llm(DIALOGUE_CHUNK_BOOK1_L2, llm=mock_llm)
        assert result == []

    def test_returns_empty_on_llm_exception(self):
        mock_llm = MagicMock()
        mock_llm.invoke.side_effect = RuntimeError("API error")

        result = extract_dialogues_llm(DIALOGUE_CHUNK_BOOK1_L2, llm=mock_llm)
        assert result == []

    def test_wraps_single_object_in_list(self):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(
            content=json.dumps(
                {
                    "title_traditional": "對話一",
                    "title_english": "Dialogue I",
                    "dialogue_number": 1,
                    "lines": [
                        {
                            "speaker": "明華",
                            "traditional": "你好",
                            "simplified": "你好",
                            "pinyin": "Nǐ hǎo",
                            "english": "Hello",
                        },
                    ],
                }
            )
        )

        result = extract_dialogues_llm(DIALOGUE_CHUNK_BOOK1_L2, llm=mock_llm)
        assert len(result) == 1

    def test_uses_detect_dialogue_number_fallback(self):
        """When LLM omits dialogue_number, detect_dialogue_number is used as fallback."""
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(
            content=json.dumps(
                [
                    {
                        "title_traditional": "對話二",
                        "title_english": "Dialogue II",
                        "lines": [
                            {
                                "speaker": "明華",
                                "traditional": "你好",
                                "simplified": "你好",
                                "pinyin": "Nǐ hǎo",
                                "english": "Hello",
                            },
                        ],
                    }
                ]
            )
        )

        # The chunk content contains "Dialogue II" marker
        result = extract_dialogues_llm(DIALOGUE_CHUNK_BOOK1_L2, llm=mock_llm)
        assert len(result) == 1
        # detect_dialogue_number should detect "寺 話 二 Dialogue II" → 2
        assert result[0]["dialogue_number"] == 2

    def test_handles_string_response_without_content_attr(self):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = json.dumps(
            [
                {
                    "title_traditional": "對話一",
                    "title_english": "Dialogue I",
                    "dialogue_number": 1,
                    "lines": [
                        {
                            "speaker": "明華",
                            "traditional": "你好",
                            "simplified": "你好",
                            "pinyin": "Nǐ hǎo",
                            "english": "Hello",
                        },
                    ],
                }
            ]
        )

        result = extract_dialogues_llm(DIALOGUE_CHUNK_BOOK1_L2, llm=mock_llm)
        assert len(result) == 1


# ── Test: load_chunks ──────────────────────────────────────────────────


class TestLoadChunks:
    """Tests for loading chunk files."""

    def test_load_chunks_from_file(self, tmp_path):
        chunks = [DIALOGUE_CHUNK_BOOK1_L2, VOCAB_CHUNK]
        chunk_file = tmp_path / "book1_chunks.json"
        chunk_file.write_text(json.dumps(chunks), encoding="utf-8")

        result = load_chunks(str(chunk_file))
        assert len(result) == 2

    def test_load_chunks_nonexistent_file(self):
        with pytest.raises(FileNotFoundError):
            load_chunks("/nonexistent/path/book1_chunks.json")

    def test_load_chunks_invalid_json(self, tmp_path):
        chunk_file = tmp_path / "bad.json"
        chunk_file.write_text("not valid json", encoding="utf-8")

        with pytest.raises(json.JSONDecodeError):
            load_chunks(str(chunk_file))


# ── Test: seed_dialogues ───────────────────────────────────────────────


class TestSeedDialogues:
    """Tests for the upsert/seeding logic."""

    @patch("src.scripts.seed_dialogues.get_supabase_client")
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
                "lesson_id": 2,
                "dialogue_number": 2,
                "title_traditional": "對話二",
                "title_english": "Dialogue II",
                "lines": [
                    {
                        "speaker": "明華",
                        "traditional": "田中，歡迎！",
                        "simplified": "田中，欢迎！",
                        "pinyin": "Tiánzhōng, huānyíng!",
                        "english": "Tanaka, welcome!",
                    },
                ],
            }
        ]

        seed_dialogues(rows)

        mock_client.table.assert_called_with("dialogues")
        mock_table.upsert.assert_called_once()
        call_args = mock_table.upsert.call_args
        assert call_args[0][0] == rows
        assert call_args[1]["on_conflict"] == "book_id,lesson_id,dialogue_number"

    @patch("src.scripts.seed_dialogues.get_supabase_client")
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
                "dialogue_number": 1,
                "title_traditional": f"對話{i}",
                "title_english": f"Dialogue {i}",
                "lines": [
                    {
                        "speaker": "明華",
                        "traditional": "你好",
                        "simplified": "你好",
                        "pinyin": "Nǐ hǎo",
                        "english": "Hello",
                    },
                ],
            }
            for i in range(1, 51)
        ]

        seed_dialogues(rows, batch_size=20)

        assert mock_table.upsert.call_count == 3

    @patch("src.scripts.seed_dialogues.get_supabase_client")
    def test_seed_empty_rows(self, mock_get_client):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        seed_dialogues([])

        mock_client.table.assert_not_called()

    @patch("src.scripts.seed_dialogues.get_supabase_client")
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
                "dialogue_number": 1,
                "title_traditional": "對話一",
                "title_english": "Dialogue I",
                "lines": [
                    {
                        "speaker": "明華",
                        "traditional": "你好",
                        "simplified": "你好",
                        "pinyin": "Nǐ hǎo",
                        "english": "Hello",
                    },
                ],
            }
        ]

        with pytest.raises(Exception, match="Connection refused"):
            seed_dialogues(rows)


# ── Test: deduplication ────────────────────────────────────────────────


class TestDeduplication:
    """Tests for dialogue deduplication in process_chunks."""

    @patch("src.scripts.seed_dialogues.extract_dialogues_llm")
    @patch("src.scripts.seed_dialogues.load_chunks")
    @patch("src.scripts.seed_dialogues.time")
    def test_deduplicates_same_dialogue_number(
        self, mock_time, mock_load, mock_extract
    ):
        """When two chunks produce same (book, lesson, dialogue_number), keep last."""
        from src.scripts.seed_dialogues import process_chunks

        mock_load.return_value = [
            {
                "content": "Dialogue I chunk 1",
                "metadata": {
                    "book": 1,
                    "lesson": 1,
                    "section": "dialogue",
                    "page_range": "1-5",
                    "content_quality": 0.9,
                },
            },
            {
                "content": "Dialogue I chunk 2",
                "metadata": {
                    "book": 1,
                    "lesson": 1,
                    "section": "dialogue",
                    "page_range": "6-10",
                    "content_quality": 0.95,
                },
            },
        ]

        # Both chunks produce Dialogue 1 for same lesson
        mock_extract.side_effect = [
            [
                {
                    "dialogue_number": 1,
                    "title_traditional": "對話一",
                    "title_english": "Dialogue I",
                    "lines": [
                        {
                            "speaker": "A",
                            "traditional": "早",
                            "simplified": "早",
                            "pinyin": "Zǎo",
                            "english": "Morning",
                        },
                    ],
                }
            ],
            [
                {
                    "dialogue_number": 1,
                    "title_traditional": "對話一",
                    "title_english": "Dialogue I",
                    "lines": [
                        {
                            "speaker": "A",
                            "traditional": "你好",
                            "simplified": "你好",
                            "pinyin": "Nǐ hǎo",
                            "english": "Hello",
                        },
                    ],
                }
            ],
        ]

        with patch("pathlib.Path.exists", return_value=True):
            result = process_chunks("/fake/dir", book_id=1)

        # Should deduplicate to 1 dialogue (the last one wins)
        assert len(result) == 1
        assert result[0]["lines"][0]["english"] == "Hello"
