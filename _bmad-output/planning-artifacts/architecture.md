---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '/home/maxime/repos/dangdai-mobile/_bmad-output/planning-artifacts/prd.md'
  - '/home/maxime/repos/dangdai-mobile/_bmad-output/planning-artifacts/ux-design-specification.md'
  - '/home/maxime/repos/dangdai-mobile/docs/project-requirement.md'
workflowType: 'architecture'
project_name: 'dangdai-app'
user_name: 'Maxime'
date: 'Sat Feb 14 2026'
lastStep: 8
status: 'complete'
completedAt: '2026-02-14'
updatedAt: 'Sat Feb 21 2026'
updateHistory:
  - date: 'Sat Feb 21 2026'
    changes: 'Added Request Cancellation Architecture: Server-side cancellation via FastAPI Request.is_disconnected() to prevent orphaned LangGraph executions when users navigate away during quiz generation. Reduces cost waste by 70-90% on abandoned requests (~$16/month savings). Added enforcement guidelines for all backend endpoints.'
  - date: '2026-02-21'
    changes: 'Added configurable LLM provider architecture with Azure OpenAI GPT-4o as default. Supports switching between Azure OpenAI, OpenAI, and other providers via environment configuration. Updated cost estimates for Azure pricing model.'
  - date: '2026-02-21'
    changes: 'Added Evaluator-Optimizer validation pattern to quiz generation pipeline. LLM-based content evaluator node validates Traditional Chinese compliance, pinyin diacritics, question language, and curriculum alignment. Upgraded default LLM model from gpt-4o to gpt-4.1. Updated graph topology, state definitions, and file structure.'
  - date: '2026-02-20'
    changes: 'Added Tamagui Theme & Animation Architecture section to align with enriched UX Design Specification'
  - date: '2026-02-20'
    changes: 'Major update for PRD v2.0: 50 FRs, 31 NFRs, 7 exercise types, adaptive learning with performance memory, hybrid answer validation, weakness profiles, new data schema (question_results, exercise_type_progress), updated API endpoints, revised project structure, re-validated requirements coverage'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
50 functional requirements across 10 domains:
- User Authentication (FR1-FR6): Email/Apple Sign-In via Supabase
- Content Navigation (FR7-FR10): Open book/chapter browsing
- RAG-Powered Quiz Generation (FR11-FR14): AI-generated via LangGraph with RAG retrieval, validation node, pre-generated explanations
- Exercise Types - 7 MVP Types (FR15-FR22): Vocabulary, Grammar, Fill-in-the-Blank, Matching, Dialogue Completion, Sentence Construction, Reading Comprehension + "Mixed" mode
- Quiz Interaction (FR23-FR26): Immediate feedback with source citations, quiz results, review incorrect answers
- Chapter Assessment (FR27-FR30): Multi-type chapter tests with cumulative review and adaptive generation
- Performance Memory & Adaptive Learning (FR31-FR36): Per-question tracking, weakness profiles, adaptive quiz biasing, weakness dashboard
- Progress Tracking (FR37-FR40): Per-exercise-type scores, chapter completion factoring type coverage, quiz history
- Gamification (FR41-FR45): Points (scaled by difficulty), streaks
- Dashboard & Home (FR46-FR50): Activity summary, weakness summary, quick continue, areas needing review

**Non-Functional Requirements:**
31 NFRs driving architectural decisions:
- Performance: 8s quiz generation (10 questions), 500ms navigation, 3s app launch, 2s weakness profile calculation
- Security: Supabase Auth only, secure API key storage, HTTPS, per-user data isolation
- Reliability: Crash-safe progress, cross-device sync, no empty RAG results for any exercise type
- Integration: Graceful LLM degradation, RAG fallback to broader content
- Localization: 4 UI languages (EN, FR, JP, KR)
- Scalability: 100 concurrent users, ~100 question_results rows/user/week
- AI & RAG Quality: 90%+ curriculum alignment, 90%+ RAG relevance, 30-50% adaptive targeting, workbook format compliance, <$0.05/quiz LLM cost

**Scale & Complexity:**
- Primary domain: Cross-platform Mobile App with Python AI Backend + Adaptive Learning System
- Complexity level: Medium-High (upgraded from Medium due to 7 exercise types, hybrid validation, adaptive learning)
- Estimated architectural components: ~25-30 (mobile app layers + Python API + LangGraph agent + adaptive learning pipeline)

### Technical Constraints & Dependencies

| Layer | Technology | Purpose |
|-------|------------|---------|
| Mobile | React Native + Expo (managed) | Cross-platform app |
| UI Framework | Tamagui + @tamagui/animations-moti | Themed components, spring animations |
| Animation Engine | react-native-reanimated + moti | Off-JS-thread animation driver |
| Sound | expo-av | Quiz feedback sounds |
| Backend (Data) | Supabase (PostgreSQL + Auth) | User data, progress, auth |
| Backend (AI) | Python (FastAPI + LangGraph) | RAG queries, quiz generation |
| Vector Store | Supabase pgvector | Dangdai content embeddings |
| LLM | Azure OpenAI gpt-4o (configurable) | Quiz generation + content evaluation |
| Min iOS | 13.0+ | - |
| Min Android | API 21 (5.0)+ | - |
| Connectivity | Online-only | MVP constraint |

### System Architecture Overview

```
Mobile App (Expo) ──┬──▶ Supabase (Auth, Progress, User Data, Performance Memory)
                    │
                    └──▶ Python Backend (FastAPI + LangGraph)
                              │
                              ├──▶ Supabase pgvector (RAG retrieval by chapter + exercise type)
                              ├──▶ Supabase question_results (weakness profile query)
                              ├──▶ LLM API - Azure OpenAI gpt-4o (quiz generation + complex answer validation)
                              ├──▶ LangGraph Structure Validation Node (rule-based self-check)
                              └──▶ LangGraph Content Evaluator Node (LLM-based quality gate)
```

**Quiz Generation Flow (Detailed) -- Evaluator-Optimizer Pattern:**
```
1. Mobile: POST /api/quizzes { chapter_id, exercise_type, user_jwt }
2. Agent: Verify JWT → Query weakness profile from question_results (aggregation)
3. Agent: RAG retrieve from pgvector filtered by (book, lesson, exercise_type)
4. Agent: LLM (Azure OpenAI gpt-4o) generates quiz with pre-generated explanations, biased 30-50% toward weak areas
5. Agent: Structure validation node (rule-based: correct answers exist, options distinct, required fields)
6. Agent: Content evaluator node (LLM-based: Traditional Chinese compliance, pinyin diacritics, 
          question text in UI language, curriculum alignment, pedagogical quality)
   - If evaluator fails: structured feedback → retry generate_quiz (max 2 retries)
   - Generator receives evaluator feedback to self-correct specific issues
7. Agent: Return structured quiz payload with answer keys + explanations + source citations
8. Mobile: Local validation for simple types (Vocabulary, Grammar, Matching, Fill-in-Blank, Reading)
9. Mobile: LLM call via agent for complex types (Sentence Construction, Dialogue Completion) when answer differs from key
10. Mobile: Save per-question results to question_results + update exercise_type_progress
```

### Cross-Cutting Concerns Identified

1. **Authentication State**: Supabase JWT shared between mobile and Python backend
2. **Progress Persistence**: Real-time sync of quiz answers, chapter progress, streaks, per-question performance memory
3. **Error Handling**: Network failures, LLM timeouts, Python backend errors, RAG insufficient content fallback
4. **Loading States**: Critical for 8-second AI quiz generation via Python backend (progressive loading: show first question ASAP)
5. **Localization**: UI text in 4 languages, Chinese content unchanged
6. **Sound/Haptics**: Consistent feedback patterns across all 7 exercise types
7. **Theme Support**: Light/dark mode with Tamagui semantic tokens, sub-themes (primary/success/error/warning), and interaction state variants
8. **Animation System**: `@tamagui/animations-moti` driver with 5 named spring presets; `AnimatePresence` for conditional rendering; declarative `enterStyle`/`exitStyle`/`pressStyle` props
9. **API Layer**: Mobile ↔ Python backend communication patterns (REST + hybrid validation calls)
10. **Backend Deployment**: Python service hosting strategy
11. **Adaptive Learning Pipeline**: Weakness profile computation → quiz bias → performance tracking → profile update loop
12. **Hybrid Answer Validation**: Local validation for structured answers, LLM validation for open-ended answers (Sentence Construction, Dialogue Completion)
13. **Exercise Type System**: 7 distinct exercise types with type-specific UI interactions, generation prompts, validation rules, and progress tracking
14. **Request Cancellation**: Backend request cancellation when users navigate away from loading states, preventing resource waste and orphaned LangGraph executions

## Starter Template Evaluation

### Primary Technology Domains

This project requires two starter templates:
1. **Mobile App**: Cross-platform React Native with Expo
2. **AI Backend**: Python service for RAG and quiz generation

### Starter Options Evaluated

#### Mobile App Starters

| Option | Template | Recommendation |
|--------|----------|----------------|
| Tamagui Expo Router | `yarn create tamagui@latest --template expo-router` | **Selected** |
| Default Expo Tabs | `npx create-expo-app@latest --template tabs` | Alternative |

#### Python Backend Starters

| Option | Template | Recommendation |
|--------|----------|----------------|
| LangGraph Project | `langgraph new --template=new-langgraph-project-python` | **Selected** |
| Manual Flask Setup | Custom scaffold | Alternative |

### Selected Starters

#### Mobile App: Tamagui Expo Router

**Initialization Command:**
```bash
yarn create tamagui@latest --template expo-router
```

**Architectural Decisions Provided:**
- **Language**: TypeScript (strict mode)
- **Routing**: Expo Router (file-based)
- **UI Framework**: Tamagui with theme tokens
- **Styling**: Tamagui styled() with design tokens
- **Build Tooling**: Metro bundler with @tamagui/metro-plugin
- **Structure**: app/ directory for routes, components/ for UI

#### Python Backend: LangGraph Project

**Initialization Command:**
```bash
pip install -U "langgraph-cli[inmem]"
langgraph new --template=new-langgraph-project-python dangdai-api
```

**Architectural Decisions Provided:**
- **Language**: Python 3.11+
- **Framework**: LangGraph with FastAPI HTTP layer
- **AI Framework**: LangChain integration
- **Structure**: src/ with agent graphs and HTTP routes
- **Config**: Environment-based configuration
- **Observability**: LangSmith-ready

### Implementation Note

Project initialization should be the first implementation task, creating:
1. `dangdai-mobile/` - Mobile application (Tamagui Expo Router)
2. `dangdai-api/` - Python backend (LangGraph)

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data modeling approach (Hybrid)
- State management strategy (TanStack Query + Zustand)
- API communication pattern (REST)
- Python backend hosting (Azure Container Apps)
- Tamagui theme & animation configuration (theme tokens, sub-themes, animation presets)

