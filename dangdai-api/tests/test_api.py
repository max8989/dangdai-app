"""API endpoint tests."""

import time
from unittest.mock import AsyncMock, patch

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
