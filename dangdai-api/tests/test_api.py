"""API endpoint tests."""

import time
from unittest.mock import AsyncMock, patch

import jwt
import pytest
from fastapi.testclient import TestClient

from src.api.main import app

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
            return_value={
                "quiz_id": "test-quiz-id",
                "chapter_id": 101,
                "book_id": 1,
                "exercise_type": "vocabulary",
                "question_count": 1,
                "questions": [
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
            }
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
