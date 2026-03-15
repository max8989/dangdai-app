"""Integration tests for Story 1.9: Request Cancellation for Backend Endpoints.

Verifies that client disconnection is detected at each of the 6 checkpoints
in the quiz generation and validation pipeline, that CancelledError propagates
correctly (is never silently swallowed), that no expensive LLM/database calls
are made after a disconnect, and that the normal (connected) path is unaffected.

Checkpoints under test:
  1. QuizService.generate_quiz() — before graph.ainvoke()
  2. retrieve_content node — before RAG database query
  3. query_weakness node — before weakness DB query
  4. generate_quiz node — before LLM call
  5. evaluate_content node — before evaluator LLM call
  6. ValidationService.validate_answer() — before LLM call
"""

from __future__ import annotations

import asyncio
import logging
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# Shared test constants
# ---------------------------------------------------------------------------

TEST_USER_ID = "integration-test-user-uuid-9999"
CHAPTER_ID = 105
BOOK_ID = 1


def _make_disconnected_request() -> MagicMock:
    """Return a mock HTTP request that reports as disconnected."""
    req = MagicMock()
    req.is_disconnected = AsyncMock(return_value=True)
    return req


def _make_connected_request() -> MagicMock:
    """Return a mock HTTP request that reports as connected."""
    req = MagicMock()
    req.is_disconnected = AsyncMock(return_value=False)
    return req


# ---------------------------------------------------------------------------
# Checkpoint 1: QuizService.generate_quiz() — service entry
# ---------------------------------------------------------------------------


