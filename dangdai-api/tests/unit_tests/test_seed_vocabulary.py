"""Tests for vocabulary seeding script."""

from unittest.mock import MagicMock, patch

from src.scripts.seed_vocabulary import (
    _deduplicate_rows,
    parse_data_line,
    parse_flashcard_tsv,
    parse_header_line,
    seed_vocabulary,
)


class TestParseHeaderLine:
    """Tests for header line parsing."""

    def test_book1_lesson1_section_i(self):
        line = "//當代中文/Book 1/L01-I\t\t"
        result = parse_header_line(line)
        assert result is not None
        assert result == (1, 1, "I")

    def test_book2_lesson15_section_ii(self):
        line = "//當代中文/Book 2/L15-II\t\t"
        result = parse_header_line(line)
        assert result is not None
        assert result == (2, 15, "II")

    def test_book3_lesson7_section_ii(self):
        line = "//當代中文/Book 3/L07-II\t\t"
        result = parse_header_line(line)
        assert result is not None
        assert result == (3, 7, "II")

    def test_book4_lesson12_section_i(self):
        line = "//當代中文/Book 4/L12-I\t\t"
        result = parse_header_line(line)
        assert result is not None
        assert result == (4, 12, "I")

    def test_non_header_line_returns_none(self):
        line = "好\thǎo\t(Vs) fine, well"
        result = parse_header_line(line)
        assert result is None

    def test_empty_line_returns_none(self):
        result = parse_header_line("")
        assert result is None

    def test_header_without_tabs(self):
        line = "//當代中文/Book 1/L01-I"
        result = parse_header_line(line)
        assert result is not None
        assert result == (1, 1, "I")


class TestParseDataLine:
    """Tests for data line parsing."""

    def test_standard_pos_noun(self):
        line = "老師\tlǎoshī\t(N) teacher"
        result = parse_data_line(line)
        assert result is not None
        assert result["traditional"] == "老師"
        assert result["pinyin"] == "lǎoshī"
        assert result["part_of_speech"] == "N"
        assert result["english"] == "teacher"
        assert result["is_name"] is False

    def test_standard_pos_verb(self):
        line = "來\tlái\t(V) to come"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] == "V"
        assert result["english"] == "to come"

    def test_stative_verb(self):
        line = "漂亮\tpiàoliàng\t(Vs) pretty"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] == "Vs"
        assert result["english"] == "pretty"

    def test_multi_pos_nv(self):
        line = "組合\tzǔhé\t(N/V) combination; to combine"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] == "N/V"
        assert result["english"] == "combination; to combine"

    def test_multi_pos_vn(self):
        line = "稱呼\tchēnghū\t(V/N) to call; address, name"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] == "V/N"
        assert result["english"] == "to call; address, name"

    def test_v_sep(self):
        line = "照相\tzhàoxiàng\t(V-sep) to take a photo"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] == "V-sep"
        assert result["english"] == "to take a photo"

    def test_vs_pred(self):
        line = "多\tduō\t(Vs-pred) many"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] == "Vs-pred"
        assert result["english"] == "many"

    def test_vp_sep(self):
        line = "迷路\tmílù\t(Vp-sep) to be lost, to have lost directions"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] == "Vp-sep"
        assert result["english"] == "to be lost, to have lost directions"

    def test_proper_name_person(self):
        line = "陳月美\tChén Yuèměi\ta woman from Vietnam"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] is None
        assert result["is_name"] is True
        assert result["english"] == "a woman from Vietnam"

    def test_proper_name_place_taiwan(self):
        line = "臺灣/台灣\tTáiwān\tTaiwan"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] is None
        assert result["is_name"] is True
        assert result["traditional"] == "臺灣/台灣"

    def test_proper_name_place_japan(self):
        line = "日本\tRìběn\tJapan"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] is None
        assert result["is_name"] is True

    def test_proper_name_place_america(self):
        line = "美國\tMěiguó\tAmerica"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] is None
        assert result["is_name"] is True

    def test_phrase_not_name_please_ask(self):
        line = "請問\tqǐngwèn\tMay I ask you... Excuse me,…"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] is None
        assert result["is_name"] is False

    def test_phrase_not_name_sorry(self):
        line = "對不起\tduìbùqǐ\tI'm sorry'"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] is None
        assert result["is_name"] is False

    def test_phrase_not_name_youre_welcome(self):
        line = "不客氣\tbúkèqì\tYou're welcome'"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] is None
        assert result["is_name"] is False

    def test_phrase_not_name_welcome(self):
        line = "歡迎\thuānyíng\twelcome"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] is None
        assert result["is_name"] is False

    def test_phrase_not_name_hello(self):
        line = "你好\tnǐ hǎo\tHow are you? Hello"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] is None
        assert result["is_name"] is False

    def test_alternate_pinyin(self):
        line = "這\tzhè / zhèi\t(Det) this1"
        result = parse_data_line(line)
        assert result is not None
        assert result["pinyin"] == "zhè / zhèi"
        assert result["part_of_speech"] == "Det"

    def test_apostrophe_in_english(self):
        line = "不用了\tbúyòng le\tIt's not necessary'"
        result = parse_data_line(line)
        assert result is not None
        assert result["english"] == "It's not necessary'"
        assert result["is_name"] is False

    def test_phrase_id_pos(self):
        line = "不容忽視\tbùróng hūshì\t(Id) cannot ignore, should not be ignored"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] == "Id"
        assert result["english"] == "cannot ignore, should not be ignored"

    def test_phrase_ph_pos(self):
        line = '第三者\tdìsānzhě\t(Ph) "third party" (i.e., the "other man/woman")'
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] == "Ph"

    def test_oolong_tea_no_pos(self):
        line = "烏龍茶\tWūlóng chá\tOolong tea"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] is None
        # Pinyin starts with capital W -> is_name True
        assert result["is_name"] is True

    def test_empty_line_returns_none(self):
        result = parse_data_line("")
        assert result is None

    def test_header_line_returns_none(self):
        line = "//當代中文/Book 1/L01-I\t\t"
        result = parse_data_line(line)
        assert result is None

    def test_re_pos(self):
        line = "得\tde\t(RE) resultative ending"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] == "RE"
        assert result["english"] == "resultative ending"

    def test_conj_pos(self):
        line = "與其\tyǔqí\t(Conj) rather than"
        result = parse_data_line(line)
        assert result is not None
        assert result["part_of_speech"] == "Conj"
        assert result["english"] == "rather than"