**Important Decisions (Shape Architecture):**
- Error handling strategy (Retry once + user fallback)
- Authentication flow (Supabase JWT verification in Python)

**Deferred Decisions (Post-MVP):**
- Caching strategy (evaluate after usage patterns emerge)
- CDN for static assets (not needed for MVP scale)

### Data Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Data Modeling** | Hybrid (normalized + aggregates + JSONB) | Normalized `question_results` for fast weakness queries; `quiz_attempts` with JSONB for full quiz replay; cached aggregates on `users` for dashboard; dedicated `exercise_type_progress` for per-type tracking |
| **Database** | Supabase PostgreSQL | Already chosen; handles auth, data, and pgvector |
| **Migrations** | Supabase migrations | Built-in migration system |
| **Weakness Profile** | Computed on request via SQL aggregation | Agent queries `question_results` directly; works at MVP scale (100 users, ~100 rows/user/week); avoids extra materialized table |

**Schema Approach:**
- `users` - Profile + cached aggregates (total_points, current_streak, streak_updated_at)
- `quiz_attempts` - Individual quiz records with JSONB `answers_json` for full quiz replay (includes per-question detail for history display)
- `question_results` - **NEW**: Normalized per-question performance data (user_id, chapter_id, exercise_type, vocabulary_item, grammar_pattern, correct, time_spent_ms, created_at). Indexed on (user_id, exercise_type) and (user_id, vocabulary_item) for fast weakness aggregation. This is the source of truth for the adaptive learning system.
- `exercise_type_progress` - **NEW**: Per exercise type per chapter progress (user_id, chapter_id, exercise_type, best_score, attempts_count, mastered_at). Directly feeds the Exercise Type Selection UI. Chapter mastery requires ≥4 of 7 types attempted with ≥80% average.
- `chapter_progress` - Per-chapter overall completion percentage (calculated from `exercise_type_progress`)
- `daily_activity` - Streak tracking (one row per active day)

**Weakness Profile Query (agent calls via Supabase service key):**
```sql
-- Weak vocabulary items: items with <70% accuracy over last N attempts
SELECT vocabulary_item, exercise_type,
       COUNT(*) FILTER (WHERE correct) AS correct_count,
       COUNT(*) AS total_count,
       ROUND(COUNT(*) FILTER (WHERE correct)::decimal / COUNT(*) * 100) AS accuracy_pct
FROM question_results
WHERE user_id = $1 AND vocabulary_item IS NOT NULL
GROUP BY vocabulary_item, exercise_type
HAVING ROUND(COUNT(*) FILTER (WHERE correct)::decimal / COUNT(*) * 100) < 70
ORDER BY accuracy_pct ASC
LIMIT 20;

-- Weak exercise types: types with <70% accuracy
SELECT exercise_type,
       COUNT(*) FILTER (WHERE correct) AS correct_count,
       COUNT(*) AS total_count,
       ROUND(COUNT(*) FILTER (WHERE correct)::decimal / COUNT(*) * 100) AS accuracy_pct
FROM question_results
WHERE user_id = $1
GROUP BY exercise_type
HAVING ROUND(COUNT(*) FILTER (WHERE correct)::decimal / COUNT(*) * 100) < 70;
```

### State Management (Mobile)

| Decision | Choice | Version | Rationale |
|----------|--------|---------|-----------|
| **Server State** | TanStack Query | v5.x | Handles caching, background sync, optimistic updates for progress data |
| **Local State** | Zustand | v5.x | Lightweight, simple API for quiz state, UI preferences, theme |

**State Domains:**
- **TanStack Query**: User profile, chapter progress, quiz history, leaderboards
- **Zustand**: Current quiz state, selected answers, UI theme, language preference

### API & Communication Patterns

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **API Style** | REST | Simple, well-understood, works great with FastAPI |
| **Mobile → Supabase** | Supabase JS Client | Direct for auth, user data, progress |
| **Mobile → Python** | REST via fetch/axios | Quiz generation endpoints |
| **Auth Token Passing** | Supabase JWT in Authorization header | Python backend verifies JWT with Supabase |

**Endpoints (Python Backend):**
- `POST /api/quizzes/generate` - Generate quiz for chapter + exercise type. Accepts `{ chapter_id, book_id, exercise_type, user_jwt }`. Agent queries weakness profile, retrieves RAG content, generates quiz with pre-generated explanations. Returns structured quiz payload.
- `POST /api/quizzes/validate-answer` - **Hybrid validation endpoint** for complex exercise types (Sentence Construction, Dialogue Completion). Accepts `{ question, user_answer, correct_answer, exercise_type }`. LLM evaluates whether the answer is valid (correct/incorrect + alternative answers shown). Only called when local validation is insufficient.
- `GET /api/health` - Health check

**Answer Validation Strategy (Hybrid):**

| Exercise Type | Validation Method | Latency |
|---------------|-------------------|---------|
| Vocabulary | Local (exact match from answer key) | <100ms |
| Grammar | Local (exact match from answer key) | <100ms |
| Fill-in-the-Blank | Local (exact match from answer key) | <100ms |
| Matching | Local (pair comparison from answer key) | <100ms |
| Reading Comprehension | Local (exact match from answer key) | <100ms |
| Sentence Construction | **LLM via agent** (multiple valid orderings possible) | ~1-3s |
| Dialogue Completion | **LLM via agent** (multiple valid responses possible) | ~1-3s |

For Sentence Construction and Dialogue Completion:
1. Mobile first checks against the pre-generated correct answer locally
2. If the user's answer matches → instant correct feedback
3. If the user's answer differs → call `POST /api/quizzes/validate-answer` for LLM evaluation
4. LLM returns: `{ is_correct: bool, explanation: string, alternatives: string[] }`
5. If `is_correct`: show "Your answer is also valid!" with alternatives
6. If not correct: show correct answer + explanation

**Pre-Generated Explanations:**
Every question in the quiz payload includes a `explanation` field and `source_citation` field, generated by the LLM at quiz creation time. These are displayed on the feedback card after each answer (correct or incorrect). No additional LLM call needed at answer time for explanations.

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Python Hosting** | Azure Container Apps | $200 credit available, serverless with scale-to-zero |
| **IaC** | Terraform | Infrastructure as code for reproducibility |
| **Mobile Distribution** | EAS Build + App Store/Play Store | Standard Expo deployment |
| **CI/CD** | GitHub Actions | Trigger builds on push |

**Azure Architecture:**
```
Azure Resource Group
├── Azure OpenAI Service
│   ├── Resource: dangdai-openai (East US)
│   ├── Deployment: gpt-4o
│   ├── Token Limit: 30K TPM
│   └── Cost: Pay-as-you-go (~$0.02-0.045 per quiz)
│
└── Azure Container Apps
    ├── dangdai-api (Python/LangGraph)
    │   ├── Scale: 0-10 instances
    │   ├── Memory: 1GB
    │   └── CPU: 0.5 vCPU
    └── Environment Variables
        ├── LLM_PROVIDER=azure_openai
        ├── AZURE_OPENAI_API_KEY (from Key Vault)
        ├── AZURE_OPENAI_ENDPOINT
        ├── AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
        ├── AZURE_OPENAI_MODEL=gpt-4o
        ├── SUPABASE_URL
        ├── SUPABASE_SERVICE_KEY (from Key Vault)
        └── LANGSMITH_API_KEY (optional)
```

### Error Handling Strategy

| Scenario | Strategy |
|----------|----------|
| **Quiz Generation Timeout (>8s)** | Retry once automatically, then show "Couldn't generate [Exercise Type] exercise - Try Again" |
| **Network Failure** | Show "Check your connection" with retry button |
| **Auth Error** | Redirect to login |
| **Supabase Sync Failure** | Queue locally, retry on reconnect |
| **RAG Insufficient Content** | Agent falls back to broader chapter content (NFR17). If still insufficient: "Not enough content for [Exercise Type] in this chapter. Try another type." |
| **LLM Validation Timeout (Sentence Construction/Dialogue)** | Fall back to local validation against answer key. Show result without LLM explanation. |
| **Weakness Profile Query Failure** | Generate quiz without adaptive biasing (use random selection). Silent degradation, no user error. |

**Implementation:**
- TanStack Query `retry: 1` for API calls
- Custom error boundary for React components
- Toast notifications for recoverable errors
- Progressive quiz loading: show first question ASAP while remaining generate in background

### Request Cancellation Architecture

This section defines the request cancellation mechanism that prevents resource waste when users navigate away from loading states (e.g., pressing "back" during quiz generation).

#### Problem Statement

**Current Behavior (Without Cancellation):**
1. User initiates quiz generation → Mobile sends `POST /api/quizzes/generate` → Backend starts LangGraph execution
2. User presses "back" button while quiz is loading (< 8 seconds typically)
3. Mobile AbortController cancels the HTTP request (client-side only)
4. Backend LangGraph execution **continues running** for the full duration (~8-60s depending on retries)
5. Backend generates a complete quiz that is never consumed
6. Wasted resources: LLM API calls ($0.02-0.06), CPU, database queries

**Impact:**
- Cost waste: ~$0.02-0.06 per abandoned quiz (2-3 LLM calls if evaluator triggers retries)
- Server load: Orphaned LangGraph tasks accumulate under high user churn
- User perception: Rapid back-and-forth navigation feels unresponsive because backend is still processing previous requests

#### Architecture: Server-Side Cancellation via Request Context

FastAPI provides native request cancellation detection through `Request.is_disconnected()`. When a client aborts an HTTP request (via AbortController), FastAPI automatically marks the request as disconnected. Long-running backend tasks should check this flag periodically and terminate gracefully.

**Design Principle:** All long-running async operations (quiz generation, answer validation) must respect client disconnection by checking `Request.is_disconnected()` at key checkpoints and raising `asyncio.CancelledError` to abort execution.

#### Implementation Pattern (FastAPI + LangGraph)

**Step 1: Pass Request Object to Service Layer**

Modify all endpoint handlers to pass the FastAPI `Request` object to service methods:

```python
# src/api/routes/quizzes.py
from fastapi import Request

@router.post("/generate")
async def generate_quiz(
    request_body: QuizGenerateRequest,
    user_id: str = Depends(get_current_user),
    request: Request,  # NEW: FastAPI request object
) -> QuizGenerateResponse:
    return await _quiz_service.generate_quiz(request_body, user_id, request)
```

**Step 2: Service Layer Checks Disconnection Before Expensive Operations**

Modify service methods to check `request.is_disconnected()` before invoking the LangGraph agent:

