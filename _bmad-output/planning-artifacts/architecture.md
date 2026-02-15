---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - '/home/maxime/repos/dangdai-app/_bmad-output/planning-artifacts/prd.md'
  - '/home/maxime/repos/dangdai-app/_bmad-output/planning-artifacts/ux-design-specification.md'
  - '/home/maxime/repos/dangdai-app/docs/project-requirement.md'
workflowType: 'architecture'
project_name: 'dangdai-app'
user_name: 'Maxime'
date: 'Sat Feb 14 2026'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
35 functional requirements across 8 domains:
- User Authentication (FR1-FR6): Email/Apple Sign-In via Supabase
- Content Navigation (FR7-FR10): Open book/chapter browsing
- Vocabulary Quizzes (FR11-FR15): AI-generated with immediate feedback
- Grammar Quizzes (FR16-FR20): Pattern-based exercises via RAG+LLM
- Chapter Assessment (FR21-FR22): Combined vocabulary/grammar tests
- Progress Tracking (FR23-FR26): Scores, completion %, history
- Gamification (FR27-FR31): Points, streaks, rewards
- Dashboard (FR32-FR35): Activity summary, quick continue

**Non-Functional Requirements:**
21 NFRs driving architectural decisions:
- Performance: 5s quiz generation, 500ms navigation, 3s app launch
- Security: Supabase Auth only, secure API key storage, HTTPS
- Reliability: Crash-safe progress, cross-device sync
- Localization: 4 UI languages (EN, FR, JP, KR)
- Scalability: 100 concurrent users target

**Scale & Complexity:**
- Primary domain: Cross-platform Mobile App with Python AI Backend
- Complexity level: Medium
- Estimated architectural components: ~18-22 (mobile app layers + Python API service)

### Technical Constraints & Dependencies

| Layer | Technology | Purpose |
|-------|------------|---------|
| Mobile | React Native + Expo (managed) | Cross-platform app |
| Backend (Data) | Supabase (PostgreSQL + Auth) | User data, progress, auth |
| Backend (AI) | Python (Flask + LangChain) | RAG queries, quiz generation |
| Vector Store | Supabase pgvector | Dangdai content embeddings |
| LLM | External API (via LangChain) | Quiz question generation |
| Min iOS | 13.0+ | - |
| Min Android | API 21 (5.0)+ | - |
| Connectivity | Online-only | MVP constraint |

### System Architecture Overview

```
Mobile App (Expo) ──┬──▶ Supabase (Auth, Progress, User Data)
                    │
                    └──▶ Python Backend (Flask + LangChain)
                              │
                              ├──▶ pgvector (RAG retrieval)
                              └──▶ LLM API (quiz generation)
```

### Cross-Cutting Concerns Identified

1. **Authentication State**: Supabase JWT shared between mobile and Python backend
2. **Progress Persistence**: Real-time sync of quiz answers, chapter progress, streaks
3. **Error Handling**: Network failures, LLM timeouts, Python backend errors
4. **Loading States**: Critical for 5-second AI quiz generation via Python backend
5. **Localization**: UI text in 4 languages, Chinese content unchanged
6. **Sound/Haptics**: Consistent feedback patterns across interactions
7. **Theme Support**: Light/dark mode with Tamagui tokens
8. **API Layer**: Mobile ↔ Python backend communication patterns
9. **Backend Deployment**: Python service hosting strategy

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
1. `dangdai-app/` - Mobile application (Tamagui Expo Router)
2. `dangdai-api/` - Python backend (LangGraph)

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data modeling approach (Hybrid)
- State management strategy (TanStack Query + Zustand)
- API communication pattern (REST)
- Python backend hosting (Azure Container Apps)

**Important Decisions (Shape Architecture):**
- Error handling strategy (Retry once + user fallback)
- Authentication flow (Supabase JWT verification in Python)

**Deferred Decisions (Post-MVP):**
- Caching strategy (evaluate after usage patterns emerge)
- CDN for static assets (not needed for MVP scale)

### Data Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Data Modeling** | Hybrid (normalized + aggregates) | Raw data in `quiz_attempts`, `chapter_progress` for accuracy; cached aggregates on `users` table for fast dashboard loads |
| **Database** | Supabase PostgreSQL | Already chosen; handles auth, data, and pgvector |
| **Migrations** | Supabase migrations | Built-in migration system |

**Schema Approach:**
- `users` - Profile + cached aggregates (total_points, current_streak, streak_updated_at)
- `quiz_attempts` - Individual quiz records with answers and scores
- `chapter_progress` - Per-chapter completion percentage
- `daily_activity` - Streak tracking (one row per active day)

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
- `POST /api/quiz/generate` - Generate quiz for chapter
- `GET /api/quiz/{quiz_id}` - Retrieve generated quiz
- `POST /api/quiz/{quiz_id}/validate` - Validate answer (optional)

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
| **Quiz Generation Timeout** | Retry once automatically, then show "Couldn't load questions - Try Again" |
| **Network Failure** | Show "Check your connection" with retry button |
| **Auth Error** | Redirect to login |
| **Supabase Sync Failure** | Queue locally, retry on reconnect |

**Implementation:**
- TanStack Query `retry: 1` for API calls
- Custom error boundary for React components
- Toast notifications for recoverable errors

### Decision Impact Analysis