class TestSortOrderReset:
    """Tests for sort_order assignment and reset on new section."""

    def test_sort_order_sequential_within_section(self):
        tsv_content = (
            "//當代中文/Book 1/L01-I\t\t\n"
            "好\thǎo\t(Vs) fine, well\n"
            "來\tlái\t(V) to come\n"
            "是\tshì\t(Vst) to be\n"
        )
        import tempfile
        import os

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".tsv", delete=False, encoding="utf-8"
        ) as f:
            f.write(tsv_content)
            f.flush()
            result = parse_flashcard_tsv(f.name)
        os.unlink(f.name)

        assert len(result) == 3
        assert result[0]["sort_order"] == 1
        assert result[1]["sort_order"] == 2
        assert result[2]["sort_order"] == 3

    def test_sort_order_resets_on_new_section(self):
        tsv_content = (
            "//當代中文/Book 1/L01-I\t\t\n"
            "好\thǎo\t(Vs) fine, well\n"
            "來\tlái\t(V) to come\n"
            "//當代中文/Book 1/L01-II\t\t\n"
            "請\tqǐng\t(V) please\n"
            "喝\thē\t(V) to drink\n"
        )
        import tempfile
        import os

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".tsv", delete=False, encoding="utf-8"
        ) as f:
            f.write(tsv_content)
            f.flush()
            result = parse_flashcard_tsv(f.name)
        os.unlink(f.name)

        assert len(result) == 4
        # Section I
        assert result[0]["sort_order"] == 1
        assert result[1]["sort_order"] == 2
        # Section II resets
        assert result[2]["sort_order"] == 1
        assert result[3]["sort_order"] == 2

    def test_sort_order_resets_on_new_lesson(self):
        tsv_content = (
            "//當代中文/Book 1/L01-I\t\t\n"
            "好\thǎo\t(Vs) fine, well\n"
            "//當代中文/Book 1/L02-I\t\t\n"
            "請\tqǐng\t(V) please\n"
        )
        import tempfile
        import os

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".tsv", delete=False, encoding="utf-8"
        ) as f:
            f.write(tsv_content)
            f.flush()
            result = parse_flashcard_tsv(f.name)
        os.unlink(f.name)

        assert len(result) == 2
        assert result[0]["sort_order"] == 1
        assert result[0]["lesson_id"] == 1
        assert result[1]["sort_order"] == 1
        assert result[1]["lesson_id"] == 2


