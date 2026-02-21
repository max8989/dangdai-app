# Story 4.1b: Answer Validation API Endpoint (Hybrid - Complex Types)

Status: done

## Story

As a developer,
I want to implement the LLM-based answer validation endpoint for Sentence Construction and Dialogue Completion,
So that the mobile app can evaluate open-ended answers where multiple valid responses exist.

## Acceptance Criteria

1. **Given** the Python backend is running
   **When** a POST request is made to `/api/quizzes/validate-answer` with `{ "question": "...", "user_answer": "...", "correct_answer": "...", "exercise_type": "sentence_construction" }`
   **Then** the LLM evaluates whether the user's answer is valid
   **And** the response includes `{ "is_correct": true/false, "explanation": "...", "alternatives": ["alt1", "alt2"] }`

2. **Given** the validation call times out (>3 seconds)
   **When** the timeout occurs
   **Then** the endpoint returns a 504 Gateway Timeout error
   **And** the mobile app falls back to local comparison against the answer key

## Tasks / Subtasks

- [x] Task 1: Add Pydantic schemas for validation request/response (AC: #1)
  - [x] 1.1 Add `ValidationExerciseType` enum restricted to `sentence_construction` and `dialogue_completion` in `src/api/schemas.py`
  - [x] 1.2 Add `ValidationRequest` model with fields: `question`, `user_answer`, `correct_answer`, `exercise_type`
  - [x] 1.3 Add `ValidationResponse` model with fields: `is_correct`, `explanation`, `alternatives`
  - [x] 1.4 Add input validation: all string fields non-empty, `exercise_type` must be one of the two complex types

- [x] Task 2: Implement `validation_service.py` with LLM call (AC: #1)
  - [x] 2.1 Create `src/services/validation_service.py` with `ValidationService` class
  - [x] 2.2 Implement `async validate_answer(request: ValidationRequest) -> ValidationResponse` method
  - [x] 2.3 Build LLM prompt from `ANSWER_VALIDATION_PROMPT` template with question context
  - [x] 2.4 Parse structured JSON response from LLM into `ValidationResponse`
  - [x] 2.5 Handle LLM parse failures gracefully (fall back to exact-match comparison)
  - [x] 2.6 Reuse `get_llm_client()` singleton from `src/utils/llm.py`

- [x] Task 3: Add validation prompt templates to `prompts.py` (AC: #1)
  - [x] 3.1 Add `ANSWER_VALIDATION_SYSTEM_PROMPT` for the validation evaluator role
  - [x] 3.2 Add `ANSWER_VALIDATION_PROMPT` template with placeholders for `exercise_type`, `question`, `correct_answer`, `user_answer`
  - [x] 3.3 Prompt must instruct LLM to return JSON: `{ "is_correct": bool, "explanation": str, "alternatives": [str] }`
  - [x] 3.4 Include exercise-type-specific evaluation criteria (word order flexibility for sentence construction, semantic equivalence for dialogue completion)

- [x] Task 4: Implement `validate-answer` route in `quizzes.py` (AC: #1, #2)
  - [x] 4.1 Add `POST /api/quizzes/validate-answer` route to existing `quizzes.py` router
  - [x] 4.2 Apply `get_current_user` auth dependency (same as `/generate`)
  - [x] 4.3 Wire `ValidationRequest` → `ValidationService.validate_answer()` → `ValidationResponse`
  - [x] 4.4 Return direct response format (no envelope): `{"is_correct": true, "explanation": "...", "alternatives": [...]}`
  - [x] 4.5 Handle error responses: 401 (bad JWT), 400 (invalid request), 500 (LLM failure), 504 (timeout)

- [x] Task 5: Implement 3-second timeout with proper error handling (AC: #2)
  - [x] 5.1 Wrap LLM invocation in `asyncio.wait_for()` with 3-second timeout
  - [x] 5.2 Catch `asyncio.TimeoutError` and raise `TimeoutError` for the route handler
  - [x] 5.3 Route handler converts `TimeoutError` to 504 Gateway Timeout HTTP response
  - [x] 5.4 Log timeout events with request context for monitoring

- [x] Task 6: Write tests (AC: #1, #2)
  - [x] 6.1 Unit tests for `ValidationRequest` / `ValidationResponse` Pydantic schemas (valid input, invalid exercise_type, empty fields)
  - [x] 6.2 Unit tests for `ValidationService` with mocked LLM (correct answer, incorrect answer, LLM parse failure fallback)
  - [x] 6.3 Unit tests for validation prompt template formatting
  - [x] 6.4 API integration tests for `POST /api/quizzes/validate-answer` (success, 401, 400, 504 timeout)
  - [x] 6.5 Test timeout behavior: mock LLM to sleep >3s, verify 504 response
  - [x] 6.6 Test exercise_type restriction: reject `vocabulary`, `grammar`, etc. with 400
  - [x] 6.7 Run `ruff check src/ tests/` and `mypy src/ --strict` — zero errors

## Dev Notes

### Current State of Code (CRITICAL - Read Before Coding)

Story 4.1 has been fully implemented and is in review. The backend is functional with 83 passing tests. This story extends the existing codebase — do NOT rewrite any existing files.

| File | State | Action |
|------|-------|--------|
| `src/api/schemas.py` | Full Pydantic models for all 7 exercise types, `ExerciseType` enum, `QuizGenerateRequest/Response`, `ErrorResponse` | **EXTEND** — add `ValidationRequest`, `ValidationResponse`, `ValidationExerciseType` |
| `src/api/routes/quizzes.py` | `POST /api/quizzes/generate` fully implemented with auth, error handling | **EXTEND** — add `POST /api/quizzes/validate-answer` route |
| `src/api/dependencies.py` | `get_current_user()` and `verify_jwt_token()` fully implemented with Supabase JWT HS256 verification | **REUSE** — apply same auth dependency |
| `src/agent/prompts.py` | System prompt, generation prompt, 7 exercise-type instructions, `VALIDATION_PROMPT` (for quiz self-check) | **EXTEND** — add `ANSWER_VALIDATION_SYSTEM_PROMPT` and `ANSWER_VALIDATION_PROMPT` |
| `src/agent/nodes.py` | `retrieve_content`, `query_weakness`, `generate_quiz`, `validate_quiz` nodes | **DO NOT MODIFY** — validation_service handles the LLM call directly, no new graph node needed |
| `src/services/quiz_service.py` | `QuizService` with async graph invocation + 8s timeout | **DO NOT MODIFY** |
| `src/services/validation_service.py` | Does NOT exist | **CREATE** — new file for LLM-based answer validation |
| `src/utils/llm.py` | `get_llm_client()` singleton returning `ChatAnthropic` | **REUSE** — call from validation service |
| `src/utils/config.py` | `Settings` with `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET`, `LLM_API_KEY`, `LLM_MODEL` | **DO NOT MODIFY** — no new config vars needed |
| `src/agent/state.py` | `QuizGenerationState` TypedDict | **DO NOT MODIFY** — validation does not use the graph |
| `src/agent/graph.py` | StateGraph with retrieve → weakness → generate → validate flow | **DO NOT MODIFY** — validation is a standalone LLM call, not a graph |
| `tests/test_api.py` | 8 quiz endpoint tests | **EXTEND** — add validation endpoint tests |
| `tests/test_schemas.py` | 16 schema validation tests | **EXTEND** — add validation schema tests |
| `tests/test_quiz_generation.py` | 23 graph node + helper tests | **DO NOT MODIFY** |

### API Contract

**Request:** `POST /api/quizzes/validate-answer`

Headers: `Authorization: Bearer <supabase_jwt>`

```json
{
  "question": "Arrange these words into a correct sentence: 我 中文 學 在 大學",
  "user_answer": "我在大學學中文",
  "correct_answer": "我在大學學中文",
  "exercise_type": "sentence_construction"
}
```

**Success Response (200):**

```json
{
  "is_correct": true,
  "explanation": "Your sentence '我在大學學中文' correctly uses the 在 + place + verb pattern. This matches the expected answer.",
  "alternatives": [
    "我學中文在大學",
    "在大學我學中文"
  ]
}
```

**Incorrect Answer Response (200):**

```json
{
  "is_correct": false,
  "explanation": "The word order '中文我學在大學' is not grammatically correct. The 在 + place structure should come before the verb.",
  "alternatives": [
    "我在大學學中文",
    "在大學我學中文"
  ]
}
```

**Error Responses:**

| Code | Condition | Response Body |
|------|-----------|---------------|
| 400 | Invalid `exercise_type` (not `sentence_construction` or `dialogue_completion`) | `{"detail": "exercise_type must be 'sentence_construction' or 'dialogue_completion'"}` |
| 400 | Empty required fields | `{"detail": "All fields (question, user_answer, correct_answer) must be non-empty"}` |
| 401 | Invalid/missing JWT | `{"detail": "Invalid authentication token"}` |
| 500 | LLM invocation failure | `{"detail": "Answer validation failed: <error>"}` |
| 504 | LLM call exceeds 3 seconds | `{"detail": "Answer validation timed out"}` |

### Validation Service Pattern

```python
# src/services/validation_service.py
"""LLM-based answer validation for complex exercise types.

Validate open-ended answers for Sentence Construction and Dialogue Completion
where multiple valid responses exist.
"""

from __future__ import annotations

import asyncio
import json
import logging

from langchain_core.messages import HumanMessage, SystemMessage

from src.agent.prompts import (
    ANSWER_VALIDATION_PROMPT,
    ANSWER_VALIDATION_SYSTEM_PROMPT,
)
from src.api.schemas import ValidationRequest, ValidationResponse
from src.utils.llm import get_llm_client

logger = logging.getLogger(__name__)

# Maximum time for LLM validation call
VALIDATION_TIMEOUT_SECONDS = 3


class ValidationService:
    """Service for LLM-based answer validation."""

    async def validate_answer(
        self,
        request: ValidationRequest,
    ) -> ValidationResponse:
        """Validate a user's answer using LLM evaluation.

        Args:
            request: Validation request with question, user_answer,
                     correct_answer, and exercise_type.

        Returns:
            ValidationResponse with is_correct, explanation, alternatives.

        Raises:
            TimeoutError: If LLM call exceeds 3 seconds.
            ValueError: If LLM response cannot be parsed.
        """
        prompt_text = ANSWER_VALIDATION_PROMPT.format(
            exercise_type=request.exercise_type.value,
            question=request.question,
            correct_answer=request.correct_answer,
            user_answer=request.user_answer,
        )

        llm = get_llm_client()
        messages = [
            SystemMessage(content=ANSWER_VALIDATION_SYSTEM_PROMPT),
            HumanMessage(content=prompt_text),
        ]

        try:
            response = await asyncio.wait_for(
                llm.ainvoke(messages),
                timeout=VALIDATION_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            logger.error(
                "Answer validation timed out after %ds",
                VALIDATION_TIMEOUT_SECONDS,
            )
            raise TimeoutError(
                f"Answer validation exceeded {VALIDATION_TIMEOUT_SECONDS}s time limit"
            )

        content = (
            response.content
            if isinstance(response.content, str)
            else str(response.content)
        )

        return self._parse_validation_response(content, request)

    def _parse_validation_response(
        self,
        content: str,
        request: ValidationRequest,
    ) -> ValidationResponse:
        """Parse LLM response into ValidationResponse.

        Falls back to exact-match comparison if parsing fails.

        Args:
            content: Raw LLM response text.
            request: Original validation request for fallback.

        Returns:
            Parsed ValidationResponse.
        """
        # Strip markdown code blocks if present
        text = content.strip()
        if text.startswith("```"):
            first_newline = text.index("\n") if "\n" in text else len(text)
            text = text[first_newline + 1:]
            if text.rstrip().endswith("```"):
                text = text.rstrip()[:-3].rstrip()

        try:
            parsed = json.loads(text)
            return ValidationResponse(
                is_correct=bool(parsed.get("is_correct", False)),
                explanation=str(parsed.get("explanation", "")),
                alternatives=list(parsed.get("alternatives", [])),
            )
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            logger.warning("Failed to parse LLM validation response: %s", e)
            # Fallback: exact-match comparison
            is_correct = (
                request.user_answer.strip().lower()
                == request.correct_answer.strip().lower()
            )
            return ValidationResponse(
                is_correct=is_correct,
                explanation=(
                    "Your answer matches the expected answer."
                    if is_correct
                    else f"The expected answer is: {request.correct_answer}"
                ),
                alternatives=[],
            )
```

### LLM Validation Prompt

```python
# Add to src/agent/prompts.py

ANSWER_VALIDATION_SYSTEM_PROMPT = """\
You are an expert Chinese language evaluator for the 當代中文課程 \
(A Course in Contemporary Chinese) textbook series. Your task is to evaluate \
whether a student's answer to a Chinese language exercise is correct, even if \
it differs from the provided answer key.

CRITICAL RULES:
- Consider semantic equivalence, not just exact string matching
- For Sentence Construction: accept valid alternative word orderings that are \
grammatically correct and convey the same meaning
- For Dialogue Completion: accept responses that are contextually appropriate \
and grammatically correct, even if different from the answer key
- Always provide a brief educational explanation
- List 1-3 alternative valid answers when they exist
- Respond ONLY with valid JSON, no additional text
"""

ANSWER_VALIDATION_PROMPT = """\
Evaluate the following student answer for a {exercise_type} exercise.

## Question
{question}

## Expected Answer (from answer key)
{correct_answer}

## Student's Answer
{user_answer}

## Evaluation Criteria
For {exercise_type}:
- Is the student's answer grammatically correct?
- Does it convey the same meaning as the expected answer?
- Is it a valid response to the question, even if different from the key?

## Required Output Format
Return ONLY a JSON object with this exact structure:
{{
  "is_correct": true or false,
  "explanation": "Brief explanation of why the answer is correct or incorrect (1-2 sentences)",
  "alternatives": ["alt1", "alt2"]
}}

- "is_correct": true if the student's answer is a valid response, false otherwise
- "explanation": educational feedback for the student
- "alternatives": list of 1-3 other valid answers (may include the answer key if different from student's answer). Empty list if no alternatives exist.
"""
```

### Pydantic Schemas

```python
# Add to src/api/schemas.py

class ValidationExerciseType(str, Enum):
    """Exercise types that require LLM validation."""

    SENTENCE_CONSTRUCTION = "sentence_construction"
    DIALOGUE_COMPLETION = "dialogue_completion"


class ValidationRequest(BaseModel):
    """Answer validation request for complex exercise types."""

    question: str = Field(
        ..., min_length=1, description="The original question text"
    )
    user_answer: str = Field(
        ..., min_length=1, description="The user's submitted answer"
    )
    correct_answer: str = Field(
        ..., min_length=1, description="The correct answer from the answer key"
    )
    exercise_type: ValidationExerciseType = Field(
        ..., description="Must be 'sentence_construction' or 'dialogue_completion'"
    )


class ValidationResponse(BaseModel):
    """Answer validation response from LLM evaluation."""

    is_correct: bool = Field(
        ..., description="Whether the user's answer is valid"
    )
    explanation: str = Field(
        ..., description="Educational explanation of the evaluation"
    )
    alternatives: list[str] = Field(
        default_factory=list,
        description="Alternative valid answers (1-3 items)",
    )
```

### File Structure

```
dangdai-api/
├── src/
│   ├── agent/
│   │   └── prompts.py                  # MODIFY: add ANSWER_VALIDATION_SYSTEM_PROMPT, ANSWER_VALIDATION_PROMPT
│   ├── api/
│   │   ├── schemas.py                  # MODIFY: add ValidationExerciseType, ValidationRequest, ValidationResponse
│   │   └── routes/
│   │       └── quizzes.py              # MODIFY: add POST /api/quizzes/validate-answer route
│   └── services/
│       └── validation_service.py       # CREATE: LLM-based answer validation service
└── tests/
    ├── test_api.py                     # MODIFY: add validation endpoint integration tests
    ├── test_schemas.py                 # MODIFY: add validation schema tests
    └── test_validation_service.py      # CREATE: validation service unit tests
```

### Anti-Patterns to Avoid

1. **DO NOT** use the LangGraph graph for validation — this is a simple single LLM call, not a multi-step graph. Use `llm.ainvoke()` directly in the service.
2. **DO NOT** accept all exercise types — only `sentence_construction` and `dialogue_completion` require LLM validation. Reject others with 400.
3. **DO NOT** create a new LLM client — reuse `get_llm_client()` singleton from `src/utils/llm.py`.
4. **DO NOT** use a different auth mechanism — reuse `get_current_user` dependency from `src/api/dependencies.py`.
5. **DO NOT** wrap the response in an envelope — return `{"is_correct": ..., "explanation": ..., "alternatives": [...]}` directly.
6. **DO NOT** use `temperature=0.7` for validation — validation should be deterministic. Override with `temperature=0.1` or `0.0` on the LLM call (use `llm.bind(temperature=0.1)` or pass as kwarg to `ainvoke`).
7. **DO NOT** silently swallow LLM errors — log them and either fall back to exact-match or return 500.
8. **DO NOT** modify the existing `VALIDATION_PROMPT` in `prompts.py` — that's for quiz self-check validation (different purpose). Create new `ANSWER_VALIDATION_PROMPT` and `ANSWER_VALIDATION_SYSTEM_PROMPT`.
9. **DO NOT** add new graph nodes to `nodes.py` or `graph.py` — the architecture mentions `validate_answer` as a node name, but for this endpoint a standalone service call is simpler and more appropriate (no state management needed).
10. **DO NOT** add new environment variables — the existing `LLM_API_KEY` and `LLM_MODEL` are sufficient.

### Dependencies on Other Stories

- **Depends on:** Story 4.1 (quiz generation API) — IN REVIEW (provides auth, schemas, LLM client, prompts infrastructure)
- **Depends on:** Story 1.2 (Python backend scaffold) — DONE
- **Depends on:** Story 1.6 (Azure deployment) — DONE (will need redeployment after this story)
- **Enables:** Story 4.6 (Sentence Construction exercise type on mobile) — needs this endpoint for hybrid validation
- **Enables:** Story 4.7 (Dialogue Completion exercise type on mobile) — needs this endpoint for hybrid validation

### Testing Approach

```bash
# Run all tests
make test

# Run validation-specific tests
pytest tests/test_validation_service.py -v --tb=short
pytest tests/test_api.py -k "validate" -v --tb=short
pytest tests/test_schemas.py -k "validation" -v --tb=short

# Run with coverage
pytest tests/ --cov=src --cov-report=term-missing

# Type checking
mypy src/ --strict

# Linting
ruff check src/ tests/
ruff format --check src/ tests/
```

**Key test scenarios:**

1. Valid sentence_construction request → 200 with `is_correct: true`, explanation, alternatives
2. Valid dialogue_completion request → 200 with `is_correct: false`, explanation, alternatives
3. Invalid exercise_type (`vocabulary`) → 400 Bad Request
4. Empty `user_answer` field → 400 (Pydantic validation)
5. Missing JWT → 401 Unauthorized
6. Expired JWT → 401 Unauthorized
7. LLM timeout (>3s) → 504 Gateway Timeout
8. LLM returns unparseable response → fallback to exact-match, still returns 200
9. LLM invocation error → 500 Internal Server Error
10. Exact match of user_answer to correct_answer → 200 with `is_correct: true` (fast path possible)

**Mock patterns:**

```python
# Mock LLM for unit tests
from unittest.mock import AsyncMock, patch

@patch("src.services.validation_service.get_llm_client")
async def test_validate_correct_answer(mock_llm):
    mock_response = AsyncMock()
    mock_response.content = json.dumps({
        "is_correct": True,
        "explanation": "Your answer is correct.",
        "alternatives": ["alternative1"],
    })
    mock_llm.return_value.ainvoke = AsyncMock(return_value=mock_response)
    # ... test validation service

# Mock timeout for timeout tests
@patch("src.services.validation_service.get_llm_client")
async def test_validate_timeout(mock_llm):
    async def slow_invoke(*args, **kwargs):
        await asyncio.sleep(5)  # Exceeds 3s timeout
    mock_llm.return_value.ainvoke = slow_invoke
    # ... expect TimeoutError
```

### Performance Budget

| Step | Target Latency | Notes |
|------|---------------|-------|
| JWT verification | <50ms | Same as `/generate` endpoint |
| Pydantic validation | <5ms | Schema parsing |
| LLM validation call | 1-2s typical | Claude Sonnet with short prompt |
| Response parsing | <10ms | JSON parse + Pydantic |
| **Total** | **<3s** | Hard timeout at 3 seconds |

**LLM cost per validation:**
- Input: ~300 tokens (prompt + question + answers)
- Output: ~100 tokens (JSON response)
- Estimated cost: ~$0.002 per validation call (Claude Sonnet pricing)
- Validation is only called when user's answer differs from the answer key, so most answers skip this call entirely

### Previous Story Intelligence

**From Story 4.1 (quiz generation API):**
- `src/api/dependencies.py` has `get_current_user` auth dependency — REUSE as-is
- `src/api/schemas.py` has `ExerciseType` enum with all 7 types + mixed — EXTEND with `ValidationExerciseType` (restricted subset)
- `src/agent/prompts.py` has `SYSTEM_PROMPT`, `QUIZ_GENERATION_PROMPT`, `VALIDATION_PROMPT` (quiz self-check), and 7 exercise-type instruction blocks — ADD new `ANSWER_VALIDATION_SYSTEM_PROMPT` and `ANSWER_VALIDATION_PROMPT`
- `src/utils/llm.py` has `get_llm_client()` returning `ChatAnthropic` with `@lru_cache(maxsize=1)` — REUSE singleton
- `src/services/quiz_service.py` uses `asyncio.wait_for()` with 8s timeout — follow same pattern with 3s timeout
- `src/agent/nodes.py` has `_parse_questions_json()` helper that strips markdown code blocks — follow same JSON parsing pattern in validation service
- 83 unit tests passing, ruff zero errors, mypy strict passes
- `pyproject.toml` already has `langchain-core`, `langchain-anthropic`, `pydantic-settings`, `PyJWT` — no new dependencies needed
- `ErrorResponse` model exists in schemas.py — reuse for error documentation
- Route handler pattern: try/except with specific exception types mapped to HTTP status codes

### References

- [Source: epics.md#Story-4.1b] - Story requirements and acceptance criteria
- [Source: architecture.md#API-Communication-Patterns] - `POST /api/quizzes/validate-answer` endpoint specification
- [Source: architecture.md#Answer-Validation-Strategy] - Hybrid validation: local for simple types, LLM for complex types
- [Source: architecture.md#Error-Handling-Strategy] - Error handling patterns, timeout fallback to local validation
- [Source: architecture.md#Project-Structure] - `src/services/validation_service.py`, `src/agent/nodes.py` (validate_answer), `src/api/routes/quizzes.py`
- [Source: prd.md#FR20-FR21] - Dialogue Completion and Sentence Construction exercise types
- [Source: prd.md#NFR15] - LLM API failures display user-friendly error with retry option
- [Source: prd.md#NFR31] - LLM cost per quiz generation under $0.05
- [Source: 4-1-quiz-generation-api-endpoint.md] - Backend state, auth pattern, LLM client, schema structure, test patterns
- [Source: ux-design-specification.md#Exercise-Type-Specific-Interaction-Patterns] - Sentence Construction and Dialogue Completion interaction flows

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (anthropic/claude-sonnet-4-6)

### Debug Log References

None — implementation completed without halts or regressions.

### Completion Notes List

- **Task 1 (Schemas):** Added `ValidationExerciseType` enum (restricted to `sentence_construction`/`dialogue_completion`), `ValidationRequest` (with `min_length=1` on all string fields), and `ValidationResponse` (with `default_factory=list` for `alternatives`) to `src/api/schemas.py`. Pydantic enforces exercise_type restriction returning 422 for invalid types.
- **Task 2 (ValidationService):** Created `src/services/validation_service.py` with `ValidationService.validate_answer()` using `asyncio.wait_for()` with `VALIDATION_TIMEOUT_SECONDS = 3`. Markdown code-block stripping applied before JSON parse. Falls back to exact-match comparison on JSON parse failure.
- **Task 3 (Prompts):** Added `ANSWER_VALIDATION_SYSTEM_PROMPT` and `ANSWER_VALIDATION_PROMPT` to `src/agent/prompts.py`. Distinct from existing `VALIDATION_PROMPT` (quiz self-check). Includes sentence construction word-order and dialogue completion semantic-equivalence evaluation criteria.
- **Task 4 (Route):** Added `POST /api/quizzes/validate-answer` to `src/api/routes/quizzes.py` router. Reuses `get_current_user` auth dependency. Returns flat `ValidationResponse` (no envelope). Handles `TimeoutError` → 504, `Exception` → 500.
- **Task 5 (Timeout):** `asyncio.wait_for()` with 3s limit in service; `asyncio.TimeoutError` caught and re-raised as `TimeoutError`; route converts to HTTP 504. Timeout event logged with `user_id` and `exercise_type` for monitoring.
- **Task 6 (Tests):** Added 45 new tests across 3 files: `tests/test_schemas.py` (validation schema tests), `tests/test_api.py` (API integration tests), `tests/test_validation_service.py` (service unit tests). All 127 tests pass, 1 integration test skipped (requires live LLM). `ruff check` zero errors, `mypy src/ --strict` zero errors.

### Change Log

- Added LLM-based answer validation endpoint for Sentence Construction and Dialogue Completion exercise types (Date: 2026-02-20)

### File List

- `dangdai-api/src/api/schemas.py` (modified — added `ValidationExerciseType`, `ValidationRequest`, `ValidationResponse`)
- `dangdai-api/src/agent/prompts.py` (modified — added `ANSWER_VALIDATION_SYSTEM_PROMPT`, `ANSWER_VALIDATION_PROMPT`)
- `dangdai-api/src/api/routes/quizzes.py` (modified — added `POST /api/quizzes/validate-answer` route)
- `dangdai-api/src/services/validation_service.py` (created — `ValidationService` with LLM call and 3s timeout)
- `dangdai-api/tests/test_schemas.py` (modified — added validation schema tests)
- `dangdai-api/tests/test_api.py` (modified — added `TestValidateAnswerEndpoint` class with 12 tests)
- `dangdai-api/tests/test_validation_service.py` (created — service unit tests and prompt formatting tests)
