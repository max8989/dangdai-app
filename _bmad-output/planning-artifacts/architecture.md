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
updatedAt: '2026-02-20'
updateHistory:
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
| LLM | External API (via LangChain) | Quiz question generation |
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
                              ├──▶ LLM API (quiz generation + complex answer validation)
                              └──▶ LangGraph Validation Node (self-check before response)
```

**Quiz Generation Flow (Detailed):**
```
1. Mobile: POST /api/quizzes { chapter_id, exercise_type, user_jwt }
2. Agent: Verify JWT → Query weakness profile from question_results (aggregation)
3. Agent: RAG retrieve from pgvector filtered by (book, lesson, exercise_type)
4. Agent: LLM generates quiz with pre-generated explanations, biased 30-50% toward weak areas
5. Agent: Self-check validation node (correct answers exist, options distinct, curriculum-aligned)
6. Agent: Return structured quiz payload with answer keys + explanations + source citations
7. Mobile: Local validation for simple types (Vocabulary, Grammar, Matching, Fill-in-Blank, Reading)
8. Mobile: LLM call via agent for complex types (Sentence Construction, Dialogue Completion) when answer differs from key
9. Mobile: Save per-question results to question_results + update exercise_type_progress
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
Azure Container Apps
├── dangdai-api (Python/LangGraph)
│   ├── Scale: 0-10 instances
│   ├── Memory: 1GB
│   └── CPU: 0.5 vCPU
└── Environment Variables
    ├── SUPABASE_URL
    ├── SUPABASE_SERVICE_KEY
    ├── LLM_API_KEY
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
│   │   ├── graph.py                  # Main quiz generation graph (retrieve → generate → validate → respond)
│   │   ├── nodes.py                  # Graph nodes (retrieve_content, query_weakness, generate_quiz, validate_quiz, validate_answer)
│   │   ├── prompts.py                # LLM prompt templates (per exercise type + validation + explanation generation)
│   │   └── state.py                  # Graph state definitions (includes weakness profile, exercise type)
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
│       ├── llm.py                    # LLM client configuration
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
├── container_apps.tf                 # Azure Container Apps environment
├── variables.tf                      # Input variables
├── outputs.tf                        # Output values (URLs, etc.)
└── terraform.tfvars.example          # Example variable values
```

### Architectural Boundaries

**API Boundaries:**

| Boundary | Protocol | Auth |
|----------|----------|------|
| Mobile → Supabase | HTTPS (Supabase JS) | Supabase Auth (JWT) |
| Mobile → Python API | HTTPS REST | Supabase JWT in Authorization header |
| Python API → Supabase | HTTPS (Supabase Python) | Service role key |
| Python API → LLM | HTTPS | API key |

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
7. LangGraph generates quiz biased toward weak areas (30-50% of questions)
   │  Each question includes: answer_key, explanation, source_citation
   │
8. Validation Node self-checks: correct answers exist, options distinct,
   │  vocabulary/grammar items from chapter, no duplicates
   │  Bad questions → regenerated individually
   │
9. API returns { quiz_id, exercise_type, questions: [{
   │    question, options, correct_answer, explanation, source_citation, ...
   │  }] }
   │
10. Mobile stores quiz in useQuizStore, renders MatchingExercise component
    │
11. User answers each question:
    │  - Matching/Vocabulary/Grammar/Fill-in-Blank/Reading: LOCAL validation
    │    (compare against answer_key in payload, instant feedback with explanation)
    │  - Sentence Construction/Dialogue Completion: LOCAL check first,
    │    then LLM call via POST /api/quizzes/validate-answer if answer differs from key
    │
12. Per-question: Mobile saves result to question_results via Supabase
    │  { user_id, chapter_id, exercise_type, vocabulary_item, correct, time_spent_ms }
    │
13. On quiz completion, Mobile saves to Supabase:
    │  - quiz_attempts record (with JSONB answers for replay)
    │  - exercise_type_progress update (best_score, attempts_count, mastered_at)
    │  - chapter_progress update (recalculated from exercise_type_progress)
    │  - user aggregates update (points, streak)
    │
14. CompletionScreen shows: score, per-exercise-type breakdown, weakness update
    │
15. TanStack Query invalidates: progress, exercise type progress, weakness profile
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
- AI & RAG Quality: Self-check validation node, exercise-type-specific prompts, workbook format compliance

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
- [x] Performance considerations addressed (5s quiz gen, retry patterns)

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