class TestFullParseTSVExcerpt:
    """Test full parse of a representative TSV excerpt."""

    def test_full_parse_representative_excerpt(self):
        tsv_content = (
            "//當代中文/Book 1/L01-I\t\t\n"
            "陳月美\tChén Yuèměi\ta woman from Vietnam\n"
            "李明華\tLǐ Mínghuá\ta man from Taiwan\n"
            "你\tnǐ\t(N) you\n"
            "來\tlái\t(V) to come\n"
            "是\tshì\t(Vst) to be\n"
            "好\thǎo\t(Vs) fine, well\n"
            "臺灣/台灣\tTáiwān\tTaiwan\n"
            "歡迎\thuānyíng\twelcome\n"
            "請問\tqǐngwèn\tMay I ask you... Excuse me,…\n"
            "//當代中文/Book 1/L01-II\t\t\n"
            "請\tqǐng\t(V) please\n"
            "喝\thē\t(V) to drink\n"
            "茶\tchá\t(N) tea\n"
            "日本\tRìběn\tJapan\n"
            "美國\tMěiguó\tAmerica\n"
            "對不起\tduìbùqǐ\tI'm sorry'\n"
        )
        import tempfile
        import os

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".tsv", delete=False, encoding="utf-8"
        ) as f:
            f.write(tsv_content)
            f.flush()
            result = parse_flashcard_tsv(f.name)
        os.unlink(f.name)

        assert len(result) == 15

        # Section I items
        assert result[0]["book_id"] == 1
        assert result[0]["lesson_id"] == 1
        assert result[0]["vocab_section"] == "I"
        assert result[0]["traditional"] == "陳月美"
        assert result[0]["is_name"] is True
        assert result[0]["sort_order"] == 1

        # Regular word with POS
        assert result[2]["traditional"] == "你"
        assert result[2]["part_of_speech"] == "N"
        assert result[2]["sort_order"] == 3

        # Variant characters
        assert result[6]["traditional"] == "臺灣/台灣"
        assert result[6]["is_name"] is True
        assert result[6]["sort_order"] == 7

        # Phrase (not a name)
        assert result[7]["traditional"] == "歡迎"
        assert result[7]["is_name"] is False

        # Section II items
        assert result[9]["vocab_section"] == "II"
        assert result[9]["sort_order"] == 1
        assert result[9]["part_of_speech"] == "V"

        # Place name in section II
        assert result[12]["traditional"] == "日本"
        assert result[12]["is_name"] is True

        # Phrase in section II
        assert result[14]["traditional"] == "對不起"
        assert result[14]["is_name"] is False

    def test_parse_across_books(self):
        tsv_content = (
            "//當代中文/Book 1/L15-II\t\t\n"
            "好\thǎo\t(Vs) fine, well\n"
            "//當代中文/Book 2/L01-I\t\t\n"
            "走\tzǒu\t(Vi) to get to\n"
        )
        import tempfile
        import os

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".tsv", delete=False, encoding="utf-8"
        ) as f:
            f.write(tsv_content)
            f.flush()
            result = parse_flashcard_tsv(f.name)
        os.unlink(f.name)

        assert len(result) == 2
        assert result[0]["book_id"] == 1
        assert result[0]["lesson_id"] == 15
        assert result[0]["vocab_section"] == "II"
        assert result[1]["book_id"] == 2
        assert result[1]["lesson_id"] == 1
        assert result[1]["vocab_section"] == "I"
        assert result[1]["sort_order"] == 1