```python
# src/services/quiz_service.py
from fastapi import Request
import asyncio

class QuizService:
    async def generate_quiz(
        self,
        params: QuizGenerateRequest,
        user_id: str,
        request: Request,  # NEW: Accept request object
    ) -> QuizGenerateResponse:
        # Check if client disconnected BEFORE starting expensive LangGraph execution
        if await request.is_disconnected():
            logger.info(
                "[QuizService] Client disconnected before graph start (chapter=%d user=%s)",
                params.chapter_id,
                user_id,
            )
            raise asyncio.CancelledError("Client disconnected")
        
        # Invoke graph with cancellation awareness
        result = await asyncio.wait_for(
            self._run_graph_with_cancellation_check(graph_input, request),
            timeout=GENERATION_TIMEOUT_SECONDS,
        )
        # ... rest of method
```

**Step 3: LangGraph Nodes Check Disconnection at Expensive Checkpoints**

Modify LangGraph graph nodes to accept and check the request object at expensive operation boundaries:

```python
# src/agent/state.py (add request to state)
from fastapi import Request

class QuizGenerationState(TypedDict, total=False):
    # ... existing fields ...
    request: Request  # NEW: FastAPI request for cancellation checks

# src/agent/nodes.py
async def generate_quiz(state: QuizGenerationState) -> dict:
    """Generate quiz questions using LLM (cancellation-aware)."""
    request = state.get("request")
    
    # Check disconnection BEFORE expensive LLM call
    if request and await request.is_disconnected():
        logger.info("[generate_quiz] Client disconnected, aborting LLM call")
        raise asyncio.CancelledError("Client disconnected")
    
    # Proceed with LLM generation
    llm = get_llm(temperature=0.7, max_tokens=2048)
    structured_llm = llm.with_structured_output(QuizSchema)
    result = await structured_llm.ainvoke(prompt)
    
    # ... rest of generation logic

async def evaluate_content(state: QuizGenerationState) -> dict:
    """Evaluate quiz content quality (cancellation-aware)."""
    request = state.get("request")
    
    # Check disconnection BEFORE evaluator LLM call
    if request and await request.is_disconnected():
        logger.info("[evaluate_content] Client disconnected, skipping evaluation")
        raise asyncio.CancelledError("Client disconnected")
    
    # Proceed with evaluation
    # ... evaluation logic
```

**Checkpoint Selection Criteria:**
- ✅ Check BEFORE each LLM API call (most expensive operation, ~1-3s + cost)
- ✅ Check BEFORE database queries (for weakness profile, RAG retrieval)
- ❌ Do NOT check inside tight loops or after every line (overhead not worth it)
- ❌ Do NOT check in synchronous/fast operations (<10ms)

**Step 4: Handle CancelledError Gracefully**

Modify service layer to catch `asyncio.CancelledError` and return a cancellation response instead of 500 error:

```python
# src/services/quiz_service.py
try:
    result = await asyncio.wait_for(
        graph.ainvoke(graph_input),
        timeout=GENERATION_TIMEOUT_SECONDS,
    )
except asyncio.CancelledError:
    logger.info(
        "[QuizService] Quiz generation cancelled by client disconnect (chapter=%d user=%s)",
        params.chapter_id,
        user_id,
    )
    # Re-raise so FastAPI can handle it (returns no response to disconnected client)
    raise
except asyncio.TimeoutError:
    # ... existing timeout handling
```

FastAPI automatically handles `asyncio.CancelledError` by closing the response without sending data (client is already gone).

#### Mobile Client Behavior (No Changes Required)

The mobile client already uses `AbortController` for timeouts (see `lib/api.ts:86-102`). This same mechanism triggers server-side disconnection detection:

```typescript
// lib/api.ts (existing code, no changes needed)
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), QUIZ_GENERATION_TIMEOUT_MS)

const response = await fetch(`${API_BASE_URL}/api/quizzes/generate`, {
  signal: controller.signal,  // This triggers is_disconnected() on backend when aborted
})
```

**User Navigation Triggers Abort:**
When the user presses "back" or navigates away from the quiz loading screen, React Native automatically aborts all in-flight fetch requests. The `signal` property ensures the backend detects this via `request.is_disconnected()`.

#### Updated Endpoint Coverage

**All backend endpoints must implement cancellation checks:**

| Endpoint | Expensive Operations | Cancellation Checkpoints |
|----------|---------------------|--------------------------|
| `POST /api/quizzes/generate` | RAG retrieval, weakness profile query, LLM generation (2-4 calls), LLM evaluation (1-2 calls) | Before RAG query, before each LLM call in `generate_quiz` and `evaluate_content` nodes |
| `POST /api/quizzes/validate-answer` | LLM answer validation call | Before LLM call in validation service |
| `GET /health` | None (instant response) | No cancellation checks needed |

#### Cost & Performance Impact

| Metric | Before Cancellation | After Cancellation | Improvement |
|--------|---------------------|-----------------------|-------------|
| **Cost per abandoned quiz** | $0.02-0.06 (full generation) | $0-0.01 (partial, stopped early) | ~70-90% cost savings on cancellations |
| **Server CPU waste** | 8-60s per orphaned task | <1s (stops at first checkpoint) | ~90-95% CPU savings |
| **User experience** | No change (client already aborts) | No change (client already aborts) | Transparent to user |
| **Code overhead** | None | ~3-5 lines per node + 1 state field | Minimal |

**Expected cancellation rate:** ~5-15% of quiz generations (users exploring chapters, accidental taps, network issues).

**Monthly savings estimate (100 active users, 10 quizzes/user/week, 10% cancellation rate):**
- Cancellations per month: 100 × 10 × 4 × 0.10 = 400 cancellations
- Cost savings: 400 × $0.04 (avg) = **~$16/month** (~8% of total LLM budget)

#### Enforcement Guidelines

**All AI Agents implementing backend endpoints MUST:**
1. Accept `Request` object as a parameter in all route handlers for long-running operations (quiz generation, answer validation)
2. Pass `Request` object to service layer methods
3. Add `request: Request` field to LangGraph state definitions
4. Check `await request.is_disconnected()` BEFORE each LLM API call in graph nodes
5. Check `await request.is_disconnected()` BEFORE expensive database queries (RAG, weakness profile)
6. Raise `asyncio.CancelledError` immediately when disconnection is detected
7. Let FastAPI handle `CancelledError` (do NOT catch it in route handlers)
8. Log cancellation events at INFO level for monitoring
9. Never check disconnection in synchronous code or tight loops (use only before async I/O operations)

**Testing cancellation behavior:**
```bash
# Simulate client disconnect mid-request using curl timeout
curl -X POST http://localhost:8000/api/quizzes/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{"chapter_id": 105, "book_id": 1, "exercise_type": "vocabulary"}' \
  --max-time 2  # Abort after 2 seconds (quiz generation takes ~8s)

# Expected backend logs:
# [generate_quiz] Client disconnected, aborting LLM call
# [QuizService] Quiz generation cancelled by client disconnect
```

### Quiz Generation Quality: Evaluator-Optimizer Pattern

This section defines the LLM-based content evaluation architecture that ensures quiz quality beyond structural validation. The pattern follows the standard LangGraph evaluator-optimizer loop where a dedicated evaluator node acts as a quality gate, providing structured feedback to the generator for self-correction on failure.

#### Problem Statement

The quiz generator LLM (even with explicit prompt rules) occasionally:
- Uses Simplified Chinese characters instead of Traditional (繁體字)
- Outputs pinyin with tone numbers (e.g., `ni3 hao3`) instead of diacritics (e.g., `nǐ hǎo`)
- Writes question text in Chinese instead of the expected UI language (English, French, etc.)
- Generates content not aligned with the specified chapter

The existing rule-based `validate_quiz` node only catches **structural** issues (missing fields, duplicate options, correct answer not in options). It cannot detect **linguistic** or **pedagogical** violations.

#### Architecture: Two-Phase Validation

**Phase 1: Structure Validation (rule-based, free, <10ms)**

The existing `validate_structure` node performs:
- Required field checks (`question_text`, `correct_answer`, `exercise_type`)
- Duplicate question detection
- Options distinctness verification
- Correct answer in options (for MC types)
- Explanation presence

**Phase 2: Content Evaluation (LLM-based, ~$0.005, ~1-2s)**

A new `evaluate_content` async node that invokes the LLM as an evaluator/judge:

| Rule | What It Checks | Example Violation |
|------|----------------|-------------------|
| **Traditional Chinese Only** | All Chinese text uses Traditional characters (繁體字), zero Simplified characters (简体字) | `学习` instead of `學習` |
| **Pinyin Diacritics** | All pinyin uses tone marks, never tone numbers or bare Latin | `xue2xi2` instead of `xuéxí` |
| **Question Text Language** | `question_text` field is in the expected UI language (English by default), not in Chinese | `"哪個字對應拼音...?"` instead of `"Which character corresponds to the pinyin...?"` |
| **Curriculum Alignment** | Content comes from the specified book/chapter, not hallucinated vocabulary | Testing `電腦` when it's not in Book 1 Ch 3 |
| **Pedagogical Quality** | Distractors are plausible, explanations are educational, difficulty is appropriate | All distractors are obviously wrong or from unrelated topics |

**Evaluator Output Schema:**

```python
class ContentEvaluation(BaseModel):
    """Structured output from the content evaluator node."""
    passed: bool
    issues: list[ContentIssue]

class ContentIssue(BaseModel):
    """Individual issue found by the evaluator."""
    question_id: str
    rule: Literal[
        "traditional_chinese",
        "pinyin_diacritics",
        "question_language",
        "curriculum_alignment",
        "pedagogical_quality",
    ]
    detail: str  # Human-readable description of the violation
```

#### Updated Graph Topology

```
START → retrieve_content → query_weakness → generate_quiz → validate_structure → evaluate_content → END
                                                ↑                                       |
                                                └──── (if fails & retries ≤ 2) ────────┘
```

**Retry flow:** When `evaluate_content` finds issues, it:
1. Sets `validation_errors` with the evaluator's structured feedback
2. Sets `evaluator_feedback` with a formatted string of all issues
3. Increments `retry_count`
4. Routes back to `generate_quiz` via conditional edge

The `generate_quiz` node, on retry, appends the evaluator feedback to the LLM prompt:
```
## Previous Attempt Failed Evaluation
The following issues were found in your previous generation:
{evaluator_feedback}

Please regenerate the quiz fixing ALL of the above issues.
```

This self-correction mechanism means the generator gets **specific, actionable feedback** rather than blindly retrying.

#### Updated State Definition

```python
class QuizGenerationState(TypedDict, total=False):
    # ... existing fields ...
    
    # NEW: Evaluator feedback for self-correction (set by evaluate_content)
    evaluator_feedback: str
```

