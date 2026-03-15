"""API endpoint tests."""

import asyncio
import time
from unittest.mock import AsyncMock, MagicMock, patch

import jwt
import pytest
from fastapi.testclient import TestClient

from src.api.main import app
from src.api.schemas import QuizGenerateResponse, ValidationResponse

# Shared test JWT secret
TEST_JWT_SECRET = "test-secret-key-for-unit-tests"
TEST_USER_ID = "test-user-uuid-1234"


def _make_jwt(user_id=TEST_USER_ID, secret=TEST_JWT_SECRET, expired=False):
    """Create a test Supabase-style JWT."""
    payload = {
        "sub": user_id,
        "aud": "authenticated",
        "role": "authenticated",
        "iat": int(time.time()),
        "exp": int(time.time()) + (-3600 if expired else 3600),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


class TestHealthEndpoint:
    """Tests for the health check endpoint."""

    def test_health_returns_200(self, client):
        """Test that health endpoint returns 200 OK."""
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_returns_healthy_status(self, client):
        """Test that health endpoint returns healthy status."""
        response = client.get("/health")
        assert response.json() == {"status": "healthy"}


class TestQuizGenerateEndpoint:
    """Tests for the POST /api/quizzes/generate endpoint."""

    def _auth_header(self, token=None):
        if token is None:
            token = _make_jwt()
        return {"Authorization": f"Bearer {token}"}

    @patch("src.api.dependencies.settings")
    @patch("src.api.routes.quizzes._quiz_service")
    def test_generate_quiz_success(self, mock_service, mock_settings, client):
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
        mock_service.generate_quiz = AsyncMock(
            return_value=QuizGenerateResponse(
                quiz_id="test-quiz-id",
                chapter_id=101,
                book_id=1,
                exercise_type="vocabulary",
                question_count=1,
                questions=[
                    {
                        "question_id": "q1",
                        "exercise_type": "vocabulary",
                        "question_text": "What does 學 mean?",
                        "correct_answer": "to study",
                        "explanation": "test",
                        "source_citation": "Book 1, Ch 1",
                        "character": "學",
                        "pinyin": "xue2",
                        "meaning": "to study",
                        "question_subtype": "char_to_meaning",
                        "options": ["to study", "to eat", "to go", "to read"],
                    }
                ],
            )
        )

        response = client.post(
            "/api/quizzes/generate",
            json={"chapter_id": 101, "book_id": 1, "exercise_type": "vocabulary"},
            headers=self._auth_header(),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["quiz_id"] == "test-quiz-id"
        assert data["question_count"] == 1

    def test_generate_quiz_no_auth_returns_401_or_403(self, client):
        response = client.post(
            "/api/quizzes/generate",
            json={"chapter_id": 101, "book_id": 1, "exercise_type": "vocabulary"},
        )
        # FastAPI's HTTPBearer returns 401 or 403 when no credentials provided
        assert response.status_code in (401, 403)

    @patch("src.api.dependencies.settings")
    def test_generate_quiz_invalid_jwt_returns_401(self, mock_settings, client):
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
        response = client.post(
            "/api/quizzes/generate",
            json={"chapter_id": 101, "book_id": 1, "exercise_type": "vocabulary"},
            headers={"Authorization": "Bearer invalid-token-here"},
        )
        assert response.status_code == 401

    @patch("src.api.dependencies.settings")
    def test_generate_quiz_expired_jwt_returns_401(self, mock_settings, client):
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
        expired_token = _make_jwt(expired=True)
        response = client.post(
            "/api/quizzes/generate",
            json={"chapter_id": 101, "book_id": 1, "exercise_type": "vocabulary"},
            headers=self._auth_header(expired_token),
        )
        assert response.status_code == 401

    @patch("src.api.dependencies.settings")
    def test_generate_quiz_invalid_book_id(self, mock_settings, client):
        """book_id > 6 should fail Pydantic validation."""
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
        response = client.post(
            "/api/quizzes/generate",
            json={"chapter_id": 101, "book_id": 7, "exercise_type": "vocabulary"},
            headers=self._auth_header(),
        )
        assert response.status_code == 422  # Pydantic validation error

    @patch("src.api.dependencies.settings")
    @patch("src.api.routes.quizzes._quiz_service")
    def test_generate_quiz_invalid_chapter_id_returns_400(
        self, mock_service, mock_settings, client
    ):
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
        response = client.post(
            "/api/quizzes/generate",
            json={"chapter_id": 5, "book_id": 1, "exercise_type": "vocabulary"},
            headers=self._auth_header(),
        )
        assert response.status_code == 400
        assert "chapter_id" in response.json()["detail"]

    @patch("src.api.dependencies.settings")
    @patch("src.api.routes.quizzes._quiz_service")
    def test_generate_quiz_timeout_returns_504(
        self, mock_service, mock_settings, client
    ):
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
        mock_service.generate_quiz = AsyncMock(
            side_effect=TimeoutError("Generation exceeded 8s time limit")
        )

        response = client.post(
            "/api/quizzes/generate",
            json={"chapter_id": 101, "book_id": 1, "exercise_type": "vocabulary"},
            headers=self._auth_header(),
        )

        assert response.status_code == 504

    @patch("src.api.dependencies.settings")
    @patch("src.api.routes.quizzes._quiz_service")
    def test_generate_quiz_no_content_returns_404(
        self, mock_service, mock_settings, client
    ):
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
        mock_service.generate_quiz = AsyncMock(
            side_effect=ValueError("Quiz generation failed: No questions generated")
        )

        response = client.post(
            "/api/quizzes/generate",
            json={"chapter_id": 101, "book_id": 1, "exercise_type": "vocabulary"},
            headers=self._auth_header(),
        )

        assert response.status_code == 404


class TestValidateAnswerEndpoint:
    """Tests for POST /api/quizzes/validate-answer endpoint."""

    def _auth_header(self, token=None):
        if token is None:
            token = _make_jwt()
        return {"Authorization": f"Bearer {token}"}

    def _valid_payload(self, **overrides):
        defaults = {
            "question": "Arrange these words: 我 中文 學 在 大學",
            "user_answer": "我在大學學中文",
            "correct_answer": "我在大學學中文",
            "exercise_type": "sentence_construction",
        }
        defaults.update(overrides)
        return defaults

    @patch("src.api.dependencies.settings")
    @patch("src.api.routes.quizzes._validation_service")
    def test_validate_answer_success_returns_200(
        self, mock_service, mock_settings, client
    ):
        """Valid sentence_construction request → 200 with correct response shape."""
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
        mock_service.validate_answer = AsyncMock(
            return_value=ValidationResponse(
                is_correct=True,
                explanation="Your sentence is correct.",
                alternatives=["在大學我學中文"],
            )
        )

        response = client.post(
            "/api/quizzes/validate-answer",
            json=self._valid_payload(),
            headers=self._auth_header(),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_correct"] is True
        assert "explanation" in data
        assert "alternatives" in data

    @patch("src.api.dependencies.settings")
    @patch("src.api.routes.quizzes._validation_service")
    def test_validate_answer_dialogue_completion_returns_200(
        self, mock_service, mock_settings, client
    ):
        """Valid dialogue_completion request → 200."""
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
        mock_service.validate_answer = AsyncMock(
            return_value=ValidationResponse(
                is_correct=False,
                explanation="A more natural response would be...",
                alternatives=["你好！"],
            )
        )

        response = client.post(
            "/api/quizzes/validate-answer",
            json=self._valid_payload(
                exercise_type="dialogue_completion",
                question="A: 你好！B: ___",
                user_answer="再見",
                correct_answer="你好！",
            ),
            headers=self._auth_header(),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_correct"] is False

    def test_validate_answer_no_auth_returns_401_or_403(self, client):
        """Missing JWT → 401 or 403."""
        response = client.post(
            "/api/quizzes/validate-answer",
            json=self._valid_payload(),
        )
        assert response.status_code in (401, 403)

    @patch("src.api.dependencies.settings")
    def test_validate_answer_invalid_jwt_returns_401(self, mock_settings, client):
        """Invalid JWT token → 401."""
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
        response = client.post(
            "/api/quizzes/validate-answer",
            json=self._valid_payload(),
            headers={"Authorization": "Bearer invalid-token-here"},
        )
        assert response.status_code == 401

    @patch("src.api.dependencies.settings")
    def test_validate_answer_expired_jwt_returns_401(self, mock_settings, client):
        """Expired JWT → 401."""
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
        expired_token = _make_jwt(expired=True)
        response = client.post(
            "/api/quizzes/validate-answer",
            json=self._valid_payload(),
            headers=self._auth_header(expired_token),
        )
        assert response.status_code == 401

    @patch("src.api.dependencies.settings")
    def test_validate_answer_invalid_exercise_type_returns_422(
        self, mock_settings, client
    ):
        """exercise_type=vocabulary (not sentence_construction/dialogue_completion) → 422."""
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
        response = client.post(
            "/api/quizzes/validate-answer",
            json=self._valid_payload(exercise_type="vocabulary"),
            headers=self._auth_header(),
        )
        assert response.status_code == 422

    @patch("src.api.dependencies.settings")
    def test_validate_answer_grammar_exercise_type_returns_422(
        self, mock_settings, client
    ):
        """exercise_type=grammar → 422."""
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
        response = client.post(
            "/api/quizzes/validate-answer",
            json=self._valid_payload(exercise_type="grammar"),
            headers=self._auth_header(),
        )
        assert response.status_code == 422

    @patch("src.api.dependencies.settings")
    def test_validate_answer_empty_user_answer_returns_422(self, mock_settings, client):
        """Empty user_answer → Pydantic validation error → 422."""
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
        response = client.post(
            "/api/quizzes/validate-answer",
            json=self._valid_payload(user_answer=""),
            headers=self._auth_header(),
        )
        assert response.status_code == 422

    @patch("src.api.dependencies.settings")
    @patch("src.api.routes.quizzes._validation_service")
    def test_validate_answer_timeout_returns_504(
        self, mock_service, mock_settings, client
    ):
        """LLM timeout → 504 Gateway Timeout."""
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
        mock_service.validate_answer = AsyncMock(
            side_effect=TimeoutError("Answer validation exceeded 3s time limit")
        )

        response = client.post(
            "/api/quizzes/validate-answer",
            json=self._valid_payload(),
            headers=self._auth_header(),
        )

        assert response.status_code == 504
        assert "timed out" in response.json()["detail"].lower()

    @patch("src.api.dependencies.settings")
    @patch("src.api.routes.quizzes._validation_service")
    def test_validate_answer_llm_error_returns_500(
        self, mock_service, mock_settings, client
    ):
        """LLM invocation failure → 500."""
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
        mock_service.validate_answer = AsyncMock(
            side_effect=RuntimeError("LLM connection failed")
        )

        response = client.post(
            "/api/quizzes/validate-answer",
            json=self._valid_payload(),
            headers=self._auth_header(),
        )

        assert response.status_code == 500

    @patch("src.api.dependencies.settings")
    def test_validate_answer_missing_question_field_returns_422(
        self, mock_settings, client
    ):
        """Missing required question field → 422."""
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
        payload = {
            "user_answer": "我學中文",
            "correct_answer": "我學中文",
            "exercise_type": "sentence_construction",
            # question field missing
        }
        response = client.post(
            "/api/quizzes/validate-answer",
            json=payload,
            headers=self._auth_header(),
        )
        assert response.status_code == 422

    @patch("src.api.dependencies.settings")
    @patch("src.api.routes.quizzes._validation_service")
    def test_validate_answer_response_no_envelope(
        self, mock_service, mock_settings, client
    ):
        """Response must be flat (no envelope wrapper)."""
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
        mock_service.validate_answer = AsyncMock(
            return_value=ValidationResponse(
                is_correct=False,
                explanation="Incorrect word order.",
                alternatives=["我在大學學中文"],
            )
        )

        response = client.post(
            "/api/quizzes/validate-answer",
            json=self._valid_payload(user_answer="中文我學在大學"),
            headers=self._auth_header(),
        )

        assert response.status_code == 200
        data = response.json()
        # Flat structure — no wrapper keys like "data", "result", etc.
        assert set(data.keys()) == {"is_correct", "explanation", "alternatives"}
        assert data["is_correct"] is False


class TestRequestCancellation:
    """Tests for client disconnection detection and request cancellation.

    Verifies that endpoints detect client disconnects and raise
    asyncio.CancelledError before making expensive LLM/database calls.
    """

    def _auth_header(self, token=None):
        if token is None:
            token = _make_jwt()
        return {"Authorization": f"Bearer {token}"}

    @pytest.mark.asyncio
    @patch("src.api.dependencies.settings")
    async def test_quiz_generation_cancels_when_client_disconnects(self, mock_settings):
        """Quiz generation raises CancelledError when client disconnects before LLM.

        Verifies that QuizService.generate_quiz() checks is_disconnected()
        before invoking LangGraph and raises asyncio.CancelledError immediately.
        """
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET

        # Create a mock HTTP request that reports as disconnected
        mock_http_request = MagicMock()
        mock_http_request.is_disconnected = AsyncMock(return_value=True)

        from src.api.schemas import ExerciseType, QuizGenerateRequest
        from src.services.quiz_service import QuizService

        service = QuizService()
        request_body = QuizGenerateRequest(
            chapter_id=105, book_id=1, exercise_type=ExerciseType.VOCABULARY
        )

        with pytest.raises(asyncio.CancelledError):
            await service.generate_quiz(request_body, TEST_USER_ID, mock_http_request)

        # Verify is_disconnected was called
        mock_http_request.is_disconnected.assert_called_once()

    @pytest.mark.asyncio
    @patch("src.api.dependencies.settings")
    @patch("src.services.quiz_service.graph")
    async def test_quiz_generation_completes_normally_when_connected(
        self, mock_graph, mock_settings
    ):
        """Quiz generation completes normally when client stays connected.

        Verifies that a connected client (is_disconnected=False) proceeds
        through the full LangGraph invocation without cancellation.
        """
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET

        # Create a mock HTTP request that reports as connected
        mock_http_request = MagicMock()
        mock_http_request.is_disconnected = AsyncMock(return_value=False)

        # Mock the graph to return a valid quiz payload
        mock_graph.ainvoke = AsyncMock(
            return_value={
                "quiz_payload": {
                    "questions": [
                        {
                            "question_id": "q1",
                            "exercise_type": "vocabulary",
                            "question_text": "What does 學 mean?",
                            "correct_answer": "to study",
                            "explanation": "test explanation",
                            "source_citation": "Book 1, Ch 5",
                            "character": "學",
                            "pinyin": "xué",
                            "meaning": "to study",
                            "question_subtype": "char_to_meaning",
                            "options": ["to study", "to eat", "to go", "to read"],
                        }
                    ]
                },
                "validation_errors": [],
                "retry_count": 0,
            }
        )

        from src.api.schemas import ExerciseType, QuizGenerateRequest
        from src.services.quiz_service import QuizService

        service = QuizService()
        request_body = QuizGenerateRequest(
            chapter_id=105, book_id=1, exercise_type=ExerciseType.VOCABULARY
        )

        result = await service.generate_quiz(
            request_body, TEST_USER_ID, mock_http_request
        )

        assert result.quiz_id is not None
        assert result.question_count == 1
        # Verify is_disconnected was checked before graph invocation
        mock_http_request.is_disconnected.assert_called_once()

    @pytest.mark.asyncio
    @patch("src.services.validation_service.get_llm")
    @patch("src.api.dependencies.settings")
    async def test_answer_validation_cancels_when_client_disconnects(
        self, mock_settings, mock_get_llm
    ):
        """Answer validation raises CancelledError when client disconnects before LLM.

        Verifies that ValidationService.validate_answer() checks is_disconnected()
        before invoking the LLM and raises asyncio.CancelledError immediately.
        """
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET

        # Create a mock HTTP request that reports as disconnected
        mock_http_request = MagicMock()
        mock_http_request.is_disconnected = AsyncMock(return_value=True)

        from src.api.schemas import ValidationExerciseType, ValidationRequest
        from src.services.validation_service import ValidationService

        service = ValidationService()
        request_body = ValidationRequest(
            question="Arrange: 我 中文 學",
            user_answer="我學中文",
            correct_answer="我學中文",
            exercise_type=ValidationExerciseType.SENTENCE_CONSTRUCTION,
        )

        with pytest.raises(asyncio.CancelledError):
            await service.validate_answer(request_body, mock_http_request)

        # Verify is_disconnected was called before LLM invocation
        mock_http_request.is_disconnected.assert_called_once()

    @pytest.mark.asyncio
    @patch("src.api.dependencies.settings")
    async def test_quiz_generation_logs_cancellation(self, mock_settings, caplog):
        """Verify cancellation is logged at INFO level with chapter and user info.

        Verifies that when a client disconnects, the service logs the cancellation
        with the expected message format including chapter_id and user_id.
        """
        import logging

        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET

        mock_http_request = MagicMock()
        mock_http_request.is_disconnected = AsyncMock(return_value=True)

        from src.api.schemas import ExerciseType, QuizGenerateRequest
        from src.services.quiz_service import QuizService

        service = QuizService()
        request_body = QuizGenerateRequest(
            chapter_id=105, book_id=1, exercise_type=ExerciseType.VOCABULARY
        )

        with caplog.at_level(logging.INFO, logger="src.services.quiz_service"):
            with pytest.raises(asyncio.CancelledError):
                await service.generate_quiz(
                    request_body, TEST_USER_ID, mock_http_request
                )

        # Verify the cancellation was logged
        assert any(
            "disconnected" in record.message.lower() for record in caplog.records
        )

    @pytest.mark.asyncio
    @patch("src.api.dependencies.settings")
    async def test_node_generate_quiz_cancels_when_disconnected(self, mock_settings):
        """Verify generate_quiz node raises CancelledError when client disconnects.

        Tests the LangGraph node directly to verify it checks disconnection
        before the LLM call.
        """
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET

        mock_http_request = MagicMock()
        mock_http_request.is_disconnected = AsyncMock(return_value=True)

        from src.agent.nodes import generate_quiz as generate_quiz_node

        state: dict = {
            "book_id": 1,
            "chapter_id": 105,
            "exercise_type": "vocabulary",
            "user_id": TEST_USER_ID,
            "retrieved_content": [],
            "weakness_profile": {},
            "request": mock_http_request,
        }

        with pytest.raises(asyncio.CancelledError):
            await generate_quiz_node(state)

        mock_http_request.is_disconnected.assert_called()

    @pytest.mark.asyncio
    @patch("src.api.dependencies.settings")
    async def test_node_evaluate_content_cancels_when_disconnected(self, mock_settings):
        """Verify evaluate_content node raises CancelledError when client disconnects.

        Tests the LangGraph node directly to verify it checks disconnection
        before the evaluator LLM call.
        """
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET

        mock_http_request = MagicMock()
        mock_http_request.is_disconnected = AsyncMock(return_value=True)

        from src.agent.nodes import evaluate_content as evaluate_content_node

        state: dict = {
            "book_id": 1,
            "chapter_id": 105,
            "exercise_type": "vocabulary",
            "user_id": TEST_USER_ID,
            "questions": [
                {
                    "question_id": "q1",
                    "exercise_type": "vocabulary",
                    "question_text": "What does 學 mean?",
                    "correct_answer": "to study",
                    "explanation": "test",
                    "source_citation": "Book 1, Ch 5",
                }
            ],
            "validation_errors": [],
            "retry_count": 0,
            "request": mock_http_request,
        }

        with pytest.raises(asyncio.CancelledError):
            await evaluate_content_node(state)

        mock_http_request.is_disconnected.assert_called()

    @pytest.mark.asyncio
    @patch("src.api.dependencies.settings")
    async def test_node_retrieve_content_cancels_when_disconnected(self, mock_settings):
        """Verify retrieve_content node raises CancelledError when client disconnects.

        Tests the LangGraph node directly to verify it checks disconnection
        before the RAG database query.
        """
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET

        mock_http_request = MagicMock()
        mock_http_request.is_disconnected = AsyncMock(return_value=True)

        from src.agent.nodes import retrieve_content as retrieve_content_node

        state: dict = {
            "book_id": 1,
            "chapter_id": 105,
            "exercise_type": "vocabulary",
            "user_id": TEST_USER_ID,
            "request": mock_http_request,
        }

        with pytest.raises(asyncio.CancelledError):
            await retrieve_content_node(state)

        mock_http_request.is_disconnected.assert_called_once()

    @pytest.mark.asyncio
    @patch("src.api.dependencies.settings")
    async def test_node_query_weakness_cancels_when_disconnected(self, mock_settings):
        """Verify query_weakness node raises CancelledError when client disconnects.

        Tests the LangGraph node directly to verify it checks disconnection
        before the weakness profile database query.
        """
        mock_settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET

        mock_http_request = MagicMock()
        mock_http_request.is_disconnected = AsyncMock(return_value=True)

        from src.agent.nodes import query_weakness as query_weakness_node

        state: dict = {
            "user_id": TEST_USER_ID,
            "request": mock_http_request,
        }

        with pytest.raises(asyncio.CancelledError):
            await query_weakness_node(state)

        mock_http_request.is_disconnected.assert_called_once()
