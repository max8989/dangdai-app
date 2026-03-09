# Story 1.9: Request Cancellation for Backend Endpoints

Status: ready

## Story

As a backend developer,
I want all long-running API endpoints to detect and respect client disconnections,
So that orphaned LangGraph tasks are terminated when users navigate away, preventing resource waste and reducing LLM costs.

## Context

**Problem:** When users navigate away from quiz loading screens (e.g., pressing "back" during quiz generation), the mobile app's `AbortController` cancels the HTTP request client-side, but the backend LangGraph execution continues running for the full duration (~8-60s). This wastes:
- **LLM API costs**: $0.02-0.06 per abandoned quiz (2-4 LLM calls if evaluator triggers retries)
- **Server CPU**: 8-60s of CPU per orphaned task
- **User perception**: Rapid navigation feels unresponsive because the backend queue is processing stale requests

**Solution:** Implement server-side cancellation detection using FastAPI's `Request.is_disconnected()` at key checkpoints (before LLM calls, database queries). When disconnection is detected, raise `asyncio.CancelledError` to terminate execution gracefully.

**Expected Impact:**
- Cost savings: ~70-90% reduction in LLM costs for abandoned requests (~$16/month for 100 users)
- CPU savings: ~90-95% reduction in wasted CPU time
- Transparent to users (client already handles aborts correctly)

## Acceptance Criteria

1. **Given** a client starts quiz generation and immediately navigates away (abort after <1s)
   **When** the backend checks `request.is_disconnected()` before the first LLM call
   **Then** the backend raises `asyncio.CancelledError` and terminates the LangGraph execution without making any LLM calls

2. **Given** a client aborts quiz generation after the first LLM call but before evaluation
   **When** the backend checks `request.is_disconnected()` before the evaluator LLM call
   **Then** the backend terminates execution and logs "Client disconnected, skipping evaluation"

3. **Given** quiz generation completes successfully before client disconnect
   **When** the response is sent back
   **Then** no cancellation occurs and the quiz is returned normally

4. **Given** a client disconnects during answer validation
   **When** the validation service checks `request.is_disconnected()` before the LLM call
   **Then** the backend raises `asyncio.CancelledError` and terminates without calling the LLM

5. **Given** the `/health` endpoint is called
   **When** it returns immediately (<10ms)
   **Then** no disconnection checks are performed (endpoint is too fast to need them)

6. **Given** a backend endpoint raises `asyncio.CancelledError` due to client disconnect
   **When** FastAPI handles the exception
   **Then** no 500 error is logged, and the connection is closed silently (client is already gone)

7. **Given** 100 users generate 10 quizzes/week with 10% cancellation rate
   **When** calculating monthly cost savings
   **Then** the system saves approximately $16/month in LLM costs (400 cancellations × $0.04 avg)

## Tasks / Subtasks