class TestServiceEntryCheckpoint:
    """Checkpoint 1: QuizService checks disconnection before graph.ainvoke()."""

    @pytest.mark.asyncio
    @patch("src.services.quiz_service.graph")
    async def test_disconnected_client_prevents_graph_invocation(
        self, mock_graph: MagicMock
    ) -> None:
        """Positive cancellation: graph.ainvoke is NEVER called when client disconnects.

        Objective: Verify that QuizService.generate_quiz() raises CancelledError
        at the service-entry checkpoint and does not invoke LangGraph, preventing
        any LLM or database calls from being made.
        """
        # Arrange
        from src.api.schemas import ExerciseType, QuizGenerateRequest
        from src.services.quiz_service import QuizService

        service = QuizService()
        request_body = QuizGenerateRequest(
            chapter_id=CHAPTER_ID,
            book_id=BOOK_ID,
            exercise_type=ExerciseType.VOCABULARY,
        )
        disconnected_request = _make_disconnected_request()

        # Act & Assert
        with pytest.raises(asyncio.CancelledError):
            await service.generate_quiz(
                request_body, TEST_USER_ID, disconnected_request
            )

        # Verify: graph was never invoked — no LLM calls made
        mock_graph.ainvoke.assert_not_called()
        disconnected_request.is_disconnected.assert_called_once()

    @pytest.mark.asyncio
    @patch("src.services.quiz_service.graph")
    async def test_connected_client_invokes_graph_normally(
        self, mock_graph: MagicMock
    ) -> None:
        """Negative (false-positive guard): connected client proceeds to graph.ainvoke.

        Objective: Verify that a connected client is NOT cancelled — the service
        proceeds to invoke LangGraph normally, confirming no false positives.
        """
        # Arrange
        from src.api.schemas import ExerciseType, QuizGenerateRequest
        from src.services.quiz_service import QuizService

        service = QuizService()
        request_body = QuizGenerateRequest(
            chapter_id=CHAPTER_ID,
            book_id=BOOK_ID,
            exercise_type=ExerciseType.VOCABULARY,
        )
        connected_request = _make_connected_request()

        mock_graph.ainvoke = AsyncMock(
            return_value={
                "quiz_payload": {
                    "questions": [
                        {
                            "question_id": "q1",
                            "exercise_type": "vocabulary",
                            "question_text": "What does 學 mean?",
                            "correct_answer": "to study",
                            "explanation": "學 means to study or to learn.",
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

        # Act
        result = await service.generate_quiz(
            request_body, TEST_USER_ID, connected_request
        )

        # Assert: graph was invoked and result is valid
        mock_graph.ainvoke.assert_called_once()
        assert result.question_count == 1
        connected_request.is_disconnected.assert_called_once()

    @pytest.mark.asyncio
    async def test_service_entry_cancellation_logs_info(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Positive cancellation: INFO log emitted at service-entry checkpoint.

        Objective: Verify that when a client disconnects before graph invocation,
        the QuizService logs an INFO-level message containing 'disconnected' and
        the chapter_id, confirming the correct checkpoint was reached.
        """
        # Arrange
        from src.api.schemas import ExerciseType, QuizGenerateRequest
        from src.services.quiz_service import QuizService

        service = QuizService()
        request_body = QuizGenerateRequest(
            chapter_id=CHAPTER_ID,
            book_id=BOOK_ID,
            exercise_type=ExerciseType.VOCABULARY,
        )
        disconnected_request = _make_disconnected_request()

        # Act
        with caplog.at_level(logging.INFO, logger="src.services.quiz_service"):
            with pytest.raises(asyncio.CancelledError):
                await service.generate_quiz(
                    request_body, TEST_USER_ID, disconnected_request
                )

        # Assert: INFO log contains 'disconnected' keyword
        log_messages = [r.message for r in caplog.records]
        assert any("disconnected" in msg.lower() for msg in log_messages), (
            f"Expected 'disconnected' in logs, got: {log_messages}"
        )


# ---------------------------------------------------------------------------
# Checkpoint 2: retrieve_content node — before RAG query
# ---------------------------------------------------------------------------


class TestRetrieveContentNodeCheckpoint:
    """Checkpoint 2: retrieve_content node checks disconnection before RAG query."""

    @pytest.mark.asyncio
    @patch("src.agent.nodes.RagService")
    async def test_disconnected_client_prevents_rag_query(
        self, mock_rag_service_cls: MagicMock
    ) -> None:
        """Positive cancellation: RAG service is NEVER instantiated when client disconnects.

        Objective: Verify that the retrieve_content node raises CancelledError
        before calling RagService, preventing any database query from being made.
        """
        # Arrange
        from src.agent.nodes import retrieve_content

        disconnected_request = _make_disconnected_request()
        state: dict = {
            "book_id": BOOK_ID,
            "chapter_id": CHAPTER_ID,
            "exercise_type": "vocabulary",
            "user_id": TEST_USER_ID,
            "request": disconnected_request,
        }

        # Act & Assert
        with pytest.raises(asyncio.CancelledError):
            await retrieve_content(state)  # type: ignore[arg-type]

        # Verify: RagService was never instantiated — no DB query made
        mock_rag_service_cls.assert_not_called()
        disconnected_request.is_disconnected.assert_called_once()

    @pytest.mark.asyncio
    @patch("src.agent.nodes.ChapterRepository")
    @patch("src.agent.nodes.RagService")
    async def test_connected_client_executes_rag_query(
        self, mock_rag_service_cls: MagicMock, mock_chapter_repo_cls: MagicMock
    ) -> None:
        """Negative (false-positive guard): connected client proceeds to RAG query.

        Objective: Verify that a connected client is NOT cancelled at the
        retrieve_content checkpoint — the RAG service is called normally.
        """
        # Arrange
        from src.agent.nodes import retrieve_content

        connected_request = _make_connected_request()
        mock_rag_instance = MagicMock()
        mock_rag_instance.retrieve_content.return_value = [
            {
                "section": "Vocabulary",
                "content": "學 (xué) — to study",
                "exercise_type": "vocabulary",
                "topic": "",
            }
        ]
        mock_rag_service_cls.return_value = mock_rag_instance

        mock_repo_instance = MagicMock()
        mock_repo_instance.parse_chapter_id = MagicMock(return_value=(1, 5))
        mock_chapter_repo_cls.parse_chapter_id = MagicMock(return_value=(1, 5))

        state: dict = {
            "book_id": BOOK_ID,
            "chapter_id": CHAPTER_ID,
            "exercise_type": "vocabulary",
            "user_id": TEST_USER_ID,
            "request": connected_request,
        }

        # Act
        result = await retrieve_content(state)  # type: ignore[arg-type]

        # Assert: RAG service was called and content returned
        mock_rag_service_cls.assert_called_once()
        assert "retrieved_content" in result
        connected_request.is_disconnected.assert_called_once()

    @pytest.mark.asyncio
    async def test_retrieve_content_cancellation_logs_info(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Positive cancellation: INFO log emitted at retrieve_content checkpoint.

        Objective: Verify that when a client disconnects at the retrieve_content
        node, an INFO-level log message containing 'disconnected' is emitted,
        confirming the correct checkpoint was reached.
        """
        # Arrange
        from src.agent.nodes import retrieve_content

        disconnected_request = _make_disconnected_request()
        state: dict = {
            "book_id": BOOK_ID,
            "chapter_id": CHAPTER_ID,
            "exercise_type": "vocabulary",
            "user_id": TEST_USER_ID,
            "request": disconnected_request,
        }

        # Act
        with caplog.at_level(logging.INFO, logger="src.agent.nodes"):
            with pytest.raises(asyncio.CancelledError):
                await retrieve_content(state)  # type: ignore[arg-type]

        # Assert: INFO log contains 'disconnected'
        log_messages = [r.message for r in caplog.records]
        assert any("disconnected" in msg.lower() for msg in log_messages), (
            f"Expected 'disconnected' in logs, got: {log_messages}"
        )


# ---------------------------------------------------------------------------
# Checkpoint 3: query_weakness node — before weakness DB query
# ---------------------------------------------------------------------------


class TestQueryWeaknessNodeCheckpoint:
    """Checkpoint 3: query_weakness node checks disconnection before DB query."""

    @pytest.mark.asyncio
    @patch("src.agent.nodes.WeaknessService")
    async def test_disconnected_client_prevents_weakness_query(
        self, mock_weakness_service_cls: MagicMock
    ) -> None:
        """Positive cancellation: WeaknessService is NEVER called when client disconnects.

        Objective: Verify that the query_weakness node raises CancelledError
        before calling WeaknessService, preventing any database query.
        """
        # Arrange
        from src.agent.nodes import query_weakness

        disconnected_request = _make_disconnected_request()
        state: dict = {
            "user_id": TEST_USER_ID,
            "request": disconnected_request,
        }

        # Act & Assert
        with pytest.raises(asyncio.CancelledError):
            await query_weakness(state)  # type: ignore[arg-type]

        # Verify: WeaknessService was never instantiated — no DB query made
        mock_weakness_service_cls.assert_not_called()
        disconnected_request.is_disconnected.assert_called_once()

    @pytest.mark.asyncio
    @patch("src.agent.nodes.WeaknessService")
    async def test_connected_client_executes_weakness_query(
        self, mock_weakness_service_cls: MagicMock
    ) -> None:
        """Negative (false-positive guard): connected client proceeds to weakness query.

        Objective: Verify that a connected client is NOT cancelled at the
        query_weakness checkpoint — the WeaknessService is called normally.
        """
        # Arrange
        from src.agent.nodes import query_weakness

        connected_request = _make_connected_request()
        mock_weakness_instance = MagicMock()
        mock_weakness_instance.get_weakness_profile.return_value = {
            "weak_exercise_types": ["grammar"]
        }
        mock_weakness_service_cls.return_value = mock_weakness_instance

        state: dict = {
            "user_id": TEST_USER_ID,
            "request": connected_request,
        }

        # Act
        result = await query_weakness(state)  # type: ignore[arg-type]

        # Assert: WeaknessService was called and profile returned
        mock_weakness_service_cls.assert_called_once()
        assert "weakness_profile" in result
        connected_request.is_disconnected.assert_called_once()

    @pytest.mark.asyncio
    async def test_query_weakness_cancellation_logs_info(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Positive cancellation: INFO log emitted at query_weakness checkpoint.

        Objective: Verify that when a client disconnects at the query_weakness
        node, an INFO-level log message containing 'disconnected' is emitted.
        """
        # Arrange
        from src.agent.nodes import query_weakness

        disconnected_request = _make_disconnected_request()
        state: dict = {
            "user_id": TEST_USER_ID,
            "request": disconnected_request,
        }

        # Act
        with caplog.at_level(logging.INFO, logger="src.agent.nodes"):
            with pytest.raises(asyncio.CancelledError):
                await query_weakness(state)  # type: ignore[arg-type]

        # Assert: INFO log contains 'disconnected'
        log_messages = [r.message for r in caplog.records]
        assert any("disconnected" in msg.lower() for msg in log_messages), (
            f"Expected 'disconnected' in logs, got: {log_messages}"
        )


# ---------------------------------------------------------------------------
# Checkpoint 4: generate_quiz node — before LLM call
# ---------------------------------------------------------------------------


class TestGenerateQuizNodeCheckpoint:
    """Checkpoint 4: generate_quiz node checks disconnection before LLM call."""

    @pytest.mark.asyncio
    @patch("src.agent.nodes.get_llm")
    async def test_disconnected_client_prevents_llm_call(
        self, mock_get_llm: MagicMock
    ) -> None:
        """Positive cancellation: LLM is NEVER called when client disconnects.

        Objective: Verify that the generate_quiz node raises CancelledError
        before calling get_llm() / llm.ainvoke(), preventing any LLM API cost.
        """
        # Arrange
        from src.agent.nodes import generate_quiz

        disconnected_request = _make_disconnected_request()
        state: dict = {
            "book_id": BOOK_ID,
            "chapter_id": CHAPTER_ID,
            "exercise_type": "vocabulary",
            "user_id": TEST_USER_ID,
            "retrieved_content": [],
            "weakness_profile": {},
            "retry_count": 0,
            "request": disconnected_request,
        }

        # Act & Assert
        with pytest.raises(asyncio.CancelledError):
            await generate_quiz(state)  # type: ignore[arg-type]

        # Verify: LLM was never invoked — no API cost incurred
        mock_get_llm.return_value.ainvoke.assert_not_called()
        disconnected_request.is_disconnected.assert_called()

    @pytest.mark.asyncio
    @patch("src.agent.nodes.get_llm")
    async def test_connected_client_calls_llm(self, mock_get_llm: MagicMock) -> None:
        """Negative (false-positive guard): connected client proceeds to LLM call.

        Objective: Verify that a connected client is NOT cancelled at the
        generate_quiz checkpoint — the LLM is invoked normally.
        """
        # Arrange
        from src.agent.nodes import generate_quiz

        connected_request = _make_connected_request()
        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(
            return_value=MagicMock(
                content='[{"question_id": "q1", "exercise_type": "vocabulary", '
                '"question_text": "What does 學 mean?", "correct_answer": "to study", '
                '"explanation": "學 means to study.", "source_citation": "Book 1, Ch 5", '
                '"character": "學", "pinyin": "xué", "meaning": "to study", '
                '"question_subtype": "char_to_meaning", '
                '"options": ["to study", "to eat", "to go", "to read"]}]'
            )
        )
        mock_get_llm.return_value = mock_llm

        state: dict = {
            "book_id": BOOK_ID,
            "chapter_id": CHAPTER_ID,
            "exercise_type": "vocabulary",
            "user_id": TEST_USER_ID,
            "retrieved_content": [],
            "weakness_profile": {},
            "retry_count": 0,
            "request": connected_request,
        }

        # Act
        result = await generate_quiz(state)  # type: ignore[arg-type]

        # Assert: LLM was called and questions returned
        mock_llm.ainvoke.assert_called_once()
        assert "questions" in result
        assert len(result["questions"]) == 1
        connected_request.is_disconnected.assert_called()

    @pytest.mark.asyncio
    async def test_generate_quiz_cancellation_logs_info(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Positive cancellation: INFO log emitted at generate_quiz checkpoint.

        Objective: Verify that when a client disconnects at the generate_quiz
        node, an INFO-level log message containing 'disconnected' is emitted.
        """
        # Arrange
        from src.agent.nodes import generate_quiz

        disconnected_request = _make_disconnected_request()
        state: dict = {
            "book_id": BOOK_ID,
            "chapter_id": CHAPTER_ID,
            "exercise_type": "vocabulary",
            "user_id": TEST_USER_ID,
            "retrieved_content": [],
            "weakness_profile": {},
            "retry_count": 0,
            "request": disconnected_request,
        }

        # Act
        with caplog.at_level(logging.INFO, logger="src.agent.nodes"):
            with pytest.raises(asyncio.CancelledError):
                await generate_quiz(state)  # type: ignore[arg-type]

        # Assert: INFO log contains 'disconnected'
        log_messages = [r.message for r in caplog.records]
        assert any("disconnected" in msg.lower() for msg in log_messages), (
            f"Expected 'disconnected' in logs, got: {log_messages}"
        )


# ---------------------------------------------------------------------------
# Checkpoint 5: evaluate_content node — before evaluator LLM call
# ---------------------------------------------------------------------------


class TestEvaluateContentNodeCheckpoint:
    """Checkpoint 5: evaluate_content node checks disconnection before evaluator LLM."""

    @pytest.mark.asyncio
    @patch("src.agent.nodes.get_llm")
    async def test_disconnected_client_prevents_evaluator_llm_call(
        self, mock_get_llm: MagicMock
    ) -> None:
        """Positive cancellation: evaluator LLM is NEVER called when client disconnects.

        Objective: Verify that the evaluate_content node raises CancelledError
        before calling the evaluator LLM, preventing any API cost for evaluation.
        """
        # Arrange
        from src.agent.nodes import evaluate_content

        disconnected_request = _make_disconnected_request()
        state: dict = {
            "book_id": BOOK_ID,
            "chapter_id": CHAPTER_ID,
            "exercise_type": "vocabulary",
            "user_id": TEST_USER_ID,
            "questions": [
                {
                    "question_id": "q1",
                    "exercise_type": "vocabulary",
                    "question_text": "What does 學 mean?",
                    "correct_answer": "to study",
                    "explanation": "學 means to study.",
                    "source_citation": "Book 1, Ch 5",
                }
            ],
            "validation_errors": [],
            "retry_count": 0,
            "request": disconnected_request,
        }

        # Act & Assert
        with pytest.raises(asyncio.CancelledError):
            await evaluate_content(state)  # type: ignore[arg-type]

        # Verify: evaluator LLM was never invoked — no API cost incurred
        mock_get_llm.return_value.ainvoke.assert_not_called()
        disconnected_request.is_disconnected.assert_called()

    @pytest.mark.asyncio
    @patch("src.agent.nodes.get_llm")
    async def test_connected_client_calls_evaluator_llm(
        self, mock_get_llm: MagicMock
    ) -> None:
        """Negative (false-positive guard): connected client proceeds to evaluator LLM.

        Objective: Verify that a connected client is NOT cancelled at the
        evaluate_content checkpoint — the evaluator LLM is invoked normally.
        """
        # Arrange
        from src.agent.nodes import evaluate_content

        connected_request = _make_connected_request()
        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(
            return_value=MagicMock(content='{"passed": true, "issues": []}')
        )
        mock_get_llm.return_value = mock_llm

        questions = [
            {
                "question_id": "q1",
                "exercise_type": "vocabulary",
                "question_text": "What does 學 mean?",
                "correct_answer": "to study",
                "explanation": "學 means to study.",
                "source_citation": "Book 1, Ch 5",
            }
        ]
        state: dict = {
            "book_id": BOOK_ID,
            "chapter_id": CHAPTER_ID,
            "exercise_type": "vocabulary",
            "user_id": TEST_USER_ID,
            "questions": questions,
            "validation_errors": [],
            "retry_count": 0,
            "request": connected_request,
        }

        # Act
        result = await evaluate_content(state)  # type: ignore[arg-type]

        # Assert: evaluator LLM was called and quiz_payload returned
        mock_llm.ainvoke.assert_called_once()
        assert "quiz_payload" in result
        connected_request.is_disconnected.assert_called()

    @pytest.mark.asyncio
    async def test_evaluate_content_cancellation_logs_info(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Positive cancellation: INFO log emitted at evaluate_content checkpoint.

        Objective: Verify that when a client disconnects at the evaluate_content
        node, an INFO-level log message containing 'disconnected' is emitted.
        """
        # Arrange
        from src.agent.nodes import evaluate_content

        disconnected_request = _make_disconnected_request()
        state: dict = {
            "book_id": BOOK_ID,
            "chapter_id": CHAPTER_ID,
            "exercise_type": "vocabulary",
            "user_id": TEST_USER_ID,
            "questions": [
                {
                    "question_id": "q1",
                    "exercise_type": "vocabulary",
                    "question_text": "What does 學 mean?",
                    "correct_answer": "to study",
                    "explanation": "學 means to study.",
                    "source_citation": "Book 1, Ch 5",
                }
            ],
            "validation_errors": [],
            "retry_count": 0,
            "request": disconnected_request,
        }

        # Act
        with caplog.at_level(logging.INFO, logger="src.agent.nodes"):
            with pytest.raises(asyncio.CancelledError):
                await evaluate_content(state)  # type: ignore[arg-type]

        # Assert: INFO log contains 'disconnected'
        log_messages = [r.message for r in caplog.records]
        assert any("disconnected" in msg.lower() for msg in log_messages), (
            f"Expected 'disconnected' in logs, got: {log_messages}"
        )


# ---------------------------------------------------------------------------
# Checkpoint 6: ValidationService.validate_answer() — before LLM call
# ---------------------------------------------------------------------------


class TestValidationServiceCheckpoint:
    """Checkpoint 6: ValidationService checks disconnection before LLM call."""

    @pytest.mark.asyncio
    @patch("src.services.validation_service.get_llm")
    async def test_disconnected_client_prevents_validation_llm_call(
        self, mock_get_llm: MagicMock
    ) -> None:
        """Positive cancellation: validation LLM is NEVER called when client disconnects.

        Objective: Verify that ValidationService.validate_answer() raises
        CancelledError before calling the LLM, preventing any API cost.
        """
        # Arrange
        from src.api.schemas import ValidationExerciseType, ValidationRequest
        from src.services.validation_service import ValidationService

        service = ValidationService()
        request_body = ValidationRequest(
            question="Arrange: 我 中文 學",
            user_answer="我學中文",
            correct_answer="我學中文",
            exercise_type=ValidationExerciseType.SENTENCE_CONSTRUCTION,
        )
        disconnected_request = _make_disconnected_request()

        # Act & Assert
        with pytest.raises(asyncio.CancelledError):
            await service.validate_answer(request_body, disconnected_request)

        # Verify: LLM was never invoked — no API cost incurred
        mock_get_llm.return_value.ainvoke.assert_not_called()
        disconnected_request.is_disconnected.assert_called_once()

    @pytest.mark.asyncio
    @patch("src.services.validation_service.get_llm")
    async def test_connected_client_calls_validation_llm(
        self, mock_get_llm: MagicMock
    ) -> None:
        """Negative (false-positive guard): connected client proceeds to validation LLM.

        Objective: Verify that a connected client is NOT cancelled at the
        validate_answer checkpoint — the LLM is invoked normally.
        """
        # Arrange
        from src.api.schemas import ValidationExerciseType, ValidationRequest
        from src.services.validation_service import ValidationService

        service = ValidationService()
        request_body = ValidationRequest(
            question="Arrange: 我 中文 學",
            user_answer="我學中文",
            correct_answer="我學中文",
            exercise_type=ValidationExerciseType.SENTENCE_CONSTRUCTION,
        )
        connected_request = _make_connected_request()

        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(
            return_value=MagicMock(
                content='{"is_correct": true, "explanation": "Correct!", "alternatives": []}'
            )
        )
        mock_get_llm.return_value = mock_llm

        # Act
        result = await service.validate_answer(request_body, connected_request)

        # Assert: LLM was called and result returned
        mock_llm.ainvoke.assert_called_once()
        assert result.is_correct is True
        connected_request.is_disconnected.assert_called_once()

    @pytest.mark.asyncio
    @patch("src.services.validation_service.get_llm")
    async def test_validation_cancellation_logs_info(
        self, mock_get_llm: MagicMock, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Positive cancellation: INFO log emitted at validate_answer checkpoint.

        Objective: Verify that when a client disconnects at the validate_answer
        checkpoint, an INFO-level log message containing 'disconnected' is emitted.
        """
        # Arrange
        from src.api.schemas import ValidationExerciseType, ValidationRequest
        from src.services.validation_service import ValidationService

        service = ValidationService()
        request_body = ValidationRequest(
            question="Arrange: 我 中文 學",
            user_answer="我學中文",
            correct_answer="我學中文",
            exercise_type=ValidationExerciseType.SENTENCE_CONSTRUCTION,
        )
        disconnected_request = _make_disconnected_request()

        # Act
        with caplog.at_level(logging.INFO, logger="src.services.validation_service"):
            with pytest.raises(asyncio.CancelledError):
                await service.validate_answer(request_body, disconnected_request)

        # Assert: INFO log contains 'disconnected'
        log_messages = [r.message for r in caplog.records]
        assert any("disconnected" in msg.lower() for msg in log_messages), (
            f"Expected 'disconnected' in logs, got: {log_messages}"
        )


# ---------------------------------------------------------------------------
# CancelledError propagation — no silent swallowing
# ---------------------------------------------------------------------------


class TestCancelledErrorPropagation:
    """Verify CancelledError is never silently swallowed at any layer."""

    @pytest.mark.asyncio
    async def test_cancelled_error_propagates_through_generate_quiz_node(self) -> None:
        """Positive: CancelledError from within LLM call propagates out of generate_quiz.

        Objective: Verify that if asyncio.CancelledError is raised during the
        LLM call inside generate_quiz (e.g., mid-stream cancellation), it is
        re-raised and NOT swallowed by the node's exception handler.
        """
        # Arrange
        from src.agent.nodes import generate_quiz

        connected_request = _make_connected_request()

        with patch("src.agent.nodes.get_llm") as mock_get_llm:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(
                side_effect=asyncio.CancelledError("mid-stream")
            )
            mock_get_llm.return_value = mock_llm

            state: dict = {
                "book_id": BOOK_ID,
                "chapter_id": CHAPTER_ID,
                "exercise_type": "vocabulary",
                "user_id": TEST_USER_ID,
                "retrieved_content": [],
                "weakness_profile": {},
                "retry_count": 0,
                "request": connected_request,
            }

            # Act & Assert: CancelledError must propagate, not be caught as generic Exception
            with pytest.raises(asyncio.CancelledError):
                await generate_quiz(state)  # type: ignore[arg-type]

    @pytest.mark.asyncio
    async def test_cancelled_error_propagates_through_evaluate_content_node(
        self,
    ) -> None:
        """Positive: CancelledError from evaluator LLM propagates out of evaluate_content.

        Objective: Verify that if asyncio.CancelledError is raised during the
        evaluator LLM call inside evaluate_content, it is re-raised and NOT
        swallowed by the node's fallback-to-pass exception handler.
        """
        # Arrange
        from src.agent.nodes import evaluate_content

        connected_request = _make_connected_request()

        with patch("src.agent.nodes.get_llm") as mock_get_llm:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(side_effect=asyncio.CancelledError("mid-eval"))
            mock_get_llm.return_value = mock_llm

            state: dict = {
                "book_id": BOOK_ID,
                "chapter_id": CHAPTER_ID,
                "exercise_type": "vocabulary",
                "user_id": TEST_USER_ID,
                "questions": [
                    {
                        "question_id": "q1",
                        "exercise_type": "vocabulary",
                        "question_text": "What does 學 mean?",
                        "correct_answer": "to study",
                        "explanation": "學 means to study.",
                        "source_citation": "Book 1, Ch 5",
                    }
                ],
                "validation_errors": [],
                "retry_count": 0,
                "request": connected_request,
            }

            # Act & Assert: CancelledError must propagate, not trigger auto-pass fallback
            with pytest.raises(asyncio.CancelledError):
                await evaluate_content(state)  # type: ignore[arg-type]

    @pytest.mark.asyncio
    async def test_cancelled_error_propagates_through_validation_service(self) -> None:
        """Positive: CancelledError from LLM propagates out of ValidationService.

        Objective: Verify that if asyncio.CancelledError is raised during the
        LLM call inside validate_answer, it is re-raised and NOT swallowed.
        """
        # Arrange
        from src.api.schemas import ValidationExerciseType, ValidationRequest
        from src.services.validation_service import ValidationService

        service = ValidationService()
        request_body = ValidationRequest(
            question="Arrange: 我 中文 學",
            user_answer="我學中文",
            correct_answer="我學中文",
            exercise_type=ValidationExerciseType.SENTENCE_CONSTRUCTION,
        )
        connected_request = _make_connected_request()

        with patch("src.services.validation_service.get_llm") as mock_get_llm:
            mock_llm = MagicMock()
            mock_llm.ainvoke = AsyncMock(
                side_effect=asyncio.CancelledError("mid-validation")
            )
            mock_get_llm.return_value = mock_llm

            # Act & Assert: CancelledError must propagate
            with pytest.raises(asyncio.CancelledError):
                await service.validate_answer(request_body, connected_request)

    @pytest.mark.asyncio
    async def test_cancelled_error_propagates_through_quiz_service(self) -> None:
        """Positive: CancelledError from graph propagates out of QuizService.

        Objective: Verify that if asyncio.CancelledError is raised during
        graph.ainvoke() (e.g., from a node mid-execution), it is re-raised
        by QuizService and NOT swallowed or converted to another exception.
        """
        # Arrange
        from src.api.schemas import ExerciseType, QuizGenerateRequest
        from src.services.quiz_service import QuizService

        service = QuizService()
        request_body = QuizGenerateRequest(
            chapter_id=CHAPTER_ID,
            book_id=BOOK_ID,
            exercise_type=ExerciseType.VOCABULARY,
        )
        connected_request = _make_connected_request()

        with patch("src.services.quiz_service.graph") as mock_graph:
            mock_graph.ainvoke = AsyncMock(
                side_effect=asyncio.CancelledError("graph-cancel")
            )

            # Act & Assert: CancelledError must propagate, not become TimeoutError or ValueError
            with pytest.raises(asyncio.CancelledError):
                await service.generate_quiz(
                    request_body, TEST_USER_ID, connected_request
                )


# ---------------------------------------------------------------------------
# No-request guard: no http_request → no disconnection check
# ---------------------------------------------------------------------------


class TestNoRequestGuard:
    """Verify that omitting http_request skips disconnection checks entirely."""

    @pytest.mark.asyncio
    @patch("src.services.quiz_service.graph")
    async def test_quiz_service_without_http_request_invokes_graph(
        self, mock_graph: MagicMock
    ) -> None:
        """Negative: QuizService without http_request proceeds normally (no check).

        Objective: Verify that when http_request is None (e.g., internal calls),
        the service does NOT attempt to call is_disconnected() and proceeds
        directly to graph invocation.
        """
        # Arrange
        from src.api.schemas import ExerciseType, QuizGenerateRequest
        from src.services.quiz_service import QuizService

        service = QuizService()
        request_body = QuizGenerateRequest(
            chapter_id=CHAPTER_ID,
            book_id=BOOK_ID,
            exercise_type=ExerciseType.VOCABULARY,
        )

        mock_graph.ainvoke = AsyncMock(
            return_value={
                "quiz_payload": {
                    "questions": [
                        {
                            "question_id": "q1",
                            "exercise_type": "vocabulary",
                            "question_text": "What does 學 mean?",
                            "correct_answer": "to study",
                            "explanation": "學 means to study.",
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

        # Act — no http_request passed
        result = await service.generate_quiz(request_body, TEST_USER_ID, None)

        # Assert: graph was invoked normally without any disconnection check
        mock_graph.ainvoke.assert_called_once()
        assert result.question_count == 1

    @pytest.mark.asyncio
    @patch("src.services.validation_service.get_llm")
    async def test_validation_service_without_http_request_calls_llm(
        self, mock_get_llm: MagicMock
    ) -> None:
        """Negative: ValidationService without http_request proceeds normally (no check).

        Objective: Verify that when http_request is None, the validation service
        does NOT attempt to call is_disconnected() and proceeds to the LLM call.
        """
        # Arrange
        from src.api.schemas import ValidationExerciseType, ValidationRequest
        from src.services.validation_service import ValidationService

        service = ValidationService()
        request_body = ValidationRequest(
            question="Arrange: 我 中文 學",
            user_answer="我學中文",
            correct_answer="我學中文",
            exercise_type=ValidationExerciseType.SENTENCE_CONSTRUCTION,
        )

        mock_llm = MagicMock()
        mock_llm.ainvoke = AsyncMock(
            return_value=MagicMock(
                content='{"is_correct": true, "explanation": "Correct!", "alternatives": []}'
            )
        )
        mock_get_llm.return_value = mock_llm

        # Act — no http_request passed
        result = await service.validate_answer(request_body, None)

        # Assert: LLM was called normally without any disconnection check
        mock_llm.ainvoke.assert_called_once()
        assert result.is_correct is True