#### LLM Model Upgrade

| Setting | Previous | Updated | Rationale |
|---------|----------|---------|-----------|
| Default OpenAI model | `gpt-4o` | `gpt-4.1` | Better instruction-following reduces baseline rule violations, fewer retry loops needed |

Both the generator and evaluator use the same `gpt-4.1` model. The evaluator call is typically smaller (it receives the generated questions, not the full RAG context) so its cost is lower.

#### Cost & Latency Impact

| Metric | Before | After (happy path) | After (1 retry) |
|--------|--------|---------------------|------------------|
| LLM calls per quiz | 1 | 2 | 4 |
| Generation latency | ~3-5s | ~4-7s | ~8-12s |
| Cost per quiz | ~$0.02 | ~$0.025 | ~$0.045 |
| Quality assurance | Structural only | Structural + linguistic + pedagogical | Same with self-correction |

The 8s timeout budget (NFR) still holds for the happy path. For retries, the timeout is extended to 30s at the service level (existing `GENERATION_TIMEOUT_SECONDS`).

#### New Prompts

Two new prompt constants in `src/agent/prompts.py`:

- **`CONTENT_EVALUATION_SYSTEM_PROMPT`**: Sets the LLM as a strict quality evaluator for Chinese language quizzes, with explicit rules for each validation dimension.
- **`CONTENT_EVALUATION_PROMPT`**: Template that receives the generated questions JSON and the evaluation rules, returns the `ContentEvaluation` structured output.

#### Enforcement Guidelines (Updated)

**All AI Agents implementing quiz generation MUST:**
1. Never remove or bypass the `evaluate_content` node
2. Always pass evaluator feedback to the generator on retry
3. Use Azure OpenAI gpt-4o as the default model (configurable via environment variables)
4. Ensure the evaluator prompt checks ALL five rules (Traditional Chinese, pinyin, question language, curriculum, pedagogy)
5. Cap retries at 2 (existing `MAX_RETRIES`) -- after 2 failed evaluations, return the best attempt with a warning flag

### LLM Provider Configuration Architecture

This section defines the configurable LLM provider architecture that allows switching between Azure OpenAI, OpenAI, and other providers without code changes.

#### Provider Strategy Pattern

The backend uses a **provider abstraction layer** to support multiple LLM providers while maintaining consistent quiz generation logic.

**Design Principle:** All LLM calls go through a factory that instantiates the correct provider based on environment configuration. The quiz generation graph is provider-agnostic.

#### Supported Providers

| Provider | Models Available | Primary Use Case |
|----------|------------------|------------------|
| **Azure OpenAI** (Default) | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-4 | Production deployment with Azure credits. Best for Traditional Chinese + structured output. |
| **OpenAI** | gpt-4o, gpt-4-turbo, gpt-4.1, gpt-4o-mini | Development/testing, fallback provider |
| **Custom/Local** | Any LangChain-compatible model | Future extensibility (e.g., Azure AI Phi-4, local models) |

#### Configuration Schema

**Environment Variables (Python Backend):**

```bash
# Provider Selection
LLM_PROVIDER=azure_openai          # Options: "azure_openai", "openai", "custom"

# Azure OpenAI Configuration (when LLM_PROVIDER=azure_openai)
AZURE_OPENAI_API_KEY=<your-key>
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o   # Your deployment name in Azure
AZURE_OPENAI_MODEL=gpt-4o             # Underlying model

# OpenAI Configuration (when LLM_PROVIDER=openai)
OPENAI_API_KEY=<your-key>
OPENAI_MODEL=gpt-4o                   # Options: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-4.1

# Model Parameters (apply to all providers)
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2048
LLM_TOP_P=1.0

# Quiz Generation Settings
MAX_RETRIES=2
GENERATION_TIMEOUT_SECONDS=30
```

#### Default Configuration (Production)

| Setting | Value | Rationale |
|---------|-------|-----------|
| **LLM_PROVIDER** | `azure_openai` | Leverages $200/month Azure credit |
| **AZURE_OPENAI_MODEL** | `gpt-4o` | Best balance of cost, Traditional Chinese quality, structured output reliability |
| **Temperature** | `0.7` | Balanced creativity for diverse questions while maintaining accuracy |
| **Max Tokens** | `2048` | Sufficient for 10-question quiz + explanations + source citations |

#### Cost Analysis by Provider/Model

**Azure OpenAI Pricing (Pay-as-you-go):**

| Model | Input ($/1K tokens) | Output ($/1K tokens) | Est. Cost per Quiz | Quizzes per $200 |
|-------|---------------------|----------------------|--------------------|--------------------|
| **gpt-4o** | $0.0025 | $0.01 | **$0.02-0.045** | ~4,400-10,000 |
| gpt-4o-mini | $0.00015 | $0.0006 | $0.004-0.008 | ~25,000-50,000 |
| gpt-4-turbo | $0.001 | $0.003 | $0.008-0.018 | ~11,000-25,000 |

**OpenAI Pricing (Standard API):**

| Model | Input ($/1K tokens) | Output ($/1K tokens) | Est. Cost per Quiz |
|-------|---------------------|----------------------|--------------------|
| gpt-4o | $0.0025 | $0.01 | $0.02-0.045 |
| gpt-4.1 | $0.0025 | $0.01 | $0.02-0.045 |
| gpt-4o-mini | $0.00015 | $0.0006 | $0.004-0.008 |

**Cost Breakdown (gpt-4o, happy path with 1 retry):**
- Quiz generation: ~800 tokens input (RAG context + weakness profile + prompt), ~1200 tokens output → ~$0.014
- Content evaluator: ~1400 tokens input (questions JSON + rules), ~200 tokens output → ~$0.006
- Retry generation (if needed): ~$0.014
- Retry evaluator (if needed): ~$0.006
- **Total (0 retries)**: ~$0.020
- **Total (1 retry)**: ~$0.040
- **Total (2 retries, max)**: ~$0.060

#### Implementation Pattern (LangChain)

**Factory Function (`src/utils/llm_factory.py`):**

```python
from langchain_openai import AzureChatOpenAI, ChatOpenAI
from langchain_core.language_models import BaseChatModel
import os

def get_llm(temperature: float = 0.7, max_tokens: int = 2048) -> BaseChatModel:
    """
    Factory function to instantiate the correct LLM provider based on environment.
    
    Returns:
        BaseChatModel: Configured LLM instance
        
    Raises:
        ValueError: If LLM_PROVIDER is invalid or required env vars are missing
    """
    provider = os.getenv("LLM_PROVIDER", "azure_openai")
    
    if provider == "azure_openai":
        # Azure OpenAI configuration
        required_vars = [
            "AZURE_OPENAI_API_KEY",
            "AZURE_OPENAI_ENDPOINT",
            "AZURE_OPENAI_DEPLOYMENT_NAME",
        ]
        missing = [var for var in required_vars if not os.getenv(var)]
        if missing:
            raise ValueError(f"Missing Azure OpenAI config: {missing}")
        
        return AzureChatOpenAI(
            azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
            temperature=temperature,
            max_tokens=max_tokens,
            model=os.getenv("AZURE_OPENAI_MODEL", "gpt-4o"),
        )
    
    elif provider == "openai":
        # OpenAI configuration
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("Missing OPENAI_API_KEY")
        
        return ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o"),
            temperature=temperature,
            max_tokens=max_tokens,
        )
    
    else:
        raise ValueError(f"Unsupported LLM_PROVIDER: {provider}")
```

**Usage in Quiz Generation Graph (`src/agent/nodes.py`):**

```python
from src.utils.llm_factory import get_llm

async def generate_quiz(state: QuizGenerationState) -> dict:
    """Generate quiz questions using configured LLM provider."""
    llm = get_llm(temperature=0.7, max_tokens=2048)
    
    # Use llm for generation (provider-agnostic)
    structured_llm = llm.with_structured_output(QuizSchema)
    result = await structured_llm.ainvoke(prompt)
    
    # ... rest of generation logic
```

#### Azure OpenAI Deployment Setup

**Step 1: Create Azure OpenAI Resource**
- Navigate to Azure Portal → Create Resource → Azure OpenAI
- Region: East US (recommended for gpt-4o availability)
- Pricing Tier: Standard

**Step 2: Deploy Model**
- In Azure OpenAI Studio → Deployments → Create New
- Model: `gpt-4o` (latest version)
- Deployment Name: `gpt-4o` (this becomes `AZURE_OPENAI_DEPLOYMENT_NAME`)
- Tokens per Minute Rate Limit: 30K (adjust based on usage)

**Step 3: Get Credentials**
- Keys and Endpoint → Copy Key 1 → Set as `AZURE_OPENAI_API_KEY`
- Copy Endpoint URL → Set as `AZURE_OPENAI_ENDPOINT`