- [ ] Task 1: Update QuizGenerationState schema (AC: #1, #2)
  - [ ] 1.1 Add `request: Request` field to `QuizGenerationState` in `src/agent/state.py`
  - [ ] 1.2 Mark field as optional with `total=False` (existing graphs won't break)

- [ ] Task 2: Update quiz generation endpoint (AC: #1, #2, #6)
  - [ ] 2.1 Add `request: Request` parameter to `generate_quiz` route handler in `src/api/routes/quizzes.py`
  - [ ] 2.2 Pass `request` object to `QuizService.generate_quiz()` method
  - [ ] 2.3 Update `QuizService.generate_quiz()` signature to accept `request: Request`
  - [ ] 2.4 Check `await request.is_disconnected()` BEFORE invoking LangGraph in `quiz_service.py`
  - [ ] 2.5 Raise `asyncio.CancelledError("Client disconnected")` if disconnected
  - [ ] 2.6 Pass `request` object in `graph_input` dict when invoking LangGraph

- [ ] Task 3: Update answer validation endpoint (AC: #4, #6)
  - [ ] 3.1 Add `request: Request` parameter to `validate_answer` route handler in `src/api/routes/quizzes.py`
  - [ ] 3.2 Pass `request` object to `ValidationService.validate_answer()` method
  - [ ] 3.3 Update `ValidationService.validate_answer()` signature to accept `request: Request`
  - [ ] 3.4 Check `await request.is_disconnected()` BEFORE invoking LLM in `validation_service.py`
  - [ ] 3.5 Raise `asyncio.CancelledError("Client disconnected")` if disconnected

- [ ] Task 4: Add disconnection checks to LangGraph nodes (AC: #1, #2)
  - [ ] 4.1 Update `generate_quiz` node in `src/agent/nodes.py` to check `state.get("request")` before LLM call
  - [ ] 4.2 If `request and await request.is_disconnected()`, raise `asyncio.CancelledError("Client disconnected")`
  - [ ] 4.3 Log at INFO level: `"[generate_quiz] Client disconnected, aborting LLM call"`
  - [ ] 4.4 Update `evaluate_content` node to check disconnection before evaluator LLM call
  - [ ] 4.5 Log at INFO level: `"[evaluate_content] Client disconnected, skipping evaluation"`
  - [ ] 4.6 Update `retrieve_content` node to check disconnection before RAG database query
  - [ ] 4.7 Update `query_weakness` node to check disconnection before weakness profile database query

- [ ] Task 5: Add logging for cancellations (AC: #6, #7)
  - [ ] 5.1 In `quiz_service.py`, catch `asyncio.CancelledError` and log at INFO level
  - [ ] 5.2 Log message: `"[QuizService] Quiz generation cancelled by client disconnect (chapter=%d user=%s)"`
  - [ ] 5.3 Re-raise `CancelledError` to let FastAPI handle it (do NOT return 500 error)
  - [ ] 5.4 In `validation_service.py`, catch and log cancellations similarly

- [ ] Task 6: Verify health endpoint unchanged (AC: #5)
  - [ ] 6.1 Confirm `/health` endpoint in `src/api/routes/health.py` has NO cancellation checks
  - [ ] 6.2 Endpoint should remain unchanged (it's instant, no long-running operations)

- [ ] Task 7: Add integration tests (AC: all)
  - [ ] 7.1 Add test in `tests/test_api.py`: Mock disconnected request, verify `CancelledError` raised before LLM call
  - [ ] 7.2 Add test: Quiz generation completes normally when client stays connected
  - [ ] 7.3 Add test: Answer validation cancels when client disconnects before LLM call
  - [ ] 7.4 Add test: Verify logging output for cancelled requests (check log messages)
  - [ ] 7.5 Mock `request.is_disconnected()` to return `True` at different checkpoints

- [ ] Task 8: Update documentation (AC: #7)
  - [ ] 8.1 Add docstring comments to all modified service methods explaining cancellation behavior
  - [ ] 8.2 Update `README.md` in `dangdai-api/` with cancellation architecture section
  - [ ] 8.3 Add curl example for testing cancellation: `curl --max-time 2 /api/quizzes/generate`

- [ ] Task 9: Verify ruff + mypy + tests pass (AC: all)
  - [ ] 9.1 Run `ruff check src/ tests/` - zero errors
  - [ ] 9.2 Run `mypy src/ --strict` - zero errors
  - [ ] 9.3 Run `pytest tests/ -v` - all tests pass
  - [ ] 9.4 Run integration test that simulates client disconnect mid-request

## Dev Notes

### Current State (Read Before Coding)

**Mobile Client (Already Implemented):**
- `lib/api.ts` already uses `AbortController` with timeout for quiz generation (line 86-102)
- When user presses "back" or navigates away, React Native automatically aborts in-flight fetch requests
- The `signal` property on fetch triggers `request.is_disconnected()` on the backend
- **No mobile code changes required** - this story is backend-only

**Backend Current State:**
- `POST /api/quizzes/generate` in `src/api/routes/quizzes.py` (lines 31-124)
- `QuizService.generate_quiz()` in `src/services/quiz_service.py` (lines 29-159)
- LangGraph nodes in `src/agent/nodes.py`: `generate_quiz`, `evaluate_content`, `retrieve_content`, `query_weakness`
- `POST /api/quizzes/validate-answer` in `src/api/routes/quizzes.py` (lines 127-179)
- `ValidationService.validate_answer()` in `src/services/validation_service.py`

**Disconnection Check Locations (Priority Order):**
1. **Before LLM calls** (highest priority - most expensive, ~1-3s + cost):
   - `generate_quiz` node before quiz generation LLM call
   - `evaluate_content` node before evaluator LLM call
   - `validate_answer` service before validation LLM call
2. **Before database queries** (medium priority - ~100-500ms):
   - `retrieve_content` node before RAG pgvector query
   - `query_weakness` node before `question_results` aggregation query
3. **Do NOT check** (too fast, overhead not worth it):
   - After every line of code
   - Inside tight loops
   - In synchronous/fast operations (<10ms)

### Architecture Reference

See `_bmad-output/planning-artifacts/architecture.md` section "Request Cancellation Architecture" (added 2026-02-21) for:
- Full implementation pattern with code examples
- FastAPI `Request.is_disconnected()` API usage
- Cost/performance impact analysis
- Enforcement guidelines

### Key Implementation Notes

**FastAPI Request Object:**
```python
from fastapi import Request

@router.post("/generate")
async def generate_quiz(
    request_body: QuizGenerateRequest,
    user_id: str = Depends(get_current_user),
    request: Request,  # NEW: Add this parameter
) -> QuizGenerateResponse:
    # FastAPI automatically injects the Request object
    return await _quiz_service.generate_quiz(request_body, user_id, request)
```

**Disconnection Check Pattern:**
```python
# In service layer or graph nodes
if request and await request.is_disconnected():
    logger.info("[NodeName] Client disconnected, aborting operation")
    raise asyncio.CancelledError("Client disconnected")

# Proceed with expensive operation
result = await llm.ainvoke(prompt)
```

**Error Handling:**
```python
# In service layer, let CancelledError propagate
try:
    result = await graph.ainvoke(graph_input)
except asyncio.CancelledError:
    logger.info("[Service] Cancelled by client disconnect")
    raise  # Let FastAPI handle it (closes connection silently)
```

**Testing Disconnection:**
```bash
# Simulate client disconnect with curl timeout
curl -X POST http://localhost:8000/api/quizzes/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{"chapter_id": 105, "book_id": 1, "exercise_type": "vocabulary"}' \
  --max-time 2  # Abort after 2 seconds (quiz generation takes ~8s)

# Expected backend logs:
# [generate_quiz] Client disconnected, aborting LLM call
# [QuizService] Quiz generation cancelled by client disconnect (chapter=105 user=...)
```

### Testing Strategy

**Unit Tests:**
- Mock `request.is_disconnected()` to return `True` at each checkpoint
- Verify `asyncio.CancelledError` is raised
- Verify no LLM calls are made after disconnection detected
- Verify logging output contains expected messages

**Integration Tests:**
- Start quiz generation request
- Simulate disconnect by mocking `request.is_disconnected()` after first node
- Verify graph execution terminates early
- Verify no orphaned tasks remain

**Manual Testing:**
- Run backend locally: `uvicorn src.api.main:app --reload --port 8000`
- Use curl with `--max-time 2` to abort mid-request
- Check logs for cancellation messages
- Verify LLM provider (Azure OpenAI) does NOT show abandoned API calls in usage logs

### Cost Savings Calculation

**Assumptions:**
- 100 active users
- 10 quizzes per user per week
- 10% cancellation rate (users exploring, accidental taps, network issues)
- Average cost per abandoned quiz: $0.04 (typically 1-2 LLM calls before abort)

**Monthly Calculations:**
- Total quizzes: 100 users × 10 quizzes/week × 4 weeks = 4,000 quizzes/month
- Cancellations: 4,000 × 10% = 400 cancellations/month
- Cost without cancellation: 400 × $0.04 = **$16/month wasted**
- Cost with cancellation: 400 × ~$0.005 (stopped before first LLM call) = **~$2/month**
- **Savings: ~$14/month (~8% of total LLM budget)**

### Enforcement Checklist

Before marking this story as done, verify:
- ✅ `Request` object passed to all long-running endpoints
- ✅ Disconnection checks BEFORE each LLM call in graph nodes
- ✅ Disconnection checks BEFORE expensive database queries
- ✅ `asyncio.CancelledError` raised immediately when disconnection detected
- ✅ Logging at INFO level for all cancellations
- ✅ FastAPI handles `CancelledError` (do NOT catch in route handlers)
- ✅ No disconnection checks in fast operations (<10ms)
- ✅ Integration tests verify cancellation at multiple checkpoints
- ✅ Manual testing with curl `--max-time` confirms behavior

## Out of Scope

- Client-side changes (mobile app already handles aborts correctly via `AbortController`)
- Cancellation for non-long-running endpoints (e.g., `/health` - too fast to need it)
- Database transaction rollback (LangGraph nodes are read-only except for final quiz save, which is after generation completes)
- Partial result caching (if user re-requests the same quiz, it regenerates from scratch - acceptable for MVP)

## Related Stories

- **Story 4.1**: Quiz Generation API Endpoint (original implementation without cancellation)
- **Story 4.1b**: Answer Validation API Endpoint (original implementation without cancellation)
- **Story 4.13**: Evaluator-Optimizer Quiz Validation (adds extra LLM calls that benefit from cancellation)
- **Story 1.8**: Configurable LLM Provider (defines LLM cost structure that cancellation optimizes)

## References

- Architecture Document: `_bmad-output/planning-artifacts/architecture.md` → "Request Cancellation Architecture"
- FastAPI Request docs: https://fastapi.tiangolo.com/advanced/using-request-directly/
- FastAPI `Request.is_disconnected()`: https://www.starlette.io/requests/#is_disconnected
- Python `asyncio.CancelledError`: https://docs.python.org/3/library/asyncio-exceptions.html#asyncio.CancelledError
