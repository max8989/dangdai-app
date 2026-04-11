# Story 4.17: On-the-Fly AI Exercise Generation — OpenAI gpt-5, Single Call

Status: ready-for-dev

## Story

As a learner,
I want the option to generate a fresh exercise on-demand using AI (alongside the instant premade option),
So that I can get varied, adaptive practice when I don't want to replay a premade exercise — with the fastest, highest-quality model and a single backend call.

## Acceptance Criteria

1. **Given** I am on the Exercise Type Selection screen for a chapter
   **When** the screen loads
   **Then** each exercise type card shows TWO actions: **"Premade"** (instant) and **"Generate with AI"** (~15-20s)
   **And** "Premade" is the default/primary action when a premade exercise exists
   **And** "Generate with AI" is always available regardless of premade availability

2. **Given** I tap "Generate with AI" on an exercise type card
   **When** the request is in flight
   **Then** a loading screen displays with a tips carousel and a visible Cancel button
   **And** the loading screen shows elapsed time or a progress indicator
   **And** the target latency is 15-20 seconds

3. **Given** a generation request is in flight
   **When** I tap Cancel OR navigate back OR the screen unmounts
   **Then** the frontend `AbortController.abort()` is called
   **And** the backend detects the disconnect via FastAPI `Request.is_disconnected()` and aborts the underlying OpenAI call
   **And** no row is written to `premade_exercises` for the cancelled request
   **And** the app returns to the Exercise Type Selection screen silently (no error toast on cancel)

4. **Given** the backend receives `POST /api/exercises/generate { book_id, lesson_id, exercise_type, user_id }`
   **When** it processes the request
   **Then** it makes exactly ONE OpenAI structured-output call to `gpt-5`
   **And** the response schema includes per-question `acceptable_answer_variants[]` and `semantic_rubric` fields for free-text exercise types (sentence_construction, dialogue_completion)
   **And** deterministic rule-based validation runs (traditional Chinese, pinyin diacritics, CJK in question_text, vocab set-membership, grammar coverage)
   **And** on validation success the result is upserted into `premade_exercises` (cache) keyed on (book_id, lesson_id, exercise_type)
   **And** the exercise payload is returned to the mobile client

5. **Given** a generation request fails (timeout, OpenAI API error, validation error, or non-cancel exception)
   **When** the error surfaces to the mobile client
   **Then** the app shows an error toast ("Couldn't generate exercise — please try again")
   **And** pops back to the Exercise Type Selection screen
   **And** does NOT automatically retry

6. **Given** an exercise was successfully generated on-the-fly by a previous user
   **When** another user navigates to the same Exercise Type Selection screen
   **Then** that exercise type shows as available under "Premade" (served from the cached `premade_exercises` row) with no LLM call

7. **Given** the environment variable `LLM_PROVIDER=openai` is set (default)
   **And** `OPENAI_API_KEY` is configured
   **And** `OPENAI_MODEL=gpt-5` is configured
   **When** the backend starts
   **Then** `get_llm()` returns a `ChatOpenAI` instance configured for gpt-5 with `max_tokens=4096`
   **And** `LLM_PROVIDER=azure_openai` still works as a rollback path

8. **Given** the user completes an AI-generated exercise
   **When** answers are validated at runtime
   **Then** validation is entirely local — runtime matches user answers against stored `correct_answer` and `acceptable_answer_variants[]`
   **And** no call is made to `/api/quizzes/validate-answer` (the endpoint is removed)
   **And** exercise results are saved to `question_results` and `exercise_type_progress` using the existing flow

## Tasks / Subtasks