**Step 4: Test Connection**
```bash
curl https://<your-resource>.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-15-preview \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_OPENAI_API_KEY" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

#### Migration Path

**From OpenAI to Azure OpenAI:**
1. Deploy gpt-4o model in Azure OpenAI Studio
2. Update environment variables (set `LLM_PROVIDER=azure_openai`, add Azure credentials)
3. Restart backend service (zero code changes required)
4. Monitor cost in Azure Cost Management (should see $0.02-0.045 per quiz)

**Rollback to OpenAI:**
1. Set `LLM_PROVIDER=openai`
2. Ensure `OPENAI_API_KEY` is set
3. Restart backend service

#### Model Selection Guidelines

**When to use gpt-4o (Azure OpenAI):**
- ✅ Production deployment (default)
- ✅ Traditional Chinese content generation
- ✅ Structured output reliability required
- ✅ Budget allows ~4,400+ quizzes/month

**When to use gpt-4o-mini (Azure OpenAI):**
- ✅ High-volume testing (25K+ quizzes/month)
- ✅ Budget-constrained deployment
- ⚠️ Accept higher retry rates (~15-20% vs ~5-10% for gpt-4o)
- ⚠️ May need prompt tuning for Traditional Chinese reliability

**When to use OpenAI (not Azure):**
- ✅ Development/local testing
- ✅ Azure OpenAI resource not available
- ✅ Accessing gpt-4.1 (not yet in Azure)

#### Monitoring & Observability

**Cost Tracking:**
- Azure Cost Management: Track daily spend by resource
- LangSmith: Log all LLM calls with token counts (optional, requires `LANGSMITH_API_KEY`)
- Custom metrics: Log quiz generation success rate, retry rate, average cost per quiz

**Quality Metrics:**
- Content evaluator pass rate (target: >90% on first attempt)
- Retry rate (target: <10% require 1+ retries)
- User-reported content issues (track via feedback form)

**Alerts:**
- Daily cost exceeds $10 (30% of monthly budget)
- Content evaluator fail rate exceeds 20%
- Quiz generation timeout rate exceeds 5%

#### Enforcement Guidelines

**All AI Agents implementing LLM integration MUST:**
1. Always use `get_llm()` factory function, never instantiate providers directly
2. Never hardcode provider-specific code in graph nodes
3. Support switching providers via environment variables only
4. Default to `azure_openai` provider in production `.env.example`
5. Document all provider-specific environment variables in README
6. Test quiz generation with both Azure OpenAI and OpenAI before deployment
7. Log provider type and model name on each quiz generation for debugging

### Tamagui Theme & Animation Architecture

This section defines the Tamagui configuration layer that all UI components depend on. The UX Design Specification provides the complete visual details; this section captures the **architectural decisions** that prevent implementation conflicts.

#### Animation Driver

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Primary Animation Driver** | `@tamagui/animations-moti` (Reanimated-based) | Runs animations off JS thread for 60fps quiz interactions |
| **Fallback Driver** | `@tamagui/animations-react-native` | Available but not primary |
| **Raw Reanimated** | Only for numeric interpolation | Points count-up requires `useSharedValue` + `withTiming` which Tamagui doesn't handle |

#### Required Dependencies (Mobile)

| Package | Purpose |
|---------|---------|
| `@tamagui/animations-moti` | Animation driver for Tamagui components |
| `react-native-reanimated` | Underlying animation engine (peer dep of moti) |
| `moti` | Peer dependency of @tamagui/animations-moti |
| `expo-av` | Sound playback for quiz feedback |

#### Animation Presets (`tamagui.config.ts`)

All animations use spring physics. Named presets are defined in `createAnimations()` and referenced by name via the `animation` prop on any Tamagui component.

| Preset | Spring Parameters | Usage |
|--------|-------------------|-------|
| `quick` | `damping: 20, stiffness: 250, mass: 1.2` | Button press, micro-interactions, tab switches |
| `bouncy` | `damping: 10, stiffness: 200, mass: 0.9` | Celebration emoji, badges, points counter end-bounce |
| `medium` | `damping: 15, stiffness: 150, mass: 1.0` | Screen transitions, card appearance, question enter/exit |
| `slow` | `damping: 20, stiffness: 60, mass: 1.2` | Background elements, calendar square fill |
| `lazy` | (from defaultConfig) | Skeleton shimmer placeholders |

#### Sub-Theme Architecture

Tamagui sub-themes use `parentTheme_subTheme` naming (e.g., `light_primary`, `dark_primary`). Wrapping a component tree in `<Theme name="primary">` remaps all semantic tokens to that sub-theme's values.

**Required Sub-Themes (must exist for both `light_` and `dark_` parents):**

| Sub-Theme | Purpose | Key Usage |
|-----------|---------|-----------|
| `primary` | Primary action surfaces | CTA buttons via `<Theme name="primary"><Button>`, active tabs |
| `success` | Correct answer context | FeedbackOverlay (correct), completion celebrations |
| `error` | Incorrect answer context | FeedbackOverlay (incorrect), error states |
| `warning` | Caution/hint context | Quiz hints, network warnings |

**Enforcement Rule:** Components MUST use `<Theme name="...">` wrappers for contextual color switching instead of hardcoding `backgroundColor="$success"` on individual elements. This ensures automatic dark mode support and consistent color relationships.

#### Semantic Theme Tokens

Every theme (light, dark) must define the full Tamagui semantic token set. Components reference these tokens (e.g., `$background`, `$color`, `$borderColor`) and Tamagui resolves them based on the active theme.

**Core Tokens (Light Mode Reference):**

| Token | Value | Purpose |
|-------|-------|---------|
| `background` | `#FAFAF9` | Main screen background |
| `backgroundHover` | `#F5F5F4` | Background on hover |
| `backgroundPress` | `#E7E5E4` | Background on press |
| `backgroundFocus` | `#D6D3D1` | Background on focus |
| `backgroundStrong` | `#E7E5E4` | Emphasized background |
| `color` | `#1C1917` | Primary text |
| `colorHover` | `#292524` | Text on hover |
| `colorPress` | `#44403C` | Text on press |
| `borderColor` | `#D6D3D1` | Default borders |
| `borderColorHover` | `#A8A29E` | Border on hover |
| `borderColorFocus` | `#06B6D4` | Border on focus (primary) |
| `placeholderColor` | `#78716C` | Input placeholders |

**Custom Tokens (extends Tamagui standard):**

| Token | Value | Purpose |
|-------|-------|---------|
| `surface` | `#FFFFFF` | Cards, elevated surfaces |
| `colorSubtle` | `#78716C` | Secondary/muted text |

Each semantic color (`success`, `error`, `warning`) requires background/border/text variants for contextual UI (e.g., `successBackground: '#DCFCE7'`, `successBorder: '#BBF7D0'`, `successText: '#166534'`).

**Dark Mode:** All tokens redefined with inverted/adjusted values. Primary shifts to `primaryLight` (`#22D3EE`) for better contrast on dark backgrounds.

#### Declarative Animation Pattern (Enforcement)

**All AI Agents MUST use Tamagui declarative animation props instead of imperative animation code:**

| Prop | Purpose |
|------|---------|
| `enterStyle` | Styles when component mounts (animates FROM these values) |
| `exitStyle` | Styles when component unmounts (animates TO these values) |
| `pressStyle` | Styles while pressed (e.g., `{ scale: 0.98 }`) |
| `hoverStyle` | Styles on hover (web) |
| `focusStyle` | Styles when focused (e.g., `{ borderColor: '$borderColorFocus' }`) |

**`AnimatePresence` is required for:**
- Quiz question transitions (`key={questionIndex}`)
- FeedbackOverlay appearance/disappearance
- CompletionScreen slide-up entrance
- Toast notifications

#### Responsive Pattern (Enforcement)

**Use Tamagui declarative media queries, NOT imperative `Dimensions.get('window')` checks:**

```tsx
// ✅ Correct: Tamagui media props
<Text fontSize={16} $xs={{ fontSize: 14 }}>Question</Text>

// ❌ Wrong: Imperative dimension checks
const isSmall = Dimensions.get('window').width < 375;
```

| Media Query | Condition | Usage |
|-------------|-----------|-------|
| `$xs` | `maxWidth: 660` | Small phones -- tighter spacing, smaller fonts |
| `$sm` | `maxWidth: 800` | Most phones -- primary design target |
| `$gtXs` | `minWidth: 661` | Standard/large phones -- default spacing |

#### `tamagui.config.ts` Structure

This is the central configuration file for the mobile app's theme system:

```
tamagui.config.ts
├── createAnimations()          # Spring presets (quick, bouncy, medium, slow, lazy)
├── createTamagui()
│   ├── themes                  # light, dark + sub-themes (light_primary, dark_primary, etc.)
│   ├── tokens
│   │   ├── color               # Brand colors + semantic variants
│   │   ├── space               # Spacing scale (xs=4, sm=8, md=16, lg=24, xl=32, 2xl=48)
│   │   ├── size                # Component size tokens
│   │   └── radius              # Border radius (sm=8, md=12, full=9999)
│   ├── fonts
│   │   ├── body (Inter)        # Latin UI text
│   │   └── heading (Inter)     # Headings
│   └── media                   # Breakpoints ($xs, $sm, $gtXs from defaultConfig)
```

### Decision Impact Analysis

**Implementation Sequence:**
1. Supabase schema setup (data architecture)
2. Python backend deployment (Azure + Terraform)
3. Mobile app state setup (TanStack Query + Zustand)
4. **Tamagui theme & animation configuration** (tokens, sub-themes, animation presets)
5. API integration layer
6. Error handling patterns

**Cross-Component Dependencies:**
- Supabase JWT → Python backend auth verification
- TanStack Query → REST endpoints → Python backend
- Zustand quiz state → TanStack Query mutations for progress sync
- **Tamagui config → All UI components** (theme tokens, animation presets, sub-themes)

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
18 areas where AI agents could make different choices - all now standardized below (including 6 Tamagui-specific patterns).

### Naming Patterns

**Database Naming Conventions (Supabase/PostgreSQL):**

| Element | Convention | Example |
|---------|------------|---------|
| Tables | snake_case, plural | `users`, `quiz_attempts`, `chapter_progress` |
| Columns | snake_case | `user_id`, `created_at`, `total_points` |
| Foreign keys | `{table}_id` | `user_id`, `chapter_id` |
| Indexes | `idx_{table}_{column}` | `idx_users_email` |
| Constraints | `{table}_{type}_{column}` | `users_pkey`, `quiz_attempts_user_id_fkey` |

**API Naming Conventions (Python/FastAPI):**

| Element | Convention | Example |
|---------|------------|---------|
| Endpoints | Plural, RESTful | `/api/quizzes`, `/api/chapters` |
| Route params | snake_case | `/api/quizzes/{quiz_id}` |
| Query params | snake_case | `?chapter_id=1&book_id=2` |
| Request/Response | snake_case JSON | `{"quiz_id": 1, "chapter_id": 2}` |

**Code Naming Conventions (TypeScript/React Native):**

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase file & export | `QuizCard.tsx`, `export function QuizCard()` |
| Hooks | camelCase with `use` prefix | `useQuizState.ts`, `useAuth.ts` |
| Utilities | camelCase | `formatDate.ts`, `calculateScore.ts` |
| Types/Interfaces | PascalCase | `Quiz`, `UserProgress`, `ChapterData` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_QUIZ_QUESTIONS`, `API_BASE_URL` |
| Zustand stores | `use[Name]Store` | `useQuizStore`, `useUserStore`, `useSettingsStore` |

### Structure Patterns

**Mobile App Organization (Expo Router):**

```
app/
├── (tabs)/                    # Tab navigator group
│   ├── index.tsx              # Home/Dashboard
│   ├── books.tsx              # Book selection
│   ├── progress.tsx           # Progress view
│   └── settings.tsx           # Settings
├── quiz/
│   └── [chapterId].tsx        # Quiz screen (dynamic route)
├── chapter/
│   └── [bookId].tsx           # Chapter list (dynamic route)
├── _layout.tsx                # Root layout
└── +not-found.tsx             # 404 screen

components/
├── quiz/
│   ├── QuizCard.tsx
│   ├── QuizCard.test.tsx      # Co-located test
│   ├── AnswerOption.tsx
│   └── AnswerOption.test.tsx
├── progress/
│   ├── ActivityCalendar.tsx
│   └── ProgressRing.tsx
└── ui/
    ├── Button.tsx
    └── Card.tsx

hooks/
├── useQuizState.ts
├── useAuth.ts
└── useProgress.ts

