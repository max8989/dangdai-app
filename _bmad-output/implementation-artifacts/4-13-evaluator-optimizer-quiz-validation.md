# Story 4.13: Evaluator-Optimizer Quiz Content Validation

Status: in-progress

## Story

As a learner,
I want the quiz generation system to validate that all generated content uses Traditional Chinese characters, correct pinyin diacritics, and question text in my UI language,
So that I always receive pedagogically correct and properly formatted quizzes aligned with the 當代中文課程 textbook.

## Acceptance Criteria

1. **Given** the quiz generation pipeline produces questions
   **When** the questions contain any Simplified Chinese characters (简体字)
   **Then** the content evaluator node detects the violation and triggers regeneration with specific feedback

2. **Given** the quiz generation pipeline produces questions
   **When** the pinyin uses tone numbers (e.g., `ni3`, `xue2`) instead of diacritics (e.g., `nǐ`, `xué`)
   **Then** the content evaluator node detects the violation and triggers regeneration with specific feedback

3. **Given** the quiz generation pipeline produces questions
   **When** the `question_text` field is in Chinese instead of the expected UI language (English)
   **Then** the content evaluator node detects the violation and triggers regeneration with specific feedback

4. **Given** the content evaluator finds violations
   **When** it routes back to the generator
   **Then** the generator receives structured feedback listing each violation (question_id, rule, detail) and self-corrects

5. **Given** the content evaluator has triggered 2 retries and the quiz still fails
   **When** the maximum retry count is reached
   **Then** the pipeline returns the best available result (last generation) rather than failing completely

6. **Given** a quiz is generated with zero violations
   **When** the evaluator checks all 5 rules
   **Then** the quiz passes on the first attempt with no extra latency from retries

7. **Given** the LLM model is configured
   **When** no explicit `LLM_MODEL` env var is set
   **Then** the default model is `gpt-4.1` (upgraded from `gpt-4o`)

## Tasks / Subtasks