- [ ] **Task 1: Backend — switch default LLM provider to OpenAI gpt-5** (AC: #7)
  - [ ] 1.1 Update `dangdai-api/src/utils/llm_factory.py`: change default `LLM_PROVIDER` to `"openai"`, default `OPENAI_MODEL` to `"gpt-5"`, bump default `max_tokens` to 4096
  - [ ] 1.2 Update `dangdai-api/.env.example`: reorder to put OpenAI section first, set `LLM_PROVIDER=openai`, `OPENAI_MODEL=gpt-5`, `LLM_MAX_TOKENS=4096`, `GENERATION_TIMEOUT_SECONDS=25`, `MAX_RETRIES=0`. Keep Azure OpenAI vars as rollback.
  - [ ] 1.3 Verify `OPENAI_API_KEY` is present in the local `dangdai-api/.env` (user confirmed it is). Document in the story Dev Notes if not.
  - [ ] 1.4 Run existing llm_factory tests with `LLM_PROVIDER=openai`; add a test for the new default.

- [ ] **Task 2: Backend — single-call generation prompt with baked-in validation metadata** (AC: #4)
  - [ ] 2.1 Update `dangdai-api/src/agent/prompts.py`: extend `QUIZ_GENERATION_PROMPT` for free-text exercise types (sentence_construction, dialogue_completion) to require per-question fields: `acceptable_answer_variants: list[str]` (3-5 semantically equivalent valid answers) and `semantic_rubric: str` (one-sentence grading rule for edge cases).
  - [ ] 2.2 Update the Pydantic schema used by `llm.with_structured_output(...)` in `dangdai-api/src/agent/nodes.py:generate_quiz` to include the new fields.
  - [ ] 2.3 Confirm the `validate_structure` node still runs rule-based checks; no new LLM call is introduced. Verify the removed `evaluate_content` node is still out of the graph.
  - [ ] 2.4 Update `nodes.py:generate_quiz` to bump `max_tokens` for free-text types that need more headroom (4096).

- [ ] **Task 3: Backend — new `/api/exercises/generate` endpoint with cache-on-success** (AC: #3, #4, #6)
  - [ ] 3.1 Create a new route `dangdai-api/src/api/routes/exercises.py` with `POST /api/exercises/generate`. Accept `{ chapter_id, book_id, exercise_type }` (user extracted from JWT).
  - [ ] 3.2 Wire the endpoint through `quiz_service.py` (or a new `exercise_service.py`) to invoke the LangGraph pipeline in Tier-2 mode for LLM-required types, Tier-1 algorithmic for vocabulary/matching/fill_in_blank (no LLM), mixed for mixed.
  - [ ] 3.3 Pass `request: Request` into the graph state so `request.is_disconnected()` checks run before and after the LLM call. On disconnect, raise `asyncio.CancelledError` and DO NOT write to `premade_exercises`.
  - [ ] 3.4 On successful generation + validation, upsert the result into `premade_exercises` via `content_repo.py` with key `(book_id, lesson_id, exercise_type)`. Use Supabase upsert with `on_conflict` so repeat generations overwrite.
  - [ ] 3.5 Enforce `GENERATION_TIMEOUT_SECONDS=25` via `asyncio.wait_for`; on timeout return 504.
  - [ ] 3.6 Return the exercise payload in the same JSONB shape that `premade_exercises.content` uses (so the mobile adapter is identical for both paths).
  - [ ] 3.7 Register the route in `src/api/main.py`.

- [ ] **Task 4: Backend — remove `/api/quizzes/validate-answer` and its service** (AC: #8)
  - [ ] 4.1 Delete the `POST /api/quizzes/validate-answer` handler from `dangdai-api/src/api/routes/quizzes.py`.
  - [ ] 4.2 Delete or gut `dangdai-api/src/services/validation_service.py` (keep the file with a deprecation note if other modules import it; else delete).
  - [ ] 4.3 Delete/prune related schemas in `src/api/schemas.py`.
  - [ ] 4.4 Remove related prompts from `src/agent/prompts.py` (answer-validation prompt templates).
  - [ ] 4.5 Remove tests for the validate-answer endpoint.

- [ ] **Task 5: Mobile — Exercise Type Selection UI adds "Generate with AI" action** (AC: #1)
  - [ ] 5.1 Open `dangdai-mobile/app/chapter/[chapterId]/exercises.tsx`. For each exercise type card, add a secondary "Generate with AI (~15-20s)" action alongside the existing Premade action.
  - [ ] 5.2 Visually differentiate: Premade = primary button, Generate-with-AI = secondary/outlined button with a sparkle icon.
  - [ ] 5.3 Tapping "Generate with AI" navigates to `/quiz/ai-loading?bookId=...&chapterId=...&exerciseType=...`.
  - [ ] 5.4 Update tests in `exercises.test.tsx` to assert both actions render on each card.

- [ ] **Task 6: Mobile — AI loading screen with cancellation** (AC: #2, #3, #5)
  - [ ] 6.1 Create `dangdai-mobile/app/quiz/ai-loading.tsx` (or reuse the deprecated `quiz/loading.tsx` — your call, prefer new file to avoid coupling).
  - [ ] 6.2 The screen creates a new `AbortController` in a `useEffect` on mount. Make a `POST /api/exercises/generate` call via `lib/api.ts` passing `signal: controller.signal`.
  - [ ] 6.3 Render a tips carousel + elapsed-time indicator + Cancel button. Tapping Cancel calls `controller.abort()`.
  - [ ] 6.4 On screen unmount (navigation back, hardware back, etc.), `controller.abort()` in the `useEffect` cleanup. This must fire even on iOS swipe-back.
  - [ ] 6.5 On successful response: navigate to the quiz play screen with the returned exercise payload (reuse the premade flow — adapter is the same).
  - [ ] 6.6 On error (including abort): if `error.name === 'AbortError'`, pop silently back to the selection screen. Otherwise show error toast and pop back.
  - [ ] 6.7 Add a new API client method `api.generateExercise(params, { signal })` in `dangdai-mobile/lib/api.ts` that POSTs to `/api/exercises/generate` and threads the AbortSignal through fetch.

- [ ] **Task 7: Mobile — adapter support for the new payload shape** (AC: #4, #8)
  - [ ] 7.1 Verify `dangdai-mobile/lib/premadeExerciseAdapter.ts` handles the payload shape returned by `/api/exercises/generate` — it should match `premade_exercises.content` JSONB exactly.
  - [ ] 7.2 For sentence_construction and dialogue_completion, ensure the adapter passes `acceptable_answer_variants[]` through to `QuizQuestion` so the play screen can use it for local validation.
  - [ ] 7.3 Update `dangdai-mobile/hooks/useAnswerValidation.ts`: replace any remaining `api.validateAnswer()` calls with local matching against `acceptable_answer_variants` (case-insensitive, punctuation-normalized).
  - [ ] 7.4 Delete `api.validateAnswer()` from `lib/api.ts`.

- [ ] **Task 8: Mobile — remove deprecated quiz generation path from UI** (AC: #1)
  - [ ] 8.1 Confirm the deprecated `api.generateQuiz()` (Story 4.16) is no longer referenced from any user-facing screen.
  - [ ] 8.2 The old `app/quiz/loading.tsx` is not navigated to from exercises.tsx (confirmed in 4.16); leave it in place but do not revive it.

- [ ] **Task 9: Terraform — decommission Azure OpenAI, provision OpenAI key as Container App secret** (AC: #7)
  - [ ] 9.1 `terraform/openai.tf` already neutralized — verify it contains only the header comment and no `azurerm_cognitive_*` resources.
  - [ ] 9.2 `terraform/variables.tf` already has new `openai_api_key` (required, sensitive) and `openai_model` (default `gpt-5`) variables — verify and use.
  - [ ] 9.3 Add `openai_api_key = "sk-proj-..."` to `terraform/terraform.tfvars` (use the same key already in `dangdai-api/.env`). Without this, `terraform plan` will fail because the variable has no default.
  - [ ] 9.4 Remove the legacy `llm_api_key` value from `terraform.tfvars` once the deployment is verified on OpenAI (leave it empty or delete the line). The `llm_api_key` variable stays in `variables.tf` with a default of `""` for backward compatibility.
  - [ ] 9.5 Run `terraform plan` — expected diff: destroys `azurerm_cognitive_account.openai`, destroys `azurerm_cognitive_deployment.gpt4o`, adds the `openai-api-key` Container App secret, updates Container App env vars (`LLM_PROVIDER=openai`, `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-5`, `LLM_MAX_TOKENS=4096`, `GENERATION_TIMEOUT_SECONDS=25`, `MAX_RETRIES=0`), removes the old Azure OpenAI env vars.
  - [ ] 9.6 Apply in staging first if possible; verify the Container App comes up healthy on the new env vars before applying to prod.
  - [ ] 9.7 After successful apply + smoke test, the Azure OpenAI resource is destroyed. No further cleanup needed in the Azure Portal.

- [ ] **Task 10: Tests** (AC: all)
  - [ ] 10.1 Python: unit tests for the new `/api/exercises/generate` endpoint — happy path, cancellation, timeout, validation failure, OpenAI API error.
  - [ ] 10.2 Python: test that upsert into `premade_exercises` only happens on success (not on cancel/error).
  - [ ] 10.3 Python: update llm_factory tests to cover the new OpenAI default.
  - [ ] 10.4 Mobile: unit tests for `api.generateExercise()` threading the AbortSignal correctly.
  - [ ] 10.5 Mobile: unit tests for the ai-loading screen — cancel button, back-navigation, unmount cleanup, success-navigation, error toast.
  - [ ] 10.6 Mobile: unit tests for `useAnswerValidation` — matching against `acceptable_answer_variants[]` (case + punctuation normalization).
  - [ ] 10.7 Mobile: update `exercises.test.tsx` to assert both Premade and Generate-with-AI actions render.
  - [ ] 10.8 Run full existing test suite — expect no regressions.
  - [ ] 10.9 Manual smoke test: end-to-end generate-with-AI for at least 2 exercise types on a Book 1 lesson using the real OpenAI API. Verify cache-on-success by reloading the selection screen.

## Dev Notes

### Architectural Context

This story implements the architectural shift described in `architecture.md` update-history entry **2026-04-11**. Read those sections before starting:
- `architecture.md#Exercise-Flow — User Choice at Selection Time` — the new dual-path flow (Premade + On-the-Fly)
- `architecture.md#Endpoints-(Python-Backend)` — new `/api/exercises/generate` endpoint
- `architecture.md#LLM-Provider-Configuration-Architecture` — OpenAI gpt-5 is now the default
- `architecture.md#Enforcement-Guidelines-(Updated-2026-04-11)` — the rules every task in this story must comply with

### Why Single-Call

The previous pipeline made **two** LLM calls per user action: one to generate the exercise, and one (`/api/quizzes/validate-answer`) to validate free-text answers at runtime. Two calls × 4-7s each = 8-14s of latency, even before cache. This story collapses both into **one generation call** that emits the validation rubric inline. At play time, runtime validation is pure local matching against `acceptable_answer_variants[]` — zero network round-trips.

### Cache-on-Generate Semantics

When a user generates an AI exercise and it succeeds, the result is upserted into `premade_exercises` with key `(book_id, lesson_id, exercise_type)`. This means:
- The next user who visits that Exercise Type Selection screen will see that exercise type available as Premade.
- If they also tap "Generate with AI", they'll get a **new** exercise that overwrites the cache entry (upsert).
- Cache is not user-scoped — it's global per (book, lesson, type). This is fine for MVP because exercises are not user-personalized; the adaptive weakness-biasing is applied at generation time but the resulting exercise is still a valid practice set for anyone studying that lesson.

### Existing Files to Modify

```
dangdai-api/
├── src/utils/llm_factory.py                          # MODIFY — default to openai/gpt-5
├── src/agent/nodes.py                                 # MODIFY — generate_quiz emits validation metadata
├── src/agent/prompts.py                               # MODIFY — per-type prompt additions; remove answer-validation prompts
├── src/api/routes/exercises.py                        # CREATE — POST /api/exercises/generate
├── src/api/routes/quizzes.py                          # MODIFY — delete /validate-answer handler
├── src/api/schemas.py                                 # MODIFY — add exercise generation request/response schemas; remove validate-answer
├── src/api/main.py                                    # MODIFY — register new route
├── src/services/validation_service.py                 # DELETE or gut
├── src/repositories/content_repo.py                   # MODIFY — add upsert_premade_exercise() if not present
├── .env.example                                       # MODIFY — reorder to OpenAI first, set gpt-5 default
└── tests/                                             # MODIFY — new tests, remove validate-answer tests

dangdai-mobile/
├── app/chapter/[chapterId]/exercises.tsx              # MODIFY — add "Generate with AI" action to each card
├── app/chapter/[chapterId]/exercises.test.tsx         # MODIFY — assert both actions
├── app/quiz/ai-loading.tsx                            # CREATE — loading screen with AbortController
├── lib/api.ts                                         # MODIFY — add generateExercise(); remove validateAnswer()
├── lib/premadeExerciseAdapter.ts                      # VERIFY — payload shape matches
├── hooks/useAnswerValidation.ts                       # MODIFY — local-only matching against variants
└── __tests__/                                         # MODIFY — new tests
```

### Existing Code Patterns to Reuse

- **AbortController pattern**: `dangdai-mobile/lib/api.ts` already uses AbortController for fetch calls with timeout — thread an external signal through the existing helper.
- **Supabase upsert**: the batch seeding script `dangdai-api/src/scripts/seed_all_premade_exercises.py` already upserts into `premade_exercises`. Reuse its upsert pattern.
- **Request cancellation**: Story 1.9 established the `Request.is_disconnected()` pattern for backend cancellation. Follow the same pattern (`architecture.md#Request-Cancellation-Architecture`).
- **premadeExerciseAdapter**: Story 4.16 wired adapters for all 8 types. The new endpoint returns the identical JSONB shape — no adapter changes should be needed.

### Anti-Patterns to Avoid

- **DO NOT** reintroduce a second LLM call anywhere in the runtime path. All validation metadata is produced at generation time.
- **DO NOT** retry on error. Story 4.17 explicitly specifies single-shot with error-to-user behavior (per product decision: "if open ai fail, just show an error then go back").
- **DO NOT** cache user-scoped. Cache is global per (book, lesson, type).
- **DO NOT** skip the cancellation hookup. The user explicitly called out "make sure to add cancellation token and if a user cancel, make sure to cancel the request."
- **DO NOT** keep `/api/quizzes/validate-answer` alive "just in case" — delete it. The product decision is clear.
- **DO NOT** hardcode `gpt-5` in prompts.py or graph nodes — use `get_llm()` factory.
- **DO NOT** remove the Azure OpenAI provider code from `llm_factory.py` — keep it as a rollback path.

### Dependencies

- **Depends on:** Story 4.15 (hybrid pipeline + generators), Story 4.16 (premade-default exercise flow + adapter for all 8 types), Story 1.9 (request cancellation pattern), Story 1.8 (LLM provider factory)
- **Supersedes:** Real-time use of the old `/api/quizzes/generate` path; `/api/quizzes/validate-answer` is removed
- **Blocks:** None — this is an additive user-facing feature

### Previous Story Intelligence

- 4.16 deprecated `api.generateQuiz()` and kept the quiz loading screen in place. This story introduces a NEW loading screen (`ai-loading.tsx`) specifically for the AI generation path. We do not revive the old `quiz/loading.tsx` because its coupling to the deprecated path is a liability.
- 4.15 left the `validate_structure` node in place as rule-based (not LLM). This story does not change that — we only update what `generate_quiz` emits.
- `OPENAI_API_KEY` is already present in `dangdai-api/.env` (architect verified 2026-04-11). Current `.env` has `LLM_PROVIDER=azure_openai` and `LLM_MODEL=gpt-4o` — these must be updated to `LLM_PROVIDER=openai` and `LLM_MODEL=gpt-5` (or `OPENAI_MODEL=gpt-5`) as part of Task 1. Mobile `.env.example` does not need changes since mobile doesn't call OpenAI directly.
- Product decision on model: **gpt-5** (user confirmed gpt-5 is enabled on the OpenAI account). Cost is not a constraint ("I want good results and the price doesnt matter"). No fallback model needed.
- Terraform: `terraform.tfvars` currently has a legacy `llm_api_key` (the same OpenAI key reused). Task 9 requires adding `openai_api_key = "..."` to `terraform.tfvars` because the new variable has no default. Without it, `terraform plan` fails.

### References

- [Source: architecture.md update-history 2026-04-11] — Architectural shift summary
- [Source: architecture.md#Exercise-Flow-—-User-Choice-at-Selection-Time] — Dual-path flow spec
- [Source: architecture.md#Enforcement-Guidelines-(Updated-2026-04-11)] — Hard rules for this story
- [Source: architecture.md#LLM-Provider-Configuration-Architecture] — OpenAI gpt-5 config
- [Source: prd.md#On-the-Fly-AI-Exercise-Generation-(Story-4.17)] — FR59-FR63
- [Source: 4-15-hybrid-quiz-generation-3-tier.md] — Generator code to reuse
- [Source: 4-16-migrate-all-exercise-types-to-pregenerated-default.md] — Adapter state
- [Source: 1-9-request-cancellation-backend-endpoints.md] — Cancellation pattern
- [Source: 1-8-configurable-llm-provider-azure-openai.md] — Factory to modify

## Dev Agent Record

### Agent Model Used
_(to be filled by dev)_

### Debug Log References
_(to be filled by dev)_

### Completion Notes List
_(to be filled by dev)_

### File List
_(to be filled by dev)_

### Change Log
- 2026-04-11: Story drafted by architect (Winston) based on user request to re-enable on-the-fly AI generation with OpenAI gpt-5 single-call pipeline.