stores/
├── useQuizStore.ts
├── useUserStore.ts
└── useSettingsStore.ts

lib/
├── supabase.ts               # Supabase client
├── api.ts                    # Python backend API client
└── utils/
    ├── formatDate.ts
    └── calculateScore.ts

types/
├── quiz.ts
├── user.ts
└── chapter.ts
```

**Python Backend Organization (LangGraph):**

```
dangdai-api/
├── src/
│   ├── agent/
│   │   ├── graph.py           # LangGraph quiz generation
│   │   └── prompts.py         # LLM prompts
│   ├── api/
│   │   ├── routes.py          # FastAPI routes
│   │   └── schemas.py         # Pydantic models
│   ├── services/
│   │   ├── quiz_service.py
│   │   └── rag_service.py
│   └── utils/
│       └── supabase.py        # Supabase client
├── tests/
│   ├── test_quiz_generation.py
│   └── test_api.py
├── langgraph.json
└── pyproject.toml
```

### Format Patterns

**API Response Format:**

```python
# Success - Direct response with appropriate HTTP status
# 200 OK
{"quiz_id": "abc123", "questions": [...]}

# 201 Created
{"quiz_id": "abc123", "status": "generated"}

# Error - HTTP status code + error body
# 400 Bad Request
{"detail": "Invalid chapter_id"}

# 404 Not Found
{"detail": "Quiz not found"}

# 500 Internal Server Error
{"detail": "Quiz generation failed"}
```

**Date/Time Handling:**

| Context | Format | Package |
|---------|--------|---------|
| API responses | ISO 8601 (`2026-02-14T10:30:00Z`) | Native |
| Database storage | `timestamptz` | PostgreSQL |
| UI display | Human-readable | date-fns |
| Relative time | "2 hours ago" | date-fns `formatDistanceToNow` |

```typescript
// Example usage with date-fns
import { format, formatDistanceToNow } from 'date-fns';

// Display: "Feb 14, 2026"
format(new Date(quiz.created_at), 'MMM d, yyyy');

// Display: "2 hours ago"
formatDistanceToNow(new Date(quiz.created_at), { addSuffix: true });
```

### Communication Patterns

**TanStack Query Keys:**

```typescript
// Consistent query key structure: [resource, ...identifiers]
const queryKeys = {
  user: ['user'] as const,
  chapters: (bookId: number) => ['chapters', bookId] as const,
  chapter: (chapterId: number) => ['chapter', chapterId] as const,
  quiz: (quizId: string) => ['quiz', quizId] as const,
  progress: (userId: string) => ['progress', userId] as const,
  exerciseTypeProgress: (chapterId: number) => ['exerciseTypeProgress', chapterId] as const,
  weaknessProfile: (userId: string) => ['weaknessProfile', userId] as const,
  quizHistory: (userId: string) => ['quizHistory', userId] as const,
};
```

**Zustand Store Pattern:**

```typescript
// Standard store structure
interface QuizState {
  // State
  currentQuestion: number;
  answers: Record<number, string>;
  score: number;
  
  // Actions
  setAnswer: (questionIndex: number, answer: string) => void;
  nextQuestion: () => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  currentQuestion: 0,
  answers: {},
  score: 0,
  
  setAnswer: (questionIndex, answer) =>
    set((state) => ({
      answers: { ...state.answers, [questionIndex]: answer },
    })),
  nextQuestion: () =>
    set((state) => ({ currentQuestion: state.currentQuestion + 1 })),
  resetQuiz: () =>
    set({ currentQuestion: 0, answers: {}, score: 0 }),
}));
```

### Process Patterns

**Error Handling:**

```typescript
// TanStack Query error handling
const { data, error, isLoading } = useQuery({
  queryKey: queryKeys.quiz(quizId),
  queryFn: () => api.getQuiz(quizId),
  retry: 1,  // Retry once, then show error
});

// Error display pattern
if (error) {
  return <ErrorCard message="Couldn't load quiz" onRetry={refetch} />;
}
```

**Loading States:**

```typescript
// Loading state pattern
if (isLoading) {
  return <QuizLoadingScreen tip={getRandomTip()} />;
}

// Skeleton pattern for lists
if (isLoading) {
  return <ChapterListSkeleton count={5} />;
}
```

### Enforcement Guidelines

**All AI Agents MUST:**

1. Use snake_case for all database tables, columns, and API JSON fields
2. Use PascalCase for React components, camelCase for hooks/utilities
3. Co-locate tests with their source files (`.test.tsx` suffix)
4. Use `use[Name]Store` naming for all Zustand stores
5. Return direct responses with proper HTTP status codes (no envelope)
6. Use ISO 8601 for API dates, date-fns for UI formatting
7. Follow the query key structure: `[resource, ...identifiers]`
8. Use Tamagui theme tokens (`$background`, `$color`, `$borderColor`, etc.) for all colors -- NEVER hardcode hex values in components
9. Use `<Theme name="...">` sub-theme wrappers for contextual color contexts (success, error, primary)
10. Use Tamagui declarative animation props (`enterStyle`, `exitStyle`, `pressStyle`) -- NOT imperative animation code
11. Use `AnimatePresence` for all conditional rendering that requires enter/exit animations
12. Use Tamagui media query props (`$xs`, `$sm`) -- NOT `Dimensions.get('window')` for responsive adjustments
13. Use named animation presets (`animation="quick"`, `animation="bouncy"`) -- NOT inline spring configs

**Pattern Enforcement:**

- ESLint rules for naming conventions
- TypeScript strict mode for type safety
- PR reviews check pattern compliance
- Shared types between frontend and backend via `types/` directory
- Tamagui config validates theme token completeness at build time

### Pattern Examples

**Good Examples:**

```typescript
// ✅ Correct component naming
// File: components/quiz/QuizCard.tsx
export function QuizCard({ question }: QuizCardProps) { ... }

// ✅ Correct hook naming
// File: hooks/useQuizState.ts
export function useQuizState(chapterId: number) { ... }

// ✅ Correct store naming
// File: stores/useQuizStore.ts
export const useQuizStore = create<QuizState>(...);

// ✅ Correct API response
// 200 OK
{ "quiz_id": "abc", "questions": [...] }
```

**Anti-Patterns:**

```typescript
// ❌ Wrong: camelCase component file
// File: components/quiz/quizCard.tsx

// ❌ Wrong: Missing 'use' prefix on store
// export const quizStore = create(...)

// ❌ Wrong: Envelope response
// { "data": {...}, "success": true }

// ❌ Wrong: camelCase in database
// CREATE TABLE quizAttempts (userId INT)

// ❌ Wrong: Separate test folder
// __tests__/components/QuizCard.test.tsx
```

## Project Structure & Boundaries

### Complete Project Directory Structure

#### Mobile App (dangdai-mobile/)

```
dangdai-mobile/
├── README.md
├── package.json
├── tsconfig.json
├── app.json                          # Expo config
├── tamagui.config.ts                 # Tamagui theme configuration
├── metro.config.js                   # Metro bundler config
├── babel.config.js
├── .env.local                        # Local environment variables
├── .env.example                      # Environment template
├── .gitignore
├── eas.json                          # EAS Build configuration
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, type-check, test
│       └── eas-build.yml             # EAS Build triggers
│
├── app/                              # Expo Router (file-based routing)
│   ├── _layout.tsx                   # Root layout (providers, auth check)
│   ├── +not-found.tsx                # 404 screen
│   │
│   ├── (auth)/                       # Auth flow (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── login.tsx                 # Login screen
│   │   └── signup.tsx                # Signup screen
│   │
│   ├── (tabs)/                       # Main tab navigator
│   │   ├── _layout.tsx               # Tab bar configuration
│   │   ├── index.tsx                 # Dashboard/Home (with weakness summary)
│   │   ├── books.tsx                 # Book selection
│   │   ├── progress.tsx              # Progress & calendar view
│   │   └── settings.tsx              # Settings screen
│   │
│   ├── chapter/
│   │   └── [bookId].tsx              # Chapter list for book (with per-type indicators)
│   │
│   ├── exercise-type/
│   │   └── [chapterId].tsx           # Exercise type selection screen
│   │
│   ├── quiz/
│   │   └── [chapterId].tsx           # Quiz screen (handles all 7 exercise types)
│   │
│   └── weakness/
│       └── index.tsx                 # Weakness dashboard screen
│
├── components/
│   ├── quiz/
│   │   ├── QuizCard.tsx              # Question display (handles all exercise types)
│   │   ├── QuizCard.test.tsx
│   │   ├── AnswerOption.tsx          # Answer button
│   │   ├── AnswerOption.test.tsx
│   │   ├── AnswerGrid.tsx            # 2x2 answer layout
│   │   ├── TextInputAnswer.tsx       # Text input for answers
│   │   ├── FeedbackOverlay.tsx       # Correct/incorrect feedback with explanation
│   │   ├── QuizProgress.tsx          # Progress bar
│   │   ├── CompletionScreen.tsx      # Quiz completion with per-type breakdown + weakness update
│   │   ├── MatchingExercise.tsx      # Tap-to-pair matching interaction
│   │   ├── SentenceBuilder.tsx       # Word tile reordering interaction
│   │   ├── DialogueCard.tsx          # Conversation bubble layout
│   │   ├── WordBankSelector.tsx      # Horizontal word bank for fill-in-the-blank
│   │   ├── ReadingPassageCard.tsx    # Scrollable passage + comprehension questions
│   │   └── ExerciseTypeSelector.tsx  # Grid of exercise type cards with per-type progress
│   │
│   ├── progress/
│   │   ├── ActivityCalendar.tsx      # GitHub-style calendar
│   │   ├── ActivityCalendar.test.tsx
│   │   ├── ProgressRing.tsx          # Circular progress indicator
│   │   ├── PointsCounter.tsx         # Animated points display
│   │   └── StreakBadge.tsx           # Current streak display
│   │
│   ├── chapter/
│   │   ├── ChapterListItem.tsx       # Chapter in list (with per-exercise-type indicator dots)
│   │   ├── BookCard.tsx              # Book selection card
│   │   └── ChapterListSkeleton.tsx   # Loading skeleton
│   │
│   ├── dashboard/
│   │   ├── ContinueCard.tsx          # "Continue learning" CTA (last exercise type + chapter)
│   │   ├── StatsRow.tsx              # Points, streak summary
│   │   ├── RecentActivity.tsx        # Recent quiz attempts
│   │   └── WeaknessSummaryCard.tsx   # Weakness summary on dashboard (links to full dashboard)
│   │
│   ├── weakness/
│   │   ├── WeaknessDashboard.tsx     # Full weakness dashboard (vocab, grammar, exercise type accuracy)
│   │   ├── WeakAreaDrillCard.tsx     # Tappable card to launch focused drill
│   │   └── AccuracyBar.tsx           # Horizontal accuracy bar with color levels
│   │
│   ├── ui/                           # Shared UI components (Tamagui)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ErrorCard.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── Toast.tsx
│   │
│   └── auth/
│       ├── LoginForm.tsx
│       ├── SignupForm.tsx
│       └── AppleSignInButton.tsx
│
├── hooks/
│   ├── useAuth.ts                    # Auth state & actions
│   ├── useQuiz.ts                    # Quiz data fetching + generation (TanStack Query)
│   ├── useProgress.ts                # Progress data fetching
│   ├── useChapters.ts                # Chapter list fetching
│   ├── useExerciseTypes.ts           # Exercise type progress per chapter
│   ├── useWeaknessProfile.ts         # Weakness profile data fetching
│   ├── useAnswerValidation.ts        # Local + hybrid LLM answer validation logic
│   └── useSound.ts                   # Sound effect management
│
├── stores/
│   ├── useQuizStore.ts               # Current quiz state (Zustand) - handles all 7 exercise types
│   ├── useUserStore.ts               # User preferences, cached data
│   └── useSettingsStore.ts           # App settings (theme, language)
│
├── lib/
│   ├── supabase.ts                   # Supabase client initialization
│   ├── api.ts                        # Python backend API client
│   ├── queryKeys.ts                  # TanStack Query key definitions
│   ├── queryClient.ts                # Query client configuration
│   └── utils/
│       ├── formatDate.ts             # date-fns helpers
│       ├── calculateScore.ts         # Score calculation
│       └── sounds.ts                 # Sound file references
│
├── types/
│   ├── quiz.ts                       # Quiz, Question, Answer types (all 7 exercise types)
│   ├── exercise.ts                   # ExerciseType enum, ExerciseTypeProgress, MatchingPair, SentenceTile, DialogueBubble
│   ├── weakness.ts                   # WeaknessProfile, WeakVocabItem, WeakGrammarPattern, ExerciseTypeAccuracy
│   ├── user.ts                       # User, Progress types
│   ├── chapter.ts                    # Book, Chapter types
│   └── api.ts                        # API request/response types (including validation endpoint)
│
├── constants/
│   ├── colors.ts                     # Color tokens (from Tamagui)
│   ├── config.ts                     # App configuration
│   └── tips.ts                       # Loading screen tips
│
├── assets/
│   ├── images/
│   │   └── icon.png
│   ├── sounds/
│   │   ├── correct.mp3
│   │   ├── incorrect.mp3
│   │   └── celebration.mp3
│   └── fonts/
│       └── Inter.ttf
│
└── i18n/
    ├── index.ts                      # i18n configuration
    ├── en.json                       # English translations
    ├── fr.json                       # French translations
    ├── ja.json                       # Japanese translations
    └── ko.json                       # Korean translations
