"""Tests for structured content repository with mocked Supabase responses."""

from unittest.mock import MagicMock, patch

from src.repositories.content_repo import ContentRepository


class TestContentRepositoryGetVocabulary:
    """Tests for ContentRepository.get_vocabulary()."""

    @patch("src.repositories.content_repo.get_supabase_client")
    def test_returns_vocabulary_items_for_chapter(self, mock_client_fn):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = [
            {
                "traditional": "學",
                "pinyin": "xué",
                "english": "to study",
                "part_of_speech": "V",
                "vocab_section": "vocabulary",
                "is_name": False,
            },
            {
                "traditional": "生",
                "pinyin": "shēng",
                "english": "to be born",
                "part_of_speech": "V",
                "vocab_section": "vocabulary",
                "is_name": False,
            },
        ]
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = mock_response
        mock_client_fn.return_value = mock_client

        repo = ContentRepository()
        result = repo.get_vocabulary(book_id=1, lesson_id=1)

        assert len(result) == 2
        assert result[0]["traditional"] == "學"
        assert result[1]["pinyin"] == "shēng"
        mock_client.table.assert_called_with("vocabulary")

    @patch("src.repositories.content_repo.get_supabase_client")
    def test_returns_empty_list_when_no_data(self, mock_client_fn):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = []
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = mock_response
        mock_client_fn.return_value = mock_client

        repo = ContentRepository()
        result = repo.get_vocabulary(book_id=1, lesson_id=99)

        assert result == []

    @patch("src.repositories.content_repo.get_supabase_client")
    def test_returns_empty_list_when_data_is_none(self, mock_client_fn):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = None
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = mock_response
        mock_client_fn.return_value = mock_client

        repo = ContentRepository()
        result = repo.get_vocabulary(book_id=1, lesson_id=1)

        assert result == []


class TestContentRepositoryGetGrammarPoints:
    """Tests for ContentRepository.get_grammar_points()."""

    @patch("src.repositories.content_repo.get_supabase_client")
    def test_returns_grammar_points_for_chapter(self, mock_client_fn):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = [
            {
                "title_english": "Using 是",
                "title_chinese": "是的用法",
                "function_description": "Equative verb linking subject and predicate",
                "structure_pattern": "Subject + 是 + Noun",
                "usage_notes": "Basic identification pattern",
                "examples": [{"chinese": "我是學生", "english": "I am a student"}],
            },
        ]
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = mock_response
        mock_client_fn.return_value = mock_client

        repo = ContentRepository()
        result = repo.get_grammar_points(book_id=1, lesson_id=1)

        assert len(result) == 1
        assert result[0]["title_english"] == "Using 是"
        mock_client.table.assert_called_with("grammar_points")

    @patch("src.repositories.content_repo.get_supabase_client")
    def test_returns_empty_list_when_no_grammar_points(self, mock_client_fn):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = []
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = mock_response
        mock_client_fn.return_value = mock_client

        repo = ContentRepository()
        result = repo.get_grammar_points(book_id=1, lesson_id=99)

        assert result == []


class TestContentRepositoryGetDialogues:
    """Tests for ContentRepository.get_dialogues()."""

    @patch("src.repositories.content_repo.get_supabase_client")
    def test_returns_dialogues_for_chapter(self, mock_client_fn):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = [
            {
                "dialogue_number": 1,
                "title_traditional": "在學校",
                "title_english": "At School",
                "lines": [
                    {"speaker": "A", "traditional": "你好！", "english": "Hello!"},
                ],
            },
        ]
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = mock_response
        mock_client_fn.return_value = mock_client

        repo = ContentRepository()
        result = repo.get_dialogues(book_id=1, lesson_id=1)

        assert len(result) == 1
        assert result[0]["title_english"] == "At School"
        mock_client.table.assert_called_with("dialogues")

    @patch("src.repositories.content_repo.get_supabase_client")
    def test_returns_empty_list_when_no_dialogues(self, mock_client_fn):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = []
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = mock_response
        mock_client_fn.return_value = mock_client

        repo = ContentRepository()
        result = repo.get_dialogues(book_id=1, lesson_id=99)

        assert result == []


class TestContentRepositoryGetVocabularyForCumulative:
    """Tests for ContentRepository.get_vocabulary_for_cumulative()."""

    @patch("src.repositories.content_repo.get_supabase_client")
    def test_returns_vocabulary_up_to_lesson(self, mock_client_fn):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = [
            {"traditional": "我", "pinyin": "wǒ", "english": "I"},
            {"traditional": "你", "pinyin": "nǐ", "english": "you"},
        ]
        mock_client.table.return_value.select.return_value.eq.return_value.lte.return_value.order.return_value.execute.return_value = mock_response
        mock_client_fn.return_value = mock_client

        repo = ContentRepository()
        result = repo.get_vocabulary_for_cumulative(book_id=1, up_to_lesson_id=5)

        assert len(result) == 2
        mock_client.table.assert_called_with("vocabulary")

    @patch("src.repositories.content_repo.get_supabase_client")
    def test_returns_empty_list_when_no_cumulative_vocab(self, mock_client_fn):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = None
        mock_client.table.return_value.select.return_value.eq.return_value.lte.return_value.order.return_value.execute.return_value = mock_response
        mock_client_fn.return_value = mock_client

        repo = ContentRepository()
        result = repo.get_vocabulary_for_cumulative(book_id=1, up_to_lesson_id=1)

        assert result == []


class TestContentRepositoryErrorHandling:
    """Tests for ContentRepository error handling with retry."""

    @patch("src.repositories.content_repo.get_supabase_client")
    def test_get_vocabulary_handles_exception_gracefully(self, mock_client_fn):
        mock_client = MagicMock()
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.side_effect = Exception(
            "Connection error"
        )
        mock_client_fn.return_value = mock_client

        repo = ContentRepository()
        result = repo.get_vocabulary(book_id=1, lesson_id=1)

        assert result == []
        # Verify retry: execute called twice (initial + 1 retry)
        assert (
            mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.call_count
            == 2
        )

    @patch("src.repositories.content_repo.get_supabase_client")
    def test_get_vocabulary_succeeds_on_retry(self, mock_client_fn):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.data = [{"traditional": "學", "pinyin": "xué"}]
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.side_effect = [
            Exception("Transient error"),
            mock_response,
        ]
        mock_client_fn.return_value = mock_client

        repo = ContentRepository()
        result = repo.get_vocabulary(book_id=1, lesson_id=1)

        assert len(result) == 1
        assert result[0]["traditional"] == "學"

    @patch("src.repositories.content_repo.get_supabase_client")
    def test_get_grammar_points_handles_exception_gracefully(self, mock_client_fn):
        mock_client = MagicMock()
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.side_effect = Exception(
            "Connection error"
        )
        mock_client_fn.return_value = mock_client

        repo = ContentRepository()
        result = repo.get_grammar_points(book_id=1, lesson_id=1)

        assert result == []
        assert (
            mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.call_count
            == 2
        )

    @patch("src.repositories.content_repo.get_supabase_client")
    def test_get_dialogues_handles_exception_gracefully(self, mock_client_fn):
        mock_client = MagicMock()
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.side_effect = Exception(
            "Connection error"
        )
        mock_client_fn.return_value = mock_client

        repo = ContentRepository()
        result = repo.get_dialogues(book_id=1, lesson_id=1)

        assert result == []
        assert (
            mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.call_count
            == 2
        )