- [ ] Task 1: Update graph state definition (AC: #4)
  - [ ] 1.1 Add `evaluator_feedback: str` field to `QuizGenerationState` in `src/agent/state.py`

- [ ] Task 2: Add content evaluation prompts (AC: #1, #2, #3)
  - [ ] 2.1 Add `CONTENT_EVALUATION_SYSTEM_PROMPT` to `src/agent/prompts.py`
  - [ ] 2.2 Add `CONTENT_EVALUATION_PROMPT` template to `src/agent/prompts.py`
  - [ ] 2.3 Prompt must check all 5 rules: Traditional Chinese, pinyin diacritics, question language, curriculum alignment, pedagogical quality
  - [ ] 2.4 Prompt must return structured JSON matching `ContentEvaluation` schema

- [ ] Task 3: Implement evaluate_content node (AC: #1, #2, #3, #4, #5, #6)
  - [ ] 3.1 Add async `evaluate_content` node in `src/agent/nodes.py`
  - [ ] 3.2 Node invokes LLM with evaluation prompt and generated questions
  - [ ] 3.3 Parse structured response (pass/fail with issues list)
  - [ ] 3.4 On failure: set `validation_errors`, `evaluator_feedback`, increment `retry_count`
  - [ ] 3.5 On success: set `quiz_payload` with validated questions
  - [ ] 3.6 Handle LLM errors gracefully (default to pass if evaluator itself fails)

- [ ] Task 4: Update generate_quiz for self-correction (AC: #4)
  - [ ] 4.1 When `evaluator_feedback` exists in state, append it to the LLM prompt
  - [ ] 4.2 Format feedback as "Previous Attempt Failed Evaluation" section with specific issues

- [ ] Task 5: Rename validate_quiz to validate_structure (AC: all)
  - [ ] 5.1 Rename function `validate_quiz` to `validate_structure` in `nodes.py`
  - [ ] 5.2 Update all imports in `graph.py`
  - [ ] 5.3 `validate_structure` no longer sets `quiz_payload` (that moves to `evaluate_content`)

- [ ] Task 6: Update graph topology (AC: all)
  - [ ] 6.1 Add `evaluate_content` node to the graph
  - [ ] 6.2 Edge: `validate_structure` → `evaluate_content`
  - [ ] 6.3 Conditional edge: `evaluate_content` → `generate_quiz` (retry) or `__end__`
  - [ ] 6.4 Remove conditional edge from `validate_structure` (it always flows to `evaluate_content`)
  - [ ] 6.5 Keep `validate_structure` → if structural errors, skip to retry (don't waste an LLM call)

- [ ] Task 7: Upgrade default LLM model (AC: #7)
  - [ ] 7.1 Change `_DEFAULT_OPENAI_MODEL` from `gpt-4o` to `gpt-4.1` in `src/utils/llm.py`

- [ ] Task 8: Update tests (AC: all)
  - [ ] 8.1 Update existing `validate_quiz` tests to use new `validate_structure` name
  - [ ] 8.2 Add unit tests for `evaluate_content` node with mocked LLM
  - [ ] 8.3 Add test for retry with evaluator feedback
  - [ ] 8.4 Add test for evaluator pass on first attempt
  - [ ] 8.5 Verify ruff + mypy pass

## Dev Notes

### Current State (Read Before Coding)

The quiz generation pipeline is fully implemented (Story 4.1) with:
- 4-node graph: `retrieve_content` → `query_weakness` → `generate_quiz` → `validate_quiz`
- Rule-based `validate_quiz` checks structural integrity only
- The `VALIDATION_PROMPT` in `prompts.py` is defined but NEVER used (dead code)
- No programmatic check for Traditional Chinese, pinyin diacritics, or question language
- Default LLM is `gpt-4o`

### Problem Being Solved

The LLM sometimes violates prompt rules despite explicit instructions:
- Generates Simplified Chinese instead of Traditional (e.g., 学习 instead of 學習)
- Uses tone numbers (ni3, xue2) instead of diacritics (nǐ, xué)
- Writes question_text in Chinese instead of English
- These violations pass the current rule-based validation because it only checks structural fields

### Architecture Pattern: Evaluator-Optimizer Loop

Standard LangGraph pattern where:
1. Generator produces output
2. Evaluator grades it against rules
3. If fails: feedback → generator retries with specific corrections
4. Max 2 retries, then return best available

Reference: architecture.md section "Quiz Generation Quality: Evaluator-Optimizer Pattern"

### Updated Graph Flow

```
START → retrieve_content → query_weakness → generate_quiz → validate_structure → evaluate_content → END
                                                ↑                   |                    |
                                                |            (if structural errors)      |
                                                └──────────────────────────(if content evaluation fails & retries ≤ 2)
```

Two retry paths:
1. `validate_structure` finds structural errors → skip evaluator, retry generate directly
2. `evaluate_content` finds content violations → send feedback, retry generate

### Content Evaluation Rules

| Rule | Detection Method | Example Violation |
|------|-----------------|-------------------|
| Traditional Chinese | LLM evaluator checks all Chinese text | 学习 instead of 學習 |
| Pinyin diacritics | LLM evaluator checks all pinyin fields | xue2 instead of xué |
| Question language | LLM evaluator checks question_text | Chinese question text instead of English |
| Curriculum alignment | LLM evaluator verifies chapter content | Testing vocab not in the chapter |
| Pedagogical quality | LLM evaluator checks distractor quality | All distractors obviously wrong |

### Files to Modify

```
dangdai-api/src/
├── agent/
│   ├── state.py          # ADD: evaluator_feedback field
│   ├── prompts.py        # ADD: CONTENT_EVALUATION_SYSTEM_PROMPT, CONTENT_EVALUATION_PROMPT
│   ├── nodes.py          # ADD: evaluate_content node, RENAME: validate_quiz → validate_structure
│   │                     #       UPDATE: generate_quiz to use evaluator_feedback on retry
│   └── graph.py          # UPDATE: new topology with evaluate_content node
└── utils/
    └── llm.py            # UPDATE: default model gpt-4o → gpt-4.1
```

### Performance Budget

- Structure validation: <10ms (rule-based, unchanged)
- Content evaluation: ~1-2s (LLM call, new)
- Total happy path: ~4-7s (within 8s NFR)
- Total with 1 retry: ~8-12s (within 30s service timeout)
- Added cost: ~$0.005 per evaluation call

### Anti-Patterns to Avoid

- **DO NOT** remove or bypass the structural validation node -- it catches free/fast errors
- **DO NOT** use the evaluator for structural checks -- that's wasteful
- **DO NOT** block on evaluator failure -- if the evaluator LLM itself errors, pass the quiz through
- **DO NOT** include full RAG content in the evaluator prompt -- only pass the generated questions
- **DO NOT** change the retry limit -- keep MAX_RETRIES = 2

### Dependencies

- **Depends on:** Story 4.1 (quiz generation pipeline) - DONE
- **Enables:** Higher quality quizzes for all exercise types

### References

- [Source: architecture.md#Quiz-Generation-Quality-Evaluator-Optimizer-Pattern] - Architecture decision
- [Source: architecture.md#Quiz-Generation-Flow] - Updated flow diagram
- [Source: prd.md#NFR27-NFR31] - AI/RAG quality requirements
- [Source: prd.md#NFR1] - 8-second generation time limit