class TestDeduplicateRows:
    """Tests for deduplication of rows by unique constraint."""

    def test_no_duplicates_returns_same(self):
        rows = [
            {
                "book_id": 1,
                "lesson_id": 1,
                "vocab_section": "I",
                "traditional": "好",
                "pinyin": "hǎo",
                "english": "fine",
                "part_of_speech": "Vs",
                "is_name": False,
                "sort_order": 1,
            },
            {
                "book_id": 1,
                "lesson_id": 1,
                "vocab_section": "I",
                "traditional": "來",
                "pinyin": "lái",
                "english": "to come",
                "part_of_speech": "V",
                "is_name": False,
                "sort_order": 2,
            },
        ]
        result = _deduplicate_rows(rows)
        assert len(result) == 2

    def test_duplicate_keeps_last_occurrence(self):
        rows = [
            {
                "book_id": 1,
                "lesson_id": 12,
                "vocab_section": "II",
                "traditional": "工作",
                "pinyin": "gōngzuò",
                "english": "to work",
                "part_of_speech": "V",
                "is_name": False,
                "sort_order": 1,
            },
            {
                "book_id": 1,
                "lesson_id": 12,
                "vocab_section": "II",
                "traditional": "其他",
                "pinyin": "qítā",
                "english": "other",
                "part_of_speech": "Det",
                "is_name": False,
                "sort_order": 2,
            },
            {
                "book_id": 1,
                "lesson_id": 12,
                "vocab_section": "II",
                "traditional": "工作",
                "pinyin": "gōngzuò",
                "english": "job, work",
                "part_of_speech": "N",
                "is_name": False,
                "sort_order": 8,
            },
        ]
        result = _deduplicate_rows(rows)
        assert len(result) == 2
        # The duplicate should be replaced with the later occurrence
        gongzuo = [r for r in result if r["traditional"] == "工作"][0]
        assert gongzuo["english"] == "job, work"
        assert gongzuo["part_of_speech"] == "N"

    def test_different_sections_not_duplicates(self):
        rows = [
            {
                "book_id": 1,
                "lesson_id": 1,
                "vocab_section": "I",
                "traditional": "好",
                "pinyin": "hǎo",
                "english": "fine",
                "part_of_speech": "Vs",
                "is_name": False,
                "sort_order": 1,
            },
            {
                "book_id": 1,
                "lesson_id": 1,
                "vocab_section": "II",
                "traditional": "好",
                "pinyin": "hǎo",
                "english": "OK",
                "part_of_speech": "Ptc",
                "is_name": False,
                "sort_order": 1,
            },
        ]
        result = _deduplicate_rows(rows)
        assert len(result) == 2


class TestSeedVocabulary:
    """Tests for the upsert/seeding logic."""

    @patch("src.scripts.seed_vocabulary.get_supabase_client")
    def test_seed_vocabulary_calls_upsert(self, mock_get_client):
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
                "vocab_section": "I",
                "traditional": "好",
                "pinyin": "hǎo",
                "english": "fine, well",
                "part_of_speech": "Vs",
                "is_name": False,
                "sort_order": 1,
            }
        ]

        seed_vocabulary(rows)

        mock_client.table.assert_called_with("vocabulary")
        mock_table.upsert.assert_called_once()
        call_args = mock_table.upsert.call_args
        assert call_args[0][0] == rows
        assert (
            call_args[1]["on_conflict"] == "book_id,lesson_id,vocab_section,traditional"
        )

    @patch("src.scripts.seed_vocabulary.get_supabase_client")
    def test_seed_vocabulary_batches_large_datasets(self, mock_get_client):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_table = MagicMock()
        mock_client.table.return_value = mock_table
        mock_upsert = MagicMock()
        mock_table.upsert.return_value = mock_upsert
        mock_upsert.execute.return_value = MagicMock()

        # Create 1200 rows to test batching (should be 3 batches of 500, 500, 200)
        rows = [
            {
                "book_id": 1,
                "lesson_id": 1,
                "vocab_section": "I",
                "traditional": f"字{i}",
                "pinyin": f"zi{i}",
                "english": f"word {i}",
                "part_of_speech": "N",
                "is_name": False,
                "sort_order": i,
            }
            for i in range(1, 1201)
        ]

        seed_vocabulary(rows)

        assert mock_table.upsert.call_count == 3

    @patch("src.scripts.seed_vocabulary.get_supabase_client")
    def test_seed_vocabulary_empty_rows(self, mock_get_client):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        seed_vocabulary([])

        mock_client.table.assert_not_called()

    @patch("src.scripts.seed_vocabulary.get_supabase_client")
    def test_seed_vocabulary_deduplicates_before_upsert(self, mock_get_client):
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
                "lesson_id": 12,
                "vocab_section": "II",
                "traditional": "工作",
                "pinyin": "gōngzuò",
                "english": "to work",
                "part_of_speech": "V",
                "is_name": False,
                "sort_order": 1,
            },
            {
                "book_id": 1,
                "lesson_id": 12,
                "vocab_section": "II",
                "traditional": "工作",
                "pinyin": "gōngzuò",
                "english": "job, work",
                "part_of_speech": "N",
                "is_name": False,
                "sort_order": 8,
            },
        ]

        seed_vocabulary(rows)

        # Should only upsert 1 row (deduplicated)
        call_args = mock_table.upsert.call_args
        assert len(call_args[0][0]) == 1
        assert call_args[0][0][0]["english"] == "job, work"