**Implementation Sequence:**
1. Supabase schema setup (data architecture)
2. Python backend deployment (Azure + Terraform)
3. Mobile app state setup (TanStack Query + Zustand)
4. API integration layer
5. Error handling patterns

**Cross-Component Dependencies:**
- Supabase JWT → Python backend auth verification
- TanStack Query → REST endpoints → Python backend
- Zustand quiz state → TanStack Query mutations for progress sync

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
12 areas where AI agents could make different choices - all now standardized below.

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

**Pattern Enforcement:**

- ESLint rules for naming conventions
- TypeScript strict mode for type safety
- PR reviews check pattern compliance
- Shared types between frontend and backend via `types/` directory

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

#### Mobile App (dangdai-app/)

```
dangdai-app/
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
│   │   ├── index.tsx                 # Dashboard/Home
│   │   ├── books.tsx                 # Book selection
│   │   ├── progress.tsx              # Progress & calendar view
│   │   └── settings.tsx              # Settings screen
│   │
│   ├── chapter/
│   │   └── [bookId].tsx              # Chapter list for book
│   │
│   └── quiz/
│       └── [chapterId].tsx           # Quiz screen
│
├── components/
│   ├── quiz/
│   │   ├── QuizCard.tsx              # Question display
│   │   ├── QuizCard.test.tsx
│   │   ├── AnswerOption.tsx          # Answer button
│   │   ├── AnswerOption.test.tsx
│   │   ├── AnswerGrid.tsx            # 2x2 answer layout
│   │   ├── TextInputAnswer.tsx       # Text input for answers
│   │   ├── FeedbackOverlay.tsx       # Correct/incorrect feedback
│   │   ├── QuizProgress.tsx          # Progress bar
│   │   └── CompletionScreen.tsx      # Quiz completion celebration
│   │
│   ├── progress/
│   │   ├── ActivityCalendar.tsx      # GitHub-style calendar
│   │   ├── ActivityCalendar.test.tsx
│   │   ├── ProgressRing.tsx          # Circular progress indicator
│   │   ├── PointsCounter.tsx         # Animated points display
│   │   └── StreakBadge.tsx           # Current streak display
│   │
│   ├── chapter/
│   │   ├── ChapterListItem.tsx       # Chapter in list
│   │   ├── BookCard.tsx              # Book selection card
│   │   └── ChapterListSkeleton.tsx   # Loading skeleton
│   │
│   ├── dashboard/
│   │   ├── ContinueCard.tsx          # "Continue learning" CTA
│   │   ├── StatsRow.tsx              # Points, streak summary
│   │   └── RecentActivity.tsx        # Recent quiz attempts
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
│   ├── useQuiz.ts                    # Quiz data fetching (TanStack Query)
│   ├── useProgress.ts                # Progress data fetching
│   ├── useChapters.ts                # Chapter list fetching
│   └── useSound.ts                   # Sound effect management
│
├── stores/
│   ├── useQuizStore.ts               # Current quiz state (Zustand)
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
│   ├── quiz.ts                       # Quiz, Question, Answer types
│   ├── user.ts                       # User, Progress types
│   ├── chapter.ts                    # Book, Chapter types
│   └── api.ts                        # API request/response types
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
│   │   ├── graph.py                  # Main quiz generation graph
│   │   ├── nodes.py                  # Graph nodes (retrieve, generate, validate)
│   │   ├── prompts.py                # LLM prompt templates
│   │   └── state.py                  # Graph state definitions
│   │
│   ├── api/                          # FastAPI routes
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app entry point
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── quizzes.py            # POST /api/quizzes, GET /api/quizzes/{id}
│   │   │   └── health.py             # GET /health
│   │   ├── schemas.py                # Pydantic request/response models
│   │   ├── dependencies.py           # FastAPI dependencies (auth, etc.)
│   │   └── middleware.py             # CORS, error handling
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── quiz_service.py           # Quiz business logic
│   │   ├── rag_service.py            # RAG retrieval logic
│   │   └── auth_service.py           # Supabase JWT verification
│   │
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── vector_store.py           # pgvector operations
│   │   └── chapter_repo.py           # Chapter content retrieval
│   │
│   └── utils/
│       ├── __init__.py
│       ├── supabase.py               # Supabase client
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
| Quiz attempts | Supabase `quiz_attempts` | Direct from mobile |
| Chapter progress | Supabase `chapter_progress` | Direct from mobile |
| Generated quizzes | In-memory (Python) | Generated per request, not persisted |
| Dangdai content | Supabase pgvector | Python backend RAG retrieval |

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

**Data Flow (Quiz Generation):**

```
1. User taps "Start Quiz" for Chapter 10
   │
2. Mobile calls POST /api/quizzes { chapter_id: 10 }
   │  (Authorization: Bearer <supabase_jwt>)
   │
3. Python API verifies JWT with Supabase
   │
4. RAG Service retrieves Chapter 10 content from pgvector
   │
5. LangGraph generates quiz questions via LLM
   │
6. API returns { quiz_id, questions: [...] }
   │
7. Mobile stores quiz in useQuizStore
   │
8. User completes quiz → answers stored locally
   │
9. On completion, Mobile calls Supabase to save:
   │  - quiz_attempts record
   │  - chapter_progress update
   │  - user aggregates update (points, streak)
   │
10. TanStack Query invalidates progress queries
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
# dangdai-app/.env.local
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