```

#### Python Backend (dangdai-api/)

```
dangdai-api/
├── README.md
├── pyproject.toml                    # Python project config (uv/poetry)
├── langgraph.json                    # LangGraph configuration
├── .env                              # Environment variables
├── .env.example
├── .gitignore
├── Dockerfile                        # Container build
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, type-check, test
│       └── deploy.yml                # Azure deployment
│
├── terraform/                        # Infrastructure as Code
│   ├── main.tf                       # Azure Container Apps config
│   ├── variables.tf
│   └── outputs.tf
│
├── src/
│   ├── __init__.py
│   │
│   ├── agent/                        # LangGraph quiz generation
│   │   ├── __init__.py
│   │   ├── graph.py                  # Main quiz generation graph (retrieve → generate → validate_structure → evaluate_content → respond)
│   │   ├── nodes.py                  # Graph nodes (retrieve_content, query_weakness, generate_quiz, validate_structure, evaluate_content)
│   │   ├── prompts.py                # LLM prompt templates (per exercise type + content evaluation + answer validation)
│   │   └── state.py                  # Graph state definitions (includes weakness profile, exercise type, evaluator_feedback)
│   │
│   ├── api/                          # FastAPI routes
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app entry point
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── quizzes.py            # POST /api/quizzes/generate, POST /api/quizzes/validate-answer
│   │   │   └── health.py             # GET /health
│   │   ├── schemas.py                # Pydantic request/response models (quiz payload, validation request/response, exercise types)
│   │   ├── dependencies.py           # FastAPI dependencies (auth, etc.)
│   │   └── middleware.py             # CORS, error handling
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── quiz_service.py           # Quiz business logic (generation orchestration)
│   │   ├── rag_service.py            # RAG retrieval logic (filtered by exercise type)
│   │   ├── weakness_service.py       # Weakness profile query and aggregation from question_results
│   │   ├── validation_service.py     # LLM-based answer validation for complex exercise types
│   │   └── auth_service.py           # Supabase JWT verification
│   │
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── vector_store.py           # pgvector operations (filtered by book, lesson, exercise_type)
│   │   ├── chapter_repo.py           # Chapter content retrieval
│   │   └── performance_repo.py       # Query question_results for weakness profile aggregation
│   │
│   └── utils/
│       ├── __init__.py
│       ├── supabase.py               # Supabase client (service key for agent DB access)
│       ├── llm_factory.py            # LLM provider factory (Azure OpenAI, OpenAI, custom)
│       └── config.py                 # Environment configuration
│
└── tests/
    ├── __init__.py
    ├── conftest.py                   # Pytest fixtures
    ├── test_quiz_generation.py       # Quiz generation tests
    ├── test_rag_retrieval.py         # RAG tests
    └── test_api.py                   # API endpoint tests
```

#### Infrastructure (terraform/)

```
terraform/
├── main.tf                           # Azure provider, resource group
├── openai.tf                         # Azure OpenAI resource provisioning
├── container_apps.tf                 # Azure Container Apps environment
├── key_vault.tf                      # Azure Key Vault for secrets (API keys)
├── variables.tf                      # Input variables
├── outputs.tf                        # Output values (URLs, OpenAI endpoint, etc.)
└── terraform.tfvars.example          # Example variable values
```

#### Environment Configuration Files

**Python Backend `.env.example`:**

```bash
# === LLM Provider Configuration ===
# Options: "azure_openai", "openai"
LLM_PROVIDER=azure_openai

# === Azure OpenAI (when LLM_PROVIDER=azure_openai) ===
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_MODEL=gpt-4o

# === OpenAI (when LLM_PROVIDER=openai) ===
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o

# === LLM Parameters ===
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2048
LLM_TOP_P=1.0

# === Quiz Generation ===
MAX_RETRIES=2
GENERATION_TIMEOUT_SECONDS=30

# === Supabase ===
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# === Observability (Optional) ===
LANGSMITH_API_KEY=your-langsmith-key
LANGSMITH_PROJECT=dangdai-quiz-generation
```

**Mobile App `.env.local.example`:**

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Python Backend API
EXPO_PUBLIC_API_URL=https://dangdai-api.azurecontainerapps.io

# Features
EXPO_PUBLIC_ENABLE_LLM_VALIDATION=true
EXPO_PUBLIC_ENABLE_WEAKNESS_BIASING=true
```

### Architectural Boundaries

**API Boundaries:**

| Boundary | Protocol | Auth |
|----------|----------|------|
| Mobile → Supabase | HTTPS (Supabase JS) | Supabase Auth (JWT) |
| Mobile → Python API | HTTPS REST | Supabase JWT in Authorization header |
| Python API → Supabase | HTTPS (Supabase Python) | Service role key |
| Python API → Azure OpenAI | HTTPS (LangChain AzureChatOpenAI) | Azure OpenAI API key |

**Component Boundaries:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Mobile App (dangdai-app)                                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Screens    │──│  Components  │──│    Stores    │          │
│  │  (app/)      │  │              │  │  (Zustand)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                 │                   │
│         └────────────────┬┴─────────────────┘                   │
│                          │                                      │
│                   ┌──────┴──────┐                               │
│                   │    Hooks    │                               │
│                   │ (TanStack)  │                               │
│                   └──────┬──────┘                               │
│                          │                                      │
│         ┌────────────────┼────────────────┐                     │
│         │                │                │                     │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐             │
│  │ lib/api.ts  │  │lib/supabase │  │   types/    │             │
│  │ (Python)    │  │   (Data)    │  │             │             │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘             │
└─────────┼────────────────┼──────────────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────┐  ┌─────────────────────────────────────────┐
│  Python API     │  │  Supabase                               │
│  (dangdai-api)  │  │  ├── Auth (users, sessions)             │
│  ├── /quizzes   │  │  ├── Database (progress, quiz_attempts) │
│  └── /health    │  │  └── pgvector (Dangdai embeddings)      │
└────────┬────────┘  └─────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  LLM API        │
│  (Claude/GPT)   │
└─────────────────┘
```

**Data Boundaries:**

| Data Type | Storage | Access Pattern |
|-----------|---------|----------------|
| User profile | Supabase `users` | Direct from mobile via Supabase JS |
| Quiz attempts | Supabase `quiz_attempts` | Direct from mobile (write), direct from mobile (read history) |
| Question results | Supabase `question_results` | Direct from mobile (write per-question), Python agent (read for weakness profile) |
| Exercise type progress | Supabase `exercise_type_progress` | Direct from mobile (read/write per exercise type per chapter) |
| Chapter progress | Supabase `chapter_progress` | Direct from mobile (calculated from exercise_type_progress) |
| Weakness profile | Computed from `question_results` | Python agent queries on each quiz generation request |
| Generated quizzes | In-memory (Python) | Generated per request, not persisted |
| Dangdai content | Supabase pgvector | Python backend RAG retrieval (filtered by exercise type) |

### Integration Points

**Internal Communication:**

| From | To | Method |
|------|-----|--------|
| Screen → Store | Zustand hooks | `useQuizStore()` |
| Screen → Server | TanStack Query | `useQuery()`, `useMutation()` |
| Hook → API | Fetch | `lib/api.ts` functions |
| Hook → Supabase | Supabase JS | `lib/supabase.ts` client |

**External Integrations:**

| Service | Purpose | Configuration |
|---------|---------|---------------|
| Supabase | Auth, Database, Vectors | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| LLM API | Quiz generation | `LLM_API_KEY` (via Python backend) |
| EAS | Build & Deploy | `eas.json` |
| Azure | Python backend hosting | Terraform config |
| LangSmith | Observability (optional) | `LANGSMITH_API_KEY` |

**Data Flow (Quiz Generation - Full Adaptive Loop):**

```
1. User selects Chapter 12 → Exercise Type Selection screen loads
   │  Mobile fetches exercise_type_progress for Chapter 12 from Supabase
   │
2. User taps "Matching" (or "Mixed" for AI-selected)
   │
3. Mobile calls POST /api/quizzes/generate {
   │    chapter_id: 12, book_id: 2, exercise_type: "matching"
   │  }  (Authorization: Bearer <supabase_jwt>)
   │
4. Python API verifies JWT → extracts user_id
   │
5. Weakness Service queries question_results for user's weakness profile
   │  (aggregation query: weak vocab items, weak grammar patterns, weak exercise types)
   │
6. RAG Service retrieves Chapter 12 content from pgvector
   │  FILTERED by: book=2, lesson=12, exercise_type="matching"
   │
7. LangGraph generates quiz (gpt-4.1) biased toward weak areas (30-50% of questions)
   │  Each question includes: answer_key, explanation, source_citation
   │
8. Structure Validation Node (rule-based): correct answers exist, options distinct,
   │  required fields present, no duplicates
   │
9. Content Evaluator Node (LLM-based): Traditional Chinese compliance, pinyin diacritics,
   │  question text in UI language, curriculum alignment, pedagogical quality
   │  If evaluation fails → structured feedback → retry generate_quiz (max 2 retries)
   │
10. API returns { quiz_id, exercise_type, questions: [{
    │    question, options, correct_answer, explanation, source_citation, ...
    │  }] }
    │
11. Mobile stores quiz in useQuizStore, renders MatchingExercise component
    │
12. User answers each question:
    │  - Matching/Vocabulary/Grammar/Fill-in-Blank/Reading: LOCAL validation
    │    (compare against answer_key in payload, instant feedback with explanation)
    │  - Sentence Construction/Dialogue Completion: LOCAL check first,
    │    then LLM call via POST /api/quizzes/validate-answer if answer differs from key
    │
13. Per-question: Mobile saves result to question_results via Supabase
    │  { user_id, chapter_id, exercise_type, vocabulary_item, correct, time_spent_ms }
    │
14. On quiz completion, Mobile saves to Supabase:
    │  - quiz_attempts record (with JSONB answers for replay)
    │  - exercise_type_progress update (best_score, attempts_count, mastered_at)
    │  - chapter_progress update (recalculated from exercise_type_progress)
    │  - user aggregates update (points, streak)
    │
15. CompletionScreen shows: score, per-exercise-type breakdown, weakness update
    │
16. TanStack Query invalidates: progress, exercise type progress, weakness profile
```

### Development Workflow Integration

**Local Development:**

```bash
# Terminal 1: Mobile app
cd dangdai-app
yarn install
yarn start  # Expo dev server

# Terminal 2: Python backend
cd dangdai-api
uv sync  # or pip install -e .
uvicorn src.api.main:app --reload --port 8000

# Supabase: Use Supabase cloud or local Docker
```

**Environment Files:**

```bash
# dangdai-mobile/.env.local
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_API_URL=http://localhost:8000  # dev
# EXPO_PUBLIC_API_URL=https://dangdai-api.azurecontainerapps.io  # prod

# dangdai-api/.env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
LLM_API_KEY=sk-...
LANGSMITH_API_KEY=ls-...  # optional
```

**Build & Deployment:**

| Component | Command | Output |
|-----------|---------|--------|
| Mobile (dev) | `yarn start` | Expo Go / dev client |
| Mobile (preview) | `eas build --profile preview` | TestFlight / Internal APK |
| Mobile (prod) | `eas build --profile production` | App Store / Play Store |
| Python (local) | `uvicorn src.api.main:app --reload` | localhost:8000 |
| Python (deploy) | `terraform apply` | Azure Container Apps |

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:**
All technology choices validated as compatible:
- React Native + Expo + Tamagui: First-class integration via @tamagui/metro-plugin
- Tamagui + @tamagui/animations-moti + react-native-reanimated: Official animation driver with off-JS-thread performance
- Tamagui sub-themes + light/dark mode: Built-in `parentTheme_subTheme` convention handles both
- TanStack Query v5 + Zustand v5: Work together for server/local state separation
- Supabase JS + Expo: Official support for React Native
- LangGraph + FastAPI: Built-in HTTP layer support
- Azure Container Apps: Native Python/container support with scale-to-zero

**Pattern Consistency:**
- Database (snake_case) matches API JSON format
- TypeScript naming (PascalCase/camelCase) follows React conventions
- Test co-location aligns with component structure
- Query key structure consistent across all data fetching

**Structure Alignment:**
- Expo Router file structure supports all navigation patterns
- Component organization matches UX specification domains
- Hooks/stores separation reflects state management decisions
- Python backend structure follows LangGraph conventions

### Requirements Coverage Validation

**Functional Requirements Coverage:**
All 50 FRs mapped to architectural components:
- FR1-FR6 (Auth): `app/(auth)/`, `lib/supabase.ts`, `hooks/useAuth.ts`
- FR7-FR10 (Navigation): `app/(tabs)/books.tsx`, `app/chapter/[bookId].tsx`
- FR11-FR14 (RAG Quiz Generation): Python API `agent/graph.py`, `services/rag_service.py`, `services/weakness_service.py`, validation node
- FR15-FR22 (Exercise Types): `app/quiz/[chapterId].tsx`, `components/quiz/` (7 type-specific components), `app/exercise-type/[chapterId].tsx`
- FR23-FR26 (Quiz Interaction): `components/quiz/FeedbackOverlay.tsx` (with pre-generated explanations), `CompletionScreen.tsx`
- FR27-FR30 (Chapter Assessment): `app/quiz/[chapterId].tsx` (chapter test mode), `exercise_type_progress` table, mastery calculation
- FR31-FR36 (Performance Memory & Adaptive): `question_results` table, `services/weakness_service.py`, `hooks/useWeaknessProfile.ts`, `components/weakness/`
- FR37-FR40 (Progress): `hooks/useProgress.ts`, `hooks/useExerciseTypes.ts`, `exercise_type_progress` table
- FR41-FR45 (Gamification): `components/progress/`, Supabase aggregates
- FR46-FR50 (Dashboard): `app/(tabs)/index.tsx`, `components/dashboard/` (with `WeaknessSummaryCard.tsx`), `app/weakness/index.tsx`

**Non-Functional Requirements Coverage:**
All 31 NFRs addressed architecturally:
- Performance: 8s quiz generation with progressive loading, 500ms nav, 3s launch, 2s weakness calc
- Security: Supabase Auth, JWT verification, service keys, per-user data isolation (RLS)
- Reliability: TanStack Query caching, crash-safe progress sync, no empty RAG results, graceful degradation
- Integration: RAG fallback to broader content (NFR17), LLM validation timeout fallback
- Scalability: Azure Container Apps auto-scaling, ~100 question_results rows/user/week
- Localization: i18n folder with 4 language files
- AI & RAG Quality: Two-phase validation (rule-based structure + LLM-based content evaluation), evaluator-optimizer retry loop, exercise-type-specific prompts, Traditional Chinese & pinyin enforcement, workbook format compliance

### Implementation Readiness Validation

**Decision Completeness:**
- All critical decisions documented with specific versions
- Technology rationale provided for each choice
- Integration patterns fully specified

**Structure Completeness:**
- Complete file tree for both mobile and backend
- All directories and key files specified
- Environment configuration documented

**Pattern Completeness:**
- Naming conventions comprehensive with examples
- Good/bad pattern examples provided
- Error handling patterns specified
- State management patterns documented

### Gap Analysis Results

**Critical Gaps:** None

**Important Gaps (Address in implementation):**

| Gap | Resolution |
|-----|------------|
| Database schema details | First migration will define 6 tables (users, quiz_attempts, question_results, exercise_type_progress, chapter_progress, daily_activity) |
| LLM prompt templates per exercise type | 7 distinct prompt templates needed (one per exercise type). Iterate during quiz generation development |
| Content evaluator prompts | `CONTENT_EVALUATION_SYSTEM_PROMPT` and `CONTENT_EVALUATION_PROMPT` need implementation matching the 5-rule evaluation schema |
| LLM validation prompts | Prompts for Sentence Construction and Dialogue Completion answer evaluation |
| Sound asset files | Use placeholder sounds, replace with final |
| Weakness profile query optimization | Start with simple aggregation; add indexes if slow at scale |

**Nice-to-Have (Post-MVP):**
- Storybook component documentation
- E2E testing with Detox/Maestro
- Performance monitoring (Sentry, LangSmith)
- Materialized weakness_profiles table if aggregation queries become slow
- Supabase RPC function for weakness profile (encapsulate SQL)

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Medium-High, 100 users, 7 exercise types, adaptive learning)
- [x] Technical constraints identified (Online-only, iOS 13+, Android 21+)
- [x] Cross-cutting concerns mapped (13 concerns identified including adaptive learning, hybrid validation, exercise type system)

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined (REST, Supabase JS)
- [x] Performance considerations addressed (4-7s quiz gen happy path, evaluator-optimizer retry patterns, 30s timeout budget)

**Implementation Patterns**
- [x] Naming conventions established (snake_case DB, PascalCase components)
- [x] Structure patterns defined (co-located tests, feature folders)
- [x] Communication patterns specified (TanStack Query keys, Zustand stores)
- [x] Process patterns documented (error handling, loading states)

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
1. Clear technology choices with verified compatibility
2. Comprehensive implementation patterns with examples
3. Complete project structure for both mobile and backend (including 7 exercise type components)
4. Full requirements coverage with traceability (50 FRs, 31 NFRs)
5. Well-defined integration boundaries
6. Hybrid answer validation strategy balances UX quality with cost
7. Adaptive learning pipeline fully specified (weakness profile → quiz biasing → performance tracking → profile update)
8. Evaluator-optimizer pattern ensures quiz content quality (Traditional Chinese, pinyin diacritics, question language, curriculum alignment) with self-correcting retry loop

**Areas for Future Enhancement:**
1. Database schema refinement based on usage patterns
2. Caching strategy optimization post-MVP (materialized weakness profiles)
3. E2E testing infrastructure
4. Performance monitoring integration
5. Supabase RPC function for weakness profile aggregation (if direct SQL queries become slow)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and component boundaries
- Refer to this document for all architectural questions
- Use date-fns for all date formatting in UI

**First Implementation Priority:**

```bash
# 1. Initialize Mobile App
yarn create tamagui@latest --template expo-router

# 2. Initialize Python Backend
pip install -U "langgraph-cli[inmem]"
langgraph new --template=new-langgraph-project-python dangdai-api

# 3. Set up Supabase schema
# (Create tables: users, quiz_attempts, question_results, exercise_type_progress, chapter_progress, daily_activity)
# (Add indexes on question_results for weakness profile queries)

# 4. Configure Azure infrastructure
cd terraform && terraform init && terraform plan
```

