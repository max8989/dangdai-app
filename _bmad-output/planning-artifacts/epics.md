---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
workflowComplete: true
completedAt: 2026-02-15
updatedAt: 2026-02-20
updateHistory:
  - date: '2026-02-20'
    changes: 'Added Story 1.1b (Tamagui Theme & Animation Configuration) and updated UX requirements to align with enriched UX Design Specification'
  - date: '2026-02-20'
    changes: 'Major rewrite for PRD v2.0: Remapped 50 FRs and 31 NFRs, expanded Epic 4 for 7 exercise types with hybrid validation and pre-generated explanations, updated Epic 5 for multi-type mastery, added Epic 10 (Performance Memory & Adaptive Learning), updated Epics 3/6/8 for exercise type progress and weakness dashboard, reorganized epic structure to 10 epics'
inputDocuments:
  - '/home/maxime/repos/dangdai-app/_bmad-output/planning-artifacts/prd.md'
  - '/home/maxime/repos/dangdai-app/_bmad-output/planning-artifacts/architecture.md'
  - '/home/maxime/repos/dangdai-app/_bmad-output/planning-artifacts/ux-design-specification.md'
---

# dangdai-app - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for dangdai-app, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements (PRD v2.0)

**User Authentication & Identity:**
- **FR1:** User can create account using email
- **FR2:** User can sign in using email
- **FR3:** User can sign in using Apple ID (iOS)
- **FR4:** User can sign out
- **FR5:** User can reset password (email accounts)
- **FR6:** System persists identity across sessions

**Content Navigation:**
- **FR7:** User can view available textbooks (Books 1-2)
- **FR8:** User can view chapters within a book
- **FR9:** User can select any chapter (open navigation, no gates)
- **FR10:** User can see chapter completion status at a glance

**RAG-Powered Quiz Generation:**
- **FR11:** System retrieves chapter-specific content from vector DB filtered by book, lesson, and exercise type
- **FR12:** System generates quiz questions via LangGraph agent using RAG-retrieved content
- **FR13:** System validates generated questions for accuracy and curriculum alignment before presenting
- **FR14:** System returns structured quiz with questions, answer options, correct answers, and source citations

**Exercise Types (MVP - 7 Types):**
- **FR15:** User can select exercise type per chapter (7 types + "Mixed")
- **FR16:** Vocabulary Quiz - character ↔ pinyin ↔ meaning (multiple choice, typed input)
- **FR17:** Grammar Quiz - sentence patterns, grammar usage, grammar rules
- **FR18:** Fill-in-the-Blank - select/type correct word to complete sentences
- **FR19:** Matching - connect related items (character ↔ pinyin, question ↔ response)
- **FR20:** Dialogue Completion - complete conversation exchanges
- **FR21:** Sentence Construction - rearrange words into correct order
- **FR22:** Reading Comprehension - read passage and answer questions

**Quiz Interaction:**
- **FR23:** User receives immediate feedback per answer with correct answer shown
- **FR24:** Feedback includes explanation and source citation (pre-generated)
- **FR25:** User sees quiz results with score, time, and per-question breakdown
- **FR26:** User can review incorrect answers after quiz completion

**Chapter Assessment:**
- **FR27:** User can take chapter test combining multiple exercise types
- **FR28:** Chapter test includes cumulative review from previous chapters
- **FR29:** Chapter test uses adaptive generation to target documented weak areas
- **FR30:** User sees chapter mastery status and per-exercise-type breakdown

**Performance Memory & Adaptive Learning:**
- **FR31:** System saves per-question performance (correct/incorrect, exercise type, vocabulary/grammar item, time)
- **FR32:** System maintains learner weakness profile (missed vocab, weak grammar, low-accuracy exercise types)
- **FR33:** System uses weakness profile to bias quiz generation (30-50% target weak areas)
- **FR34:** User can view weakness dashboard (weak vocab, grammar patterns, exercise type accuracy)
- **FR35:** Weakness profile updates in real-time after each quiz completion
- **FR36:** System distinguishes between "never practiced" and "practiced but weak" items

**Progress Tracking:**
- **FR37:** System tracks quiz scores per chapter per exercise type
- **FR38:** System calculates chapter completion factoring exercise type coverage
- **FR39:** User can view progress across all chapters with per-exercise-type breakdown
- **FR40:** User can view quiz history with exercise type, score, and date

**Gamification:**
- **FR41:** System awards points for correct answers (scaled by difficulty)
- **FR42:** System tracks daily streak (consecutive active days)
- **FR43:** User can view current streak
- **FR44:** User can view total points
- **FR45:** System resets streak after missed day

**Dashboard & Home:**
- **FR46:** User can view dashboard with recent activity and weakness summary
- **FR47:** User can see book/chapter progress with exercise type coverage
- **FR48:** User can see streak and points on dashboard
- **FR49:** User can quickly continue where they left off (last exercise type + chapter)
- **FR50:** Dashboard highlights areas needing review based on weakness profile

### NonFunctional Requirements (PRD v2.0)

**Performance:**
- **NFR1:** RAG retrieval + LLM quiz generation completes within 8 seconds (10 questions), loading indicator with progress
- **NFR2:** Screen navigation completes within 500ms
- **NFR3:** App launches to usable state within 3 seconds
- **NFR4:** Weakness profile calculation completes within 2 seconds after quiz submission

**Security:**
- **NFR5:** Authentication via Supabase Auth only
- **NFR6:** Apple Sign-In follows Apple security guidelines
- **NFR7:** API keys stored securely (not in client bundle)
- **NFR8:** All data transmitted over HTTPS
- **NFR9:** Performance data accessible only to the authenticated user who generated it

**Reliability:**
- **NFR10:** Quiz progress saved after each answer (crash-safe)
- **NFR11:** Progress and performance memory persist across app restarts and devices
- **NFR12:** Data synced to server within 5 seconds of activity
- **NFR13:** RAG retrieval returns relevant content for all 7 MVP exercise types per chapter

**Integration:**
- **NFR14:** Supabase connection required for core functionality
- **NFR15:** LLM API failures display user-friendly error with retry option
- **NFR16:** Apple Sign-In available on iOS devices
- **NFR17:** LangGraph agent gracefully degrades if RAG returns insufficient content (falls back to broader chapter content)

**Offline Behavior:**
- **NFR18:** "No connection" displayed immediately when offline
- **NFR19:** No cached content or offline functionality in MVP

**Scalability:**
- **NFR20:** System supports 100 concurrent users (12-month target)
- **NFR21:** Supabase handles scaling (no special infrastructure for MVP)
- **NFR22:** Performance memory storage scales linearly (~100 rows/user/week)

**Localization:**
- **NFR23:** UI supports English, French, Japanese, Korean
- **NFR24:** Quiz instructions generated in user's selected language
- **NFR25:** User can change display language in settings
- **NFR26:** Chinese content unchanged regardless of UI language

**AI & RAG Quality:**
- **NFR27:** Generated quiz questions are curriculum-aligned: 90%+ use vocabulary/grammar from specified chapter
- **NFR28:** RAG retrieval relevance: 90%+ of retrieved chunks match requested book, lesson, exercise type
- **NFR29:** Adaptive quiz content: 30-50% of generated questions target documented weak areas
- **NFR30:** Generated exercises follow workbook formatting patterns
- **NFR31:** LLM cost per quiz generation stays under $0.05 per 10-question quiz

### Additional Requirements

**From Architecture - Starter Templates (CRITICAL for Epic 1 Story 1):**
- Mobile App initialization: `yarn create tamagui@latest --template expo-router`
- Python Backend initialization: `langgraph new --template=new-langgraph-project-python dangdai-api`

**From Architecture - Infrastructure:**
- Supabase PostgreSQL for user data, progress, auth, performance memory
- Supabase pgvector for Dangdai content embeddings (existing RAG system, filterable by exercise type)
- Python backend (LangGraph + FastAPI) for RAG/quiz generation + hybrid answer validation
- Azure Container Apps for Python backend hosting
- Terraform for infrastructure as code
- GitHub Actions for CI/CD

**From Architecture - Data Architecture:**
- Hybrid data modeling (normalized + aggregates + JSONB)
- Tables: `users`, `quiz_attempts`, `question_results`, `exercise_type_progress`, `chapter_progress`, `daily_activity`
- Cached aggregates on users table (total_points, current_streak, streak_updated_at)
- Weakness profile computed on request from question_results (agent queries via service key)

**From Architecture - State Management:**
- TanStack Query v5 for server state (user profile, progress, quiz history, exercise type progress, weakness profile)
- Zustand v5 for local state (quiz state for all 7 exercise types, UI preferences, theme)

**From Architecture - API Patterns:**
- REST API between mobile and Python backend
- `POST /api/quizzes/generate` - Generate quiz with exercise type + adaptive biasing
- `POST /api/quizzes/validate-answer` - LLM validation for Sentence Construction / Dialogue Completion
- Supabase JS client for direct mobile-to-Supabase communication
- JWT token passing via Authorization header
- Python backend verifies Supabase JWT and queries weakness profile

**From Architecture - Answer Validation Strategy:**
- **Hybrid approach**: Local validation for simple types (Vocabulary, Grammar, Fill-in-the-Blank, Matching, Reading Comprehension); LLM validation via agent for complex types (Sentence Construction, Dialogue Completion)
- LLM returns: is_correct + explanation + alternative valid answers
- Pre-generated explanations included in quiz payload for all question types

**From Architecture - Error Handling:**
- TanStack Query retry: 1 for API calls
- Custom error boundary for React components
- Toast notifications for recoverable errors
- Progressive quiz loading (show first question ASAP)
- RAG insufficient content fallback to broader chapter content
- LLM validation timeout fallback to local validation

**From UX Design - UI/UX Requirements:**
- Tamagui as UI framework with custom playful theme
- `@tamagui/animations-moti` as animation driver with 5 named spring presets (`quick`, `bouncy`, `medium`, `slow`, `lazy`)
- Tamagui sub-themes (`primary`, `success`, `error`, `warning`) for contextual color contexts
- Full Tamagui semantic token set with interaction state variants (hover/press/focus)
- Declarative animation props (`enterStyle`/`exitStyle`/`pressStyle`) and `AnimatePresence` for conditional rendering
- Tamagui media queries (`$xs`, `$sm`) for responsive adjustments (NOT imperative Dimensions checks)
- Sound + visual feedback for correct/incorrect answers (ding/bonk sounds)
- GitHub-style activity calendar for progress tracking
- Weekly/monthly activity counts (no streak guilt mechanics)
- Full-screen celebration for exercise completion with per-exercise-type breakdown and weakness update
- Loading tips during 8-second quiz generation with progressive loading
- Portrait-only orientation
- Minimum 48px touch targets
- 72px Chinese characters for quiz display
- Light and dark mode support with automatic sub-theme resolution
- Gentle orange for wrong answers (not harsh red)
- Exercise type selection screen with per-type progress indicators
- Weakness dashboard with encouraging framing ("Focus Areas" not "Weaknesses")

**From UX Design - Component Requirements:**
- QuizQuestionCard with correct/incorrect states (handles all 7 exercise types)
- AnswerOptionGrid (2x2 grid and list variants)
- TextInputAnswer for typed responses
- MatchingExercise (tap-to-pair interaction)
- SentenceBuilder (word tile reordering)
- DialogueCard (conversation bubble layout)
- WordBankSelector (horizontal word bank for fill-in-the-blank)
- ReadingPassageCard (scrollable passage + comprehension questions)
- ExerciseTypeSelector (grid of exercise type cards with per-type progress)
- ActivityCalendar (week and month views)
- PointsCounter with count-up animation
- CompletionScreen with celebration sequence + per-exercise-type breakdown
- ChapterListItem with per-exercise-type progress indicator dots
- BookCard with overall progress
- FeedbackOverlay with "Next" button + pre-generated explanation display
- WeaknessDashboard (vocabulary, grammar, exercise type accuracy sections)
- WeakAreaDrillCard (tappable to launch focused drill)
- AccuracyBar (horizontal color-coded bar)
- WeaknessSummaryCard (dashboard card linking to full weakness dashboard)

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 2 | User can create account using email |
| FR2 | Epic 2 | User can sign in using email |
| FR3 | Epic 2 | User can sign in using Apple ID (iOS) |
| FR4 | Epic 2 | User can sign out |
| FR5 | Epic 2 | User can reset password |
| FR6 | Epic 2 | System persists identity across sessions |
| FR7 | Epic 3 | User can view available textbooks |
| FR8 | Epic 3 | User can view chapters within a book |
| FR9 | Epic 3 | User can select any chapter |
| FR10 | Epic 3 | User can see chapter completion status (per-exercise-type indicators) |
| FR11 | Epic 4 | System retrieves chapter content from vector DB filtered by exercise type |
| FR12 | Epic 4 | System generates quiz via LangGraph agent using RAG content |
| FR13 | Epic 4 | System validates generated questions (self-check node) |
| FR14 | Epic 4 | System returns structured quiz with explanations and source citations |
| FR15 | Epic 4 | User can select exercise type per chapter (7 types + Mixed) |
| FR16 | Epic 4 | Vocabulary Quiz |
| FR17 | Epic 4 | Grammar Quiz |
| FR18 | Epic 4 | Fill-in-the-Blank |
| FR19 | Epic 4 | Matching |
| FR20 | Epic 4 | Dialogue Completion |
| FR21 | Epic 4 | Sentence Construction |
| FR22 | Epic 4 | Reading Comprehension |
| FR23 | Epic 4 | User receives immediate feedback with correct answer |
| FR24 | Epic 4 | Feedback includes explanation and source citation |
| FR25 | Epic 4 | User sees quiz results with score, time, breakdown |
| FR26 | Epic 4 | User can review incorrect answers after completion |
| FR27 | Epic 5 | User can take chapter test combining multiple exercise types |
| FR28 | Epic 5 | Chapter test includes cumulative review |
| FR29 | Epic 5 | Chapter test uses adaptive generation for weak areas |
| FR30 | Epic 5 | User sees mastery status and per-type breakdown |
| FR31 | Epic 10 | System saves per-question performance |
| FR32 | Epic 10 | System maintains learner weakness profile |
| FR33 | Epic 10 | System uses weakness profile to bias quiz generation |
| FR34 | Epic 10 | User can view weakness dashboard |
| FR35 | Epic 10 | Weakness profile updates in real-time |
| FR36 | Epic 10 | System distinguishes "never practiced" vs "practiced but weak" |
| FR37 | Epic 6 | System tracks quiz scores per chapter per exercise type |
| FR38 | Epic 6 | System calculates chapter completion factoring type coverage |
| FR39 | Epic 6 | User can view progress with per-exercise-type breakdown |
| FR40 | Epic 6 | User can view quiz history with exercise type |
| FR41 | Epic 7 | System awards points (scaled by difficulty) |
| FR42 | Epic 7 | System tracks daily streak |
| FR43 | Epic 7 | User can view current streak |
| FR44 | Epic 7 | User can view total points |
| FR45 | Epic 7 | System resets streak after missed day |
| FR46 | Epic 8 | User can view dashboard with activity + weakness summary |
| FR47 | Epic 8 | User can see progress with exercise type coverage |
| FR48 | Epic 8 | User can see streak and points on dashboard |
| FR49 | Epic 8 | User can quickly continue (last exercise type + chapter) |
| FR50 | Epic 8 | Dashboard highlights areas needing review |

## Epic List

### Epic 1: Project Foundation & Infrastructure
**Goal:** Establish the complete technical foundation so that development teams can begin building user-facing features with all infrastructure, tooling, and base architecture in place.

**User Outcome:** Development environment ready with mobile app scaffold, Python backend scaffold, Supabase database schema (6 tables), and deployment pipeline configured.

**FRs covered:** None directly (enables all FRs)
**NFRs addressed:** NFR5, NFR7, NFR8, NFR14, NFR20, NFR21

---

### Epic 2: User Authentication & Identity
**Goal:** Enable users to create accounts, sign in, and maintain their identity across sessions so they can begin their personalized learning journey.

**User Outcome:** Users can register, login (email or Apple ID), sign out, reset password, and have their identity persist across sessions.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6
**NFRs addressed:** NFR5, NFR6, NFR8, NFR16

---

### Epic 3: Content Navigation & Book Selection
**Goal:** Enable users to browse available Dangdai textbooks and chapters, selecting any chapter to study with per-exercise-type progress visibility.

**User Outcome:** Users can view Books 1-2, see all chapters with per-exercise-type progress indicators, select any chapter freely (open navigation), and navigate to the exercise type selection screen.

**FRs covered:** FR7, FR8, FR9, FR10, FR15
**NFRs addressed:** NFR2

---

### Epic 4: Quiz Experience & Exercise Types
**Goal:** Enable users to take 7 types of AI-generated exercises with RAG-powered content, hybrid answer validation, pre-generated explanations, and satisfying feedback.

**User Outcome:** Users can select exercise types, take Vocabulary/Grammar/Fill-in-the-Blank/Matching/Dialogue Completion/Sentence Construction/Reading Comprehension quizzes, receive immediate feedback with explanations and source citations, and see results with per-question breakdown.

**FRs covered:** FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26
**NFRs addressed:** NFR1, NFR2, NFR10, NFR13, NFR15, NFR17, NFR27, NFR28, NFR30, NFR31

---

### Epic 5: Chapter Assessment & Mastery
**Goal:** Enable users to take comprehensive chapter tests spanning multiple exercise types and achieve chapter mastery.

**User Outcome:** Users take chapter tests combining exercise types with cumulative review and adaptive weak-area targeting. Chapter mastery requires ≥4 of 7 types attempted with ≥80% average. Special celebration for first-time mastery.

**FRs covered:** FR27, FR28, FR29, FR30
**NFRs addressed:** NFR10, NFR11

---

### Epic 6: Progress Tracking & History
**Goal:** Enable users to track their learning progress across all chapters with per-exercise-type breakdown and review quiz history.

**User Outcome:** Users can view per-exercise-type scores, chapter completion percentages factoring type coverage, progress across all chapters, and complete quiz history.

**FRs covered:** FR37, FR38, FR39, FR40
**NFRs addressed:** NFR11, NFR12

---

### Epic 7: Gamification & Motivation
**Goal:** Enable users to earn points, track streaks, and stay motivated through gamification mechanics.

**User Outcome:** Users earn points scaled by exercise difficulty, track daily streaks, view current streak and total points, with streak reset logic after missed days.

**FRs covered:** FR41, FR42, FR43, FR44, FR45
**NFRs addressed:** NFR11, NFR12

---

### Epic 8: Dashboard & Quick Continue
**Goal:** Enable users to see their learning status at a glance including weakness summary and quickly continue where they left off.

**User Outcome:** Users can view dashboard with recent activity and weakness summary, see book/chapter progress with exercise type coverage, see streak and points, and one-tap continue to their last exercise type and chapter.

**FRs covered:** FR46, FR47, FR48, FR49, FR50
**NFRs addressed:** NFR2, NFR3

---

### Epic 9: Localization & Settings
**Goal:** Enable users to customize their app experience with language preferences and settings.

**User Outcome:** Users can change display language (English, French, Japanese, Korean), receive quiz instructions in their selected language, with Chinese content unchanged.

**FRs covered:** None directly (enhances all user experience)
**NFRs addressed:** NFR23, NFR24, NFR25, NFR26

---

### Epic 10: Performance Memory & Adaptive Learning
**Goal:** Enable the adaptive learning system that tracks per-question performance, builds weakness profiles, biases quiz generation toward weak areas, and provides a weakness dashboard for focused improvement.

**User Outcome:** System saves every answer result, builds a profile of weak vocabulary/grammar/exercise types, adaptively targets weak areas in future quizzes (30-50%), and users can view a weakness dashboard with tappable drill cards for focused practice.

**FRs covered:** FR31, FR32, FR33, FR34, FR35, FR36
**NFRs addressed:** NFR4, NFR9, NFR22, NFR29

---

## Epic 1: Project Foundation & Infrastructure

**Goal:** Establish the complete technical foundation so that development teams can begin building user-facing features with all infrastructure, tooling, and base architecture in place.

### Story 1.1: Initialize Mobile App with Tamagui Expo Router

As a developer,
I want to scaffold the mobile app using the Tamagui Expo Router template,
So that I have a working foundation with routing, theming, and TypeScript configured.

**Acceptance Criteria:**

**Given** the project repository exists
**When** I run `yarn create tamagui@latest --template expo-router`
**Then** a new Expo app is created with Tamagui configured
**And** the app runs successfully on iOS simulator and Android emulator
**And** file-based routing is functional
**And** TypeScript strict mode is enabled

---

### Story 1.1b: Configure Tamagui Theme, Sub-Themes & Animation Presets

As a developer,
I want to configure the Tamagui theme system with semantic tokens, sub-themes, and animation presets,
So that all UI components have a consistent design foundation with light/dark mode, contextual color contexts, and standardized animations.

**Acceptance Criteria:**

**Given** the mobile app scaffold exists (Story 1.1 complete)
**When** I configure `tamagui.config.ts`
**Then** the following are defined and functional:

**Theme Tokens:**
- Light and dark themes with full Tamagui semantic token sets (`background`, `backgroundHover`, `backgroundPress`, `backgroundFocus`, `backgroundStrong`, `color`, `colorHover`, `colorPress`, `borderColor`, `borderColorHover`, `borderColorFocus`, `placeholderColor`)
- Custom tokens: `surface` (card backgrounds), `colorSubtle` (muted text)
- Brand color tokens: `primary` (#06B6D4), `primaryDark` (#0891B2), `primaryLight` (#22D3EE), `secondary` (#F97316), `success` (#22C55E), `error` (#FB923C), `warning` (#F59E0B)
- Semantic color context tokens for success/error/warning (e.g., `successBackground`, `successBorder`, `successText`)

**Sub-Themes:**
- `primary`, `success`, `error`, `warning` sub-themes exist for both `light_` and `dark_` parents
- Wrapping a component in `<Theme name="success">` correctly remaps `$background`, `$color`, `$borderColor` to success context colors
- A visual test or storybook screen demonstrates all 4 sub-themes rendering correctly in both light and dark mode

**Animation Presets:**
- `@tamagui/animations-moti` is installed and configured as the animation driver
- `react-native-reanimated` and `moti` peer dependencies are installed
- 5 named animation presets are defined in `createAnimations()`:
  - `quick`: `damping: 20, stiffness: 250, mass: 1.2`
  - `bouncy`: `damping: 10, stiffness: 200, mass: 0.9`
  - `medium`: `damping: 15, stiffness: 150, mass: 1.0`
  - `slow`: `damping: 20, stiffness: 60, mass: 1.2`
  - `lazy`: from defaultConfig
- A component using `animation="bouncy"` with `enterStyle={{ opacity: 0, scale: 0.5 }}` animates correctly on mount

**Design Tokens:**
- Spacing scale: `xs=4, sm=8, md=16, lg=24, xl=32, 2xl=48`
- Border radius: `sm=8, md=12, full=9999`
- Font families: body (Inter), heading (Inter) configured with Tamagui `createFont()`
- Media queries: `$xs`, `$sm`, `$gtXs` available from defaultConfig

**Verification:**
- The app renders with correct theme colors in both light and dark mode
- `<Theme name="primary"><Button>Test</Button></Theme>` renders a teal-background button with white text
- `AnimatePresence` with `enterStyle`/`exitStyle` correctly animates a test component in and out
- No hardcoded hex values exist in any component file (only `$tokenName` references)

---

### Story 1.2: Initialize Python Backend with LangGraph

As a developer,
I want to scaffold the Python backend using the LangGraph template,
So that I have a working FastAPI service ready for RAG and quiz generation.

**Acceptance Criteria:**

**Given** the project repository exists
**When** I run `langgraph new --template=new-langgraph-project-python dangdai-api`
**Then** a new Python project is created with LangGraph and FastAPI configured
**And** the service runs locally with `uvicorn`
**And** a health endpoint `/health` returns 200 OK
**And** project structure follows Architecture specification

---

### Story 1.3: Configure Supabase Project and Base Schema

As a developer,
I want to configure the Supabase project with the complete database schema,
So that authentication, data storage, performance memory, and exercise type progress foundations are ready.

**Acceptance Criteria:**

**Given** a Supabase project exists
**When** I apply the initial migration
**Then** the following tables are created:
- `users` - id, email, display_name, total_points, current_streak, streak_updated_at, created_at, updated_at
- `quiz_attempts` - id, user_id, chapter_id, book_id, exercise_type, score, total_questions, answers_json (JSONB), created_at
- `question_results` - id, user_id, chapter_id, book_id, exercise_type, vocabulary_item, grammar_pattern, correct (boolean), time_spent_ms, created_at
- `exercise_type_progress` - id, user_id, chapter_id, exercise_type, best_score, attempts_count, mastered_at, updated_at
- `chapter_progress` - id, user_id, chapter_id, book_id, completion_percentage, mastered_at, updated_at
- `daily_activity` - id, user_id, activity_date, quizzes_completed, points_earned
**And** indexes are created on question_results: (user_id, exercise_type), (user_id, vocabulary_item), (user_id, chapter_id)
**And** Supabase Auth is configured for email and Apple Sign-In
**And** Row Level Security (RLS) is enabled on all tables (users read/write own data only)
**And** the mobile app can connect to Supabase using environment variables

---

### Story 1.4: Configure Mobile App Environment and Supabase Client

As a developer,
I want to configure environment variables and the Supabase client in the mobile app,
So that the app can communicate with Supabase for auth and data.

**Acceptance Criteria:**

**Given** the mobile app scaffold exists
**When** I configure `.env.local` with Supabase credentials
**Then** the Supabase JS client is initialized in `lib/supabase.ts`
**And** environment variables are accessible via `expo-constants`
**And** the app successfully connects to Supabase (verified via console log)

---

### Story 1.5: Configure State Management (TanStack Query + Zustand)

As a developer,
I want to set up TanStack Query and Zustand in the mobile app,
So that server state and local state are managed according to architecture patterns.

**Acceptance Criteria:**

**Given** the mobile app scaffold exists
**When** I install and configure TanStack Query v5 and Zustand v5
**Then** QueryClient is configured in `lib/queryClient.ts`
**And** QueryClientProvider wraps the app in root layout
**And** query keys are defined in `lib/queryKeys.ts`
**And** a sample Zustand store (`useSettingsStore`) is created following naming conventions

---

### Story 1.6: Deploy Python Backend to Azure Container Apps

As a developer,
I want to deploy the Python backend to Azure Container Apps using Terraform,
So that the quiz generation API is accessible from the mobile app.

**Acceptance Criteria:**

**Given** the Python backend scaffold exists and runs locally
**When** I apply the Terraform configuration
**Then** Azure Container Apps environment is created
**And** the dangdai-api container is deployed with scale-to-zero configuration
**And** environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY, LLM_API_KEY) are configured
**And** the `/health` endpoint is accessible via public URL
**And** the mobile app can reach the deployed API

---

### Story 1.7: Configure CI/CD with GitHub Actions

As a developer,
I want to set up GitHub Actions workflows for CI/CD,
So that code quality is validated and deployments are automated.

**Acceptance Criteria:**

**Given** the repository contains mobile app and Python backend
**When** I push code to the repository
**Then** CI workflow runs lint, type-check, and tests for both projects
**And** Python backend deployment workflow triggers on main branch
**And** EAS Build workflow is configured for mobile app builds
**And** all workflows pass on a clean commit

---

## Epic 2: User Authentication & Identity

**Goal:** Enable users to create accounts, sign in, and maintain their identity across sessions so they can begin their personalized learning journey.

### Story 2.1: Email Registration Screen and Flow

As a new user,
I want to create an account using my email address,
So that I can start my personalized Chinese learning journey.

**Acceptance Criteria:**

**Given** I am on the signup screen
**When** I enter a valid email and password and tap "Sign Up"
**Then** my account is created via Supabase Auth
**And** a user record is created in the `users` table
**And** I am redirected to the book selection screen
**And** I see a welcome message

**Given** I enter an email already in use
**When** I tap "Sign Up"
**Then** I see an error message "Email already registered"

**Given** I enter an invalid email format
**When** I tap "Sign Up"
**Then** I see an inline validation error

---

### Story 2.2: Email Login Screen and Flow

As a returning user,
I want to sign in with my email and password,
So that I can continue my learning progress.

**Acceptance Criteria:**

**Given** I am on the login screen
**When** I enter my registered email and correct password and tap "Sign In"
**Then** I am authenticated via Supabase Auth
**And** I am redirected to the dashboard
**And** my session persists across app restarts (FR6)

**Given** I enter incorrect credentials
**When** I tap "Sign In"
**Then** I see an error message "Invalid email or password"

**Given** I have no account
**When** I tap "Create Account"
**Then** I am navigated to the signup screen

---

### Story 2.3: Apple Sign-In (iOS)

As an iOS user,
I want to sign in using my Apple ID,
So that I can quickly access the app without creating a new password.

**Acceptance Criteria:**

**Given** I am on the login screen on an iOS device
**When** I tap "Sign in with Apple"
**Then** the Apple Sign-In sheet appears
**And** after successful Apple authentication, my account is created or linked in Supabase
**And** I am redirected to the dashboard (or book selection if new user)

**Given** I am on an Android device
**When** I view the login screen
**Then** the Apple Sign-In button is not displayed (NFR13)

---

### Story 2.4: Sign Out

As a user,
I want to sign out of my account,
So that I can secure my account or switch to a different account.

**Acceptance Criteria:**

**Given** I am signed in and on the settings screen
**When** I tap "Sign Out"
**Then** I am signed out via Supabase Auth
**And** I am redirected to the login screen
**And** my session is cleared from the device

---

### Story 2.5: Password Reset via Email

As a user who forgot my password,
I want to reset my password via email,
So that I can regain access to my account.

**Acceptance Criteria:**

**Given** I am on the login screen
**When** I tap "Forgot Password" and enter my email
**Then** a password reset email is sent via Supabase Auth
**And** I see a confirmation message "Reset link sent to your email"

**Given** I click the reset link in my email
**When** I enter a new password
**Then** my password is updated
**And** I can sign in with the new password

---

### Story 2.6: Auth State Persistence and Session Management

As a user,
I want my login to persist across app restarts,
So that I don't have to sign in every time I open the app.

**Acceptance Criteria:**

**Given** I have previously signed in
**When** I close and reopen the app
**Then** I am automatically authenticated
**And** I am taken directly to the dashboard (not login screen)

**Given** my session has expired
**When** I open the app
**Then** I am redirected to the login screen
**And** I see a message "Session expired, please sign in again"

---

## Epic 3: Content Navigation & Book Selection

**Goal:** Enable users to browse available Dangdai textbooks and chapters, selecting any chapter with per-exercise-type progress visibility and navigating to the exercise type selection screen.

### Story 3.1: Book Selection Screen

As a user,
I want to view available textbooks (Books 1-2),
So that I can choose which book to study from.

**Acceptance Criteria:**

**Given** I am authenticated and on the Books tab
**When** the screen loads
**Then** I see Book 1 and Book 2 displayed as cards
**And** each book card shows the book title, cover image, and progress summary (e.g., "3/15 chapters")
**And** screen navigation completes within 500ms (NFR2)

**Given** I tap on a book card
**When** the navigation completes
**Then** I am taken to the chapter list for that book

---

### Story 3.2: Chapter List Screen

As a user,
I want to view all chapters within a selected book,
So that I can see what content is available and choose what to study.

**Acceptance Criteria:**

**Given** I have selected a book
**When** the chapter list screen loads
**Then** I see all chapters for that book displayed in a scrollable list
**And** each chapter shows: chapter number, chapter title (English), chapter title (Chinese)
**And** a back button returns me to the book selection screen

---

### Story 3.3: Chapter Completion Status with Per-Exercise-Type Indicators

As a user,
I want to see chapter completion status with per-exercise-type progress at a glance,
So that I know my progress, which exercise types I've completed, and which chapters need more work.

**Acceptance Criteria:**

**Given** I am on the chapter list screen
**When** I view a chapter that I have not started
**Then** the chapter shows "Not started" with 7 gray indicator dots (one per exercise type)

**Given** I have partially completed a chapter (some exercise types attempted)
**When** I view that chapter in the list
**Then** the chapter shows overall completion percentage
**And** per-exercise-type indicator dots below the chapter name: green (mastered ≥80%), teal (in progress <80%), gray (not started)

**Given** I have mastered a chapter (≥4 types attempted, ≥80% average)
**When** I view that chapter in the list
**Then** the chapter shows a checkmark and all attempted type dots are green

**Given** I tap on any chapter
**When** the navigation completes
**Then** I am taken to the Exercise Type Selection screen (not directly to quiz)

---

### Story 3.4: Open Chapter Navigation (No Gates)

As a user,
I want to select any chapter freely without restrictions,
So that I can study the content that matches my current learning needs.

**Acceptance Criteria:**

**Given** I am on the chapter list screen
**When** I tap on any chapter (regardless of completion status of other chapters)
**Then** I am taken to the Exercise Type Selection screen for that chapter
**And** no "unlock" or "complete previous chapters first" message is shown

**Given** I have never used the app before
**When** I navigate to Book 2, Chapter 10
**Then** I can immediately access the Exercise Type Selection screen for that chapter

---

### Story 3.5: Exercise Type Selection Screen

As a user,
I want to see all exercise types for a chapter with per-type progress and select one to start,
So that I can choose the type of practice I want or let the AI pick for me.

**Acceptance Criteria:**

**Given** I have selected a chapter
**When** the Exercise Type Selection screen loads
**Then** I see a 2-column grid of 8 cards: "Mixed" + 7 exercise types (Vocabulary, Grammar, Fill-in-the-Blank, Matching, Dialogue Completion, Sentence Construction, Reading Comprehension)
**And** each card shows: exercise type icon, label, and progress indicator (%, "New", or checkmark)
**And** the "Mixed" card is at top-left with distinct primary theme styling and subtitle "AI picks exercises based on your weak areas"
**And** progress data is fetched from `exercise_type_progress` for this chapter

**Given** I tap an exercise type card
**When** the selection is registered
**Then** quiz generation starts for that chapter + exercise type
**And** I see the loading screen with progressive loading

**Given** I tap the "Mixed" card
**When** the quiz is generated
**Then** the AI selects exercise types biased toward my documented weak areas

---

## Epic 4: Quiz Experience & Exercise Types

**Goal:** Enable users to take 7 types of AI-generated exercises with RAG-powered content, hybrid answer validation, pre-generated explanations, and satisfying feedback across all interaction patterns.

### Story 4.1: Quiz Generation API Endpoint (All Exercise Types)

As a developer,
I want to implement the quiz generation API endpoint that supports all 7 exercise types with RAG filtering, pre-generated explanations, and self-check validation,
So that the mobile app can request AI-generated quizzes for any chapter and exercise type.

**Acceptance Criteria:**

**Given** the Python backend is running
**When** a POST request is made to `/api/quizzes/generate` with `{ "chapter_id": 12, "book_id": 2, "exercise_type": "matching" }`
**Then** the RAG system retrieves chapter content from pgvector filtered by book, lesson, and exercise type
**And** the LangGraph agent generates 10-15 quiz questions with:
  - Answer key (correct answer for each question)
  - Pre-generated explanation per question (why the answer is correct, citing textbook source)
  - Source citation per question (e.g., "From Book 2, Chapter 12 - Grammar")
  - Exercise-type-specific payload (matching pairs, sentence tiles, dialogue bubbles, word bank, etc.)
**And** a self-check validation node verifies: correct answers exist, options are distinct, vocabulary/grammar items are from the chapter, no duplicate questions. Bad questions are regenerated.
**And** the response is returned within 8 seconds (NFR1)

**Given** `exercise_type` is "mixed"
**When** the request is made
**Then** the agent selects a variety of exercise types, biased toward the user's weak areas

**Given** the RAG retrieval returns insufficient content for the exercise type
**When** the agent processes the request
**Then** it falls back to broader chapter content (NFR17) or returns a specific error if still insufficient

---

### Story 4.1b: Answer Validation API Endpoint (Hybrid - Complex Types)

As a developer,
I want to implement the LLM-based answer validation endpoint for Sentence Construction and Dialogue Completion,
So that the mobile app can evaluate open-ended answers where multiple valid responses exist.

**Acceptance Criteria:**

**Given** the Python backend is running
**When** a POST request is made to `/api/quizzes/validate-answer` with `{ "question": "...", "user_answer": "...", "correct_answer": "...", "exercise_type": "sentence_construction" }`
**Then** the LLM evaluates whether the user's answer is valid
**And** the response includes `{ "is_correct": true/false, "explanation": "...", "alternatives": ["alt1", "alt2"] }`

**Given** the validation call times out (>3 seconds)
**When** the timeout occurs
**Then** the mobile app falls back to local comparison against the answer key

---

### Story 4.2: Quiz Loading Screen with Progressive Loading

As a user,
I want to see an engaging loading screen while quiz questions are generated, and start answering as soon as the first question is ready,
So that I stay engaged during the ~8 second generation time.

**Acceptance Criteria:**

**Given** I have selected an exercise type and tapped to start
**When** quiz generation is in progress
**Then** I see "Generating your [Exercise Type] exercise for Chapter 12..."
**And** I see a loading animation with progress indicator
**And** I see rotating learning tips that change every 2 seconds
**And** a cancel button is available to return to Exercise Type Selection screen

**Given** the first question is ready before the full quiz
**When** the first question arrives
**Then** I can start answering immediately while remaining questions load in background (progressive loading)

**Given** quiz generation fails
**When** the error is received
**Then** I see a friendly error "Couldn't generate [Exercise Type] exercise. Try another type or retry."
**And** "Retry" and "Back" buttons are displayed

**Given** RAG returns insufficient content for the exercise type
**When** the fallback also fails
**Then** I see "Not enough content for [Exercise Type] in this chapter. Try Vocabulary or Grammar instead."

---

### Story 4.3: Vocabulary & Grammar Quiz (Multiple Choice)

As a user,
I want to take vocabulary and grammar quizzes with clear Chinese character display and multiple choice answers,
So that I can practice character/pinyin/meaning recognition and grammar patterns.

**Acceptance Criteria:**

**Given** a vocabulary quiz has loaded
**When** I view a question
**Then** I see the question type label (e.g., "What does this mean?")
**And** the Chinese character is displayed at 72px minimum
**And** pinyin is shown below the character when applicable
**And** 4 answer options are displayed in a 2x2 grid layout (or vertical list for longer grammar answers)
**And** a progress bar shows my position in the quiz (e.g., "3/10")
**And** each option has minimum 48x48px touch target

**Given** I tap an answer option
**When** my selection is registered
**Then** the answer is validated locally against the answer key
**And** I cannot change my answer after submission

---

### Story 4.4: Fill-in-the-Blank Exercise (Word Bank)

As a user,
I want to complete fill-in-the-blank exercises by selecting words from a word bank,
So that I can practice using vocabulary in sentence context.

**Acceptance Criteria:**

**Given** a fill-in-the-blank exercise has loaded
**When** I view a question
**Then** I see a sentence with one or more blanks highlighted
**And** a horizontal scrollable word bank is displayed below with selectable word options
**And** each word option has minimum 48px touch target

**Given** I tap a word in the word bank
**When** the selection is registered
**Then** the word animates from the bank to fill the blank in the sentence
**And** the used word becomes semi-transparent (opacity 0.4) in the bank
**And** I can tap the filled blank to return the word to the bank

**Given** I have filled all blanks
**When** the answer is validated locally against the answer key
**Then** correct/incorrect feedback is shown per blank

---

### Story 4.5: Matching Exercise (Tap-to-Pair)

As a user,
I want to connect matching items (character ↔ pinyin, question ↔ response) by tapping pairs,
So that I can practice recognizing character relationships.

**Acceptance Criteria:**

**Given** a matching exercise has loaded
**When** I view the exercise
**Then** I see two columns: left items (e.g., characters) and right items (e.g., pinyin), shuffled independently
**And** a progress indicator shows "X/Y paired"
**And** Chinese characters are displayed at 72px minimum

**Given** I tap an item in the left column
**When** the item is selected
**Then** it highlights with primary theme border

**Given** I tap an item in the right column after selecting a left item
**When** the pair is evaluated locally against the answer key
**Then** if correct: both items show success theme + connection line + "ding" sound + items become non-interactive
**Then** if incorrect: both items shake + error theme flash + "bonk" sound + selection resets

**Given** all pairs are matched
**When** the exercise completes
**Then** the completion flow triggers with score

---

### Story 4.6: Dialogue Completion Exercise

As a user,
I want to complete conversation exercises by selecting appropriate responses,
So that I can practice dialogue patterns from the textbook.

**Acceptance Criteria:**

**Given** a dialogue completion exercise has loaded
**When** I view the exercise
**Then** I see conversation bubbles (A left-aligned, B right-aligned) with one blank bubble
**And** answer options are displayed below the dialogue as a vertical list
**And** Chinese characters are displayed at 72px minimum in bubbles

**Given** I tap an answer option
**When** the selection is registered
**Then** the selected text fills the blank bubble with a slide-in animation
**Then** if the answer matches the key: local validation → instant correct feedback
**Then** if the answer differs from key: LLM validation call via `/api/quizzes/validate-answer`
**And** LLM returns is_correct + explanation + alternative valid answers
**And** if correct alternative: "Your answer is also valid!" shown with alternatives
**And** if incorrect: correct answer shown with explanation

---

### Story 4.7: Sentence Construction Exercise

As a user,
I want to arrange scrambled words into correct sentences by tapping word tiles,
So that I can practice Chinese sentence structure.

**Acceptance Criteria:**

**Given** a sentence construction exercise has loaded
**When** I view the exercise
**Then** I see an answer area with empty slots at the top
**And** a word bank area below with scrambled word tiles
**And** Chinese characters are displayed at 72px minimum in tiles
**And** tiles have minimum 48px touch targets

**Given** I tap a word tile in the bank
**When** the tap is registered
**Then** the tile animates from the bank to the next empty slot in the answer area
**And** I can tap a placed tile to return it to the bank

**Given** all tiles are placed and I tap "Submit"
**When** the answer is evaluated
**Then** if the answer matches the key: local validation → correct tiles flash green, celebration
**Then** if the answer differs from key: LLM validation call via `/api/quizzes/validate-answer`
**And** LLM returns is_correct + explanation + alternative valid orderings
**And** if incorrect: correct positions flash green, incorrect flash orange, correct sentence shown

---

### Story 4.8: Reading Comprehension Exercise

As a user,
I want to read a Chinese passage and answer comprehension questions,
So that I can practice reading skills.

**Acceptance Criteria:**

**Given** a reading comprehension exercise has loaded
**When** I view the exercise
**Then** I see a scrollable Chinese text passage (72px minimum for characters, pinyin toggle available)
**And** comprehension questions appear below the passage with standard multiple choice
**And** the passage remains scrollable while answering questions

**Given** I select an answer to a comprehension question
**When** the answer is validated locally against the answer key
**Then** standard correct/incorrect feedback is shown

---

### Story 4.9: Immediate Answer Feedback (Visual + Sound + Explanation)

As a user,
I want to receive immediate visual and audio feedback with explanations on my answer,
So that I know instantly if I was correct and learn from the explanation.

**Acceptance Criteria:**

**Given** I have submitted a correct answer (any exercise type)
**When** feedback is displayed
**Then** the answer shows success theme (green border, checkmark)
**And** a satisfying "ding" sound plays
**And** points increment is shown
**And** the pre-generated explanation is displayed (e.g., "This uses the 把 construction because...")
**And** source citation is shown (e.g., "From Book 2, Chapter 12 - Grammar")
**And** feedback displays until user taps "Next" to advance

**Given** I have submitted an incorrect answer
**When** feedback is displayed
**Then** the answer shows error theme (gentle orange border, not harsh red)
**And** the correct answer is highlighted in green
**And** a gentle "bonk" sound plays
**And** the pre-generated explanation is displayed
**And** feedback displays until user taps "Next" to advance

---

### Story 4.10: Quiz Progress Saving (Crash-Safe) & Per-Question Results

As a user,
I want my quiz progress saved after each answer with per-question performance tracking,
So that I don't lose progress and my weakness profile stays current.

**Acceptance Criteria:**

**Given** I am taking any exercise type
**When** I answer a question
**Then** my answer and score are saved to local state immediately
**And** a `question_results` record is written to Supabase: user_id, chapter_id, exercise_type, vocabulary_item, grammar_pattern, correct, time_spent_ms
**And** progress is synced within 5 seconds (NFR12)

**Given** the app crashes mid-quiz
**When** I reopen the app
**Then** I can resume from where I left off (NFR10)

---

### Story 4.11: Quiz Results Screen with Per-Type Breakdown

As a user,
I want to see my quiz results with score, per-exercise-type chapter progress, and weakness update,
So that I know how well I performed and how it fits into my overall chapter mastery.

**Acceptance Criteria:**

**Given** I have answered all quiz questions
**When** the quiz completes
**Then** I see a completion screen with celebration animation
**And** my score is displayed (e.g., "8/10 correct - 80%")
**And** points earned are shown with count-up animation
**And** **per-exercise-type progress bars** for the chapter are shown (which types done, in progress, new)
**And** the just-completed type is highlighted
**And** **weakness summary update** section shows changes to weakness profile (e.g., "會 vs 可以: 60% → 80% - Improving!")
**And** "You struggled with:" section shows missed items (if any)
**And** a "Continue" button returns to Exercise Type Selection or dashboard
**And** `exercise_type_progress` is updated in Supabase

---

### Story 4.12: Text Input Answer Type

As a user,
I want to type my answer for certain question types,
So that I can practice recall without multiple choice hints.

**Acceptance Criteria:**

**Given** a question requires typed input (pinyin or meaning)
**When** I view the question
**Then** a text input field is displayed instead of the answer grid
**And** placeholder text shows what to enter (e.g., "Type the pinyin...")
**And** I can submit with Enter key or Submit button

**Given** I submit a typed answer
**When** the answer is validated locally against the answer key
**Then** correct/incorrect feedback is shown with the same visual/audio patterns + explanation
**And** for incorrect answers, the correct answer is displayed

---

## Epic 5: Chapter Assessment & Mastery

**Goal:** Enable users to take comprehensive chapter tests spanning multiple exercise types and achieve chapter mastery requiring exercise type coverage.

### Story 5.1: Chapter Test (Multi-Type Assessment)

As a user,
I want to take a comprehensive chapter test combining multiple exercise types with adaptive targeting of my weak areas,
So that I can assess my overall mastery of the chapter across different skills.

**Acceptance Criteria:**

**Given** I am on the Exercise Type Selection screen for a chapter
**When** I tap "Take Chapter Test"
**Then** a quiz is generated with ~20 questions spanning multiple exercise types (vocabulary, grammar, fill-in-the-blank, matching, dialogue completion)
**And** the quiz includes cumulative review questions from previous chapters (FR28)
**And** the quiz uses adaptive generation to include extra questions on my documented weak areas (FR29)
**And** the same quiz UI and feedback patterns are used, with type-specific interactions per question

**Given** the chapter test is in progress
**When** I view the progress bar
**Then** I see "Chapter Test" label and current question count

---

### Story 5.2: Chapter Mastery Calculation (Multi-Type)

As a user,
I want the system to calculate my chapter mastery based on exercise type coverage and performance,
So that I know when I've truly learned the material across different exercise types.

**Acceptance Criteria:**

**Given** I complete exercises for a chapter
**When** the mastery is evaluated
**Then** the system checks: have I attempted ≥4 of 7 exercise types for this chapter?
**And** the system checks: is my average score across attempted types ≥80%?
**And** `chapter_progress` is updated with overall completion percentage (calculated from `exercise_type_progress`)

**Given** I have attempted ≥4 types with ≥80% average
**When** the mastery threshold is met
**Then** the chapter is marked as "Mastered" in `chapter_progress`
**And** `mastered_at` timestamp is set

**Given** I have only attempted 2 of 7 types with 90% average
**When** the mastery is evaluated
**Then** the chapter is NOT mastered (insufficient type coverage)
**And** the completion screen encourages: "Try Matching or Sentence Construction next!"

---

### Story 5.3: Chapter Mastery Celebration (Per-Type Breakdown)

As a user,
I want to receive a special celebration when I master a chapter with a per-exercise-type breakdown,
So that I feel accomplished and see which types I've mastered.

**Acceptance Criteria:**

**Given** I achieve chapter mastery (≥4 types, ≥80% average)
**When** this is my first time mastering the chapter
**Then** I see an enhanced celebration screen with special animation and success theme
**And** a "Chapter Mastered!" message is prominently displayed
**And** a per-exercise-type breakdown is shown (e.g., "Vocabulary 95% ✓, Grammar 82% ✓, Matching 88% ✓, ...")
**And** a special achievement sound plays (different from regular completion)
**And** a badge or achievement indicator is earned

**Given** I redo a mastered chapter
**When** the quiz completes
**Then** I see the normal completion screen (not the mastery celebration)

---

## Epic 6: Progress Tracking & History

**Goal:** Enable users to track their learning progress across all chapters with per-exercise-type breakdown and review quiz history.

### Story 6.1: Quiz Attempts and Progress Storage

As a developer,
I want quiz attempts and exercise type progress saved correctly after each quiz,
So that user progress, history, and exercise type mastery can be tracked and queried.

**Acceptance Criteria:**

**Given** a user completes a quiz
**When** the results are saved
**Then** the quiz attempt is stored in `quiz_attempts` with JSONB `answers_json` for full quiz replay
**And** `exercise_type_progress` is updated for this user + chapter + exercise type (best_score, attempts_count, mastered_at if ≥80%)
**And** `chapter_progress` is recalculated from `exercise_type_progress` (overall completion considering type coverage)

---

### Story 6.2: Chapter Progress Calculation (Factoring Type Coverage)

As a user,
I want chapter completion to factor in exercise type coverage,
So that my progress reflects breadth of practice, not just one exercise type.

**Acceptance Criteria:**

**Given** I have completed exercises for a chapter
**When** chapter progress is calculated
**Then** the completion percentage considers: number of types attempted, average score across types, and mastery status per type
**And** a chapter with only 1 type at 100% shows lower completion than a chapter with 4 types at 75%

---

### Story 6.3: Progress Overview Screen (Per-Exercise-Type)

As a user,
I want to view my progress across all chapters with per-exercise-type breakdown,
So that I can see my overall learning journey and which skills I've practiced.

**Acceptance Criteria:**

**Given** I navigate to the Progress tab
**When** the screen loads
**Then** I see a summary of my overall progress (e.g., "12/30 chapters completed")
**And** I see progress by book (Book 1: 8/15, Book 2: 4/15)
**And** I see total points earned and current streak
**And** I see per-exercise-type accuracy summary (e.g., "Vocabulary 85%, Grammar 70%, Matching 55%")

---

### Story 6.4: Activity Calendar (GitHub-Style)

As a user,
I want to see a GitHub-style activity calendar,
So that I can visualize my learning consistency.

**Acceptance Criteria:**

**Given** I am on the Progress screen
**When** I view the activity calendar
**Then** I see a month view with day squares
**And** days with activity are colored (primary color)
**And** days without activity are gray
**And** today is highlighted with a border
**And** I see "X days this month" counter below the calendar

**Given** I want to view previous months
**When** I tap the navigation arrows
**Then** the calendar scrolls to show previous/next months

---

### Story 6.5: Quiz History List (With Exercise Type)

As a user,
I want to view my quiz history with exercise type information,
So that I can review past performance across different exercise types.

**Acceptance Criteria:**

**Given** I am on the Progress screen
**When** I scroll to the quiz history section
**Then** I see a list of recent quiz attempts
**And** each entry shows: date, chapter name, score, **exercise type**, time ago
**And** the list is sorted by most recent first

**Given** I tap on a quiz history entry
**When** the details expand
**Then** I see which questions I missed with their explanations (optional enhancement)

---

## Epic 7: Gamification & Motivation

**Goal:** Enable users to earn points, track streaks, and stay motivated through gamification mechanics.

### Story 7.1: Points System Implementation

As a user,
I want to earn points for correct answers,
So that I feel rewarded for my learning efforts.

**Acceptance Criteria:**

**Given** I answer a question correctly
**When** the feedback is displayed
**Then** I earn points (e.g., +10 per correct answer)
**And** the points are immediately visible in the quiz UI
**And** points are synced to `users.total_points` in Supabase

**Given** I answer incorrectly
**When** the feedback is displayed
**Then** I earn no points for that question

---

### Story 7.2: Daily Activity Tracking

As a user,
I want the system to track my daily activity,
So that streak and calendar features work correctly.

**Acceptance Criteria:**

**Given** I complete any quiz
**When** the results are saved
**Then** a record is created in `daily_activity` table for today (if not exists)
**And** the record includes: user_id, activity_date, quizzes_completed, points_earned

**Given** I complete multiple quizzes in one day
**When** each quiz completes
**Then** the existing daily_activity record is updated (not duplicated)

---

### Story 7.3: Streak Calculation and Display

As a user,
I want to track my daily streak of consecutive active days,
So that I'm motivated to maintain consistency.

**Acceptance Criteria:**

**Given** I complete a quiz today
**When** the activity is recorded
**Then** the system checks if I was active yesterday
**And** if yes, `users.current_streak` is incremented
**And** if no (missed day), `users.current_streak` is reset to 1
**And** `users.streak_updated_at` is set to today

**Given** I view my streak
**When** the dashboard or progress screen loads
**Then** I see my current streak count (e.g., "🔥 7 day streak")

---

### Story 7.4: Streak Reset Logic

As a user,
I want my streak to reset after a missed day,
So that the streak accurately reflects consecutive activity.

**Acceptance Criteria:**

**Given** I was active yesterday and I complete a quiz today
**When** the streak is calculated
**Then** my streak increases by 1

**Given** I was NOT active yesterday and I complete a quiz today
**When** the streak is calculated
**Then** my streak resets to 1
**And** I see my new streak without guilt messaging

**Given** it's been multiple days since my last activity
**When** I complete a quiz
**Then** my streak resets to 1

---

### Story 7.5: Points Counter with Animation

As a user,
I want to see my total points with satisfying animations,
So that earning points feels rewarding.

**Acceptance Criteria:**

**Given** I am on the dashboard or completion screen
**When** points are displayed after earning
**Then** the points count up with a "tick tick tick" animation
**And** the animation takes ~1.5-2 seconds
**And** a subtle scale bounce occurs at the end

---

## Epic 8: Dashboard & Quick Continue

**Goal:** Enable users to see their learning status at a glance including weakness summary and quickly continue where they left off.

### Story 8.1: Dashboard Screen Layout (With Weakness Summary)

As a user,
I want to see a dashboard with my learning status, weakness summary, and quick actions at a glance,
So that I can quickly understand my progress, see areas needing review, and decide what to do.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I navigate to the Home tab
**Then** I see the dashboard screen
**And** the screen loads within 3 seconds (NFR3)
**And** the layout includes: stats row, continue card, **weakness summary card**, recent activity

---

### Story 8.2: Stats Row (Points & Streak)

As a user,
I want to see my streak and total points on the dashboard,
So that I'm reminded of my progress and motivated to continue.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** I view the stats row
**Then** I see my current streak with flame icon (e.g., "🔥 7")
**And** I see my total points (e.g., "⭐ 1,250")
**And** the stats are fetched from the server and cached

---

### Story 8.3: Continue Learning Card (Last Exercise Type + Chapter)

As a user,
I want to quickly continue where I left off with context about my last exercise type,
So that I can start learning with one tap.

**Acceptance Criteria:**

**Given** I have a chapter in progress
**When** I view the dashboard
**Then** I see a "Continue Learning" card
**And** the card shows the chapter name, last exercise type, and progress (e.g., "Book 2, Ch. 12 - Matching - 45%")
**And** a prominent "Continue" button is displayed

**Given** I tap the "Continue" button
**When** the navigation completes
**Then** I am taken to the Exercise Type Selection screen for that chapter (or directly to the last exercise type)

**Given** I have no chapter in progress
**When** I view the dashboard
**Then** I see a "Start Learning" card prompting me to select a book

---

### Story 8.6: Weakness Summary Card on Dashboard

As a user,
I want to see a brief weakness summary on the dashboard,
So that I'm aware of my focus areas and can quickly navigate to targeted practice.

**Acceptance Criteria:**

**Given** I have a weakness profile (at least some quiz attempts)
**When** I view the dashboard
**Then** I see a "Focus Areas" card showing my top 2-3 weak items (e.g., "會 vs 可以", "Sentence Construction 40%")
**And** a "View All" link navigates to the full Weakness Dashboard screen

**Given** I have no weakness data yet (new user)
**When** I view the dashboard
**Then** the weakness summary card is not shown (or shows "Complete your first quiz to see focus areas")

---

### Story 8.4: Recent Activity Summary

As a user,
I want to see my recent activity on the dashboard,
So that I can see what I've accomplished recently.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** I view the recent activity section
**Then** I see my last 3-5 quiz attempts
**And** each entry shows: chapter name, score, time ago (e.g., "2 hours ago")
**And** tapping "View All" navigates to the full quiz history

---

### Story 8.5: Book/Chapter Progress on Dashboard

As a user,
I want to see my book progress on the dashboard,
So that I can track my overall journey.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** I view the progress section
**Then** I see progress for Book 1 and Book 2
**And** each book shows chapters completed (e.g., "Book 1: 8/15 chapters")
**And** a visual progress bar indicates completion percentage

---

## Epic 9: Localization & Settings

**Goal:** Enable users to customize their app experience with language preferences and settings.

### Story 9.1: Settings Screen

As a user,
I want to access app settings,
So that I can customize my experience.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I navigate to the Settings tab
**Then** I see the settings screen
**And** options include: Language, Sound, Theme, Sign Out, About

---

### Story 9.2: Language Selection

As a user,
I want to change the display language,
So that I can use the app in my preferred language.

**Acceptance Criteria:**

**Given** I am on the settings screen
**When** I tap "Language"
**Then** I see language options: English, French, Japanese, Korean
**And** my current language is indicated

**Given** I select a new language
**When** the selection is confirmed
**Then** all UI text updates to the selected language
**And** the preference is saved to `useSettingsStore`
**And** Chinese content remains unchanged regardless of UI language (NFR21)

---

### Story 9.3: i18n Implementation

As a developer,
I want to implement internationalization infrastructure,
So that the app can support multiple languages.

**Acceptance Criteria:**

**Given** the mobile app codebase
**When** i18n is configured
**Then** translation files exist for: en.json, fr.json, ja.json, ko.json
**And** all UI strings use translation keys
**And** language can be switched at runtime

---

### Story 9.4: Quiz Instructions Localization

As a user,
I want quiz instructions in my selected language,
So that I understand what's being asked regardless of my UI language.

**Acceptance Criteria:**

**Given** I have selected French as my UI language
**When** I take a quiz
**Then** question prompts are in French (e.g., "Que signifie ce caractère?")
**And** answer feedback text is in French
**And** completion screen text is in French
**And** Chinese characters and pinyin remain unchanged (NFR21)

---

### Story 9.5: Sound and Theme Settings

As a user,
I want to control sound and theme settings,
So that I can customize the app to my preferences.

**Acceptance Criteria:**

**Given** I am on the settings screen
**When** I toggle "Sound Effects"
**Then** quiz sounds are enabled/disabled accordingly
**And** the preference persists across sessions

**Given** I am on the settings screen
**When** I select Theme (Light/Dark/System)
**Then** the app theme updates immediately
**And** the preference persists across sessions

---

## Epic 10: Performance Memory & Adaptive Learning

**Goal:** Enable the adaptive learning system that tracks per-question performance, builds weakness profiles, biases quiz generation toward weak areas, and provides a weakness dashboard for focused improvement.

### Story 10.1: Weakness Profile Query Service

As a developer,
I want the LangGraph agent to query the user's weakness profile from `question_results` before generating a quiz,
So that quiz content can be adaptively biased toward the user's weak areas.

**Acceptance Criteria:**

**Given** a quiz generation request is made
**When** the agent processes the request
**Then** the weakness service queries `question_results` for the user (via service key)
**And** aggregates: weak vocabulary items (<70% accuracy), weak grammar patterns (<70% accuracy), weak exercise types (<70% accuracy)
**And** the profile is computed within 2 seconds (NFR4)
**And** the profile is passed to the quiz generation node for biasing

**Given** the user has no question_results yet (new user)
**When** the weakness profile is queried
**Then** an empty profile is returned and quiz generation uses random selection (no biasing)

---

### Story 10.2: Adaptive Quiz Biasing (30-50% Weak Area Targeting)

As a user,
I want my quizzes to include extra questions on my weak areas,
So that I get more practice where I need it most.

**Acceptance Criteria:**

**Given** my weakness profile shows "會 vs 可以" as a weak vocabulary item and "Sentence Construction" as a weak exercise type
**When** I generate a "Mixed" quiz or any exercise type quiz
**Then** 30-50% of generated questions target my documented weak areas (FR33)
**And** the remaining questions cover standard chapter content
**And** the biasing is not visible during the quiz (no anxiety-inducing indicators)

**Given** the post-quiz completion screen is displayed
**When** I view the results
**Then** I see "This quiz focused on your focus areas: 會 vs 可以, Sentence Construction"
**And** per-weakness improvement shown (e.g., "會 vs 可以: 3/4 correct - up from 1/4 last time")

---

### Story 10.3: Weakness Dashboard Screen

As a user,
I want to view a comprehensive weakness dashboard showing my weak vocabulary, grammar patterns, and exercise type accuracy,
So that I can identify specific areas to improve and launch focused drills.

**Acceptance Criteria:**

**Given** I navigate to the Weakness Dashboard (from dashboard summary card or Progress tab)
**When** the screen loads
**Then** I see three sections:
  1. **Vocabulary Focus:** Cards for each weak vocabulary item (character + pinyin + correct meaning + miss count + trend arrow)
  2. **Grammar Focus:** Cards for weak grammar patterns (pattern name + example + accuracy %)
  3. **Exercise Type Accuracy:** Horizontal accuracy bars per exercise type (color-coded: green >80%, amber 50-79%, orange <50%)
**And** the header says "Your Focus Areas" (not "Weaknesses")
**And** trend arrows show improvement direction (up = improving in green, stable = amber)
**And** each item is a tappable WeakAreaDrillCard

---

### Story 10.4: Focused Drill from Weakness Dashboard

As a user,
I want to tap a weak area in the dashboard and launch a focused drill,
So that I can target specific weaknesses with dedicated practice.

**Acceptance Criteria:**

**Given** I am on the Weakness Dashboard
**When** I tap a weak vocabulary item (e.g., "會 vs 可以")
**Then** the AI generates a 10-question focused drill targeting that specific item
**And** the drill uses RAG retrieval filtered to chapters where the item was weak

**Given** I tap a weak exercise type (e.g., "Sentence Construction - 40%")
**When** the drill loads
**Then** the AI generates a 10-question exercise of that type from my weakest chapters

**Given** I complete a focused drill
**When** the results are shown
**Then** I see weakness-specific feedback: "會 vs 可以: 60% → 80% - Improving!" or "Keep practicing - you'll get it!"
**And** the weakness dashboard updates with the new accuracy
**And** items that reach 80%+ celebrate and move to "Mastered" section

---

### Story 10.5: Weakness Profile Real-Time Updates

As a user,
I want my weakness profile to update immediately after each quiz,
So that my progress is always current and the next quiz adapts to my latest performance.

**Acceptance Criteria:**

**Given** I complete any exercise
**When** question_results are saved to Supabase
**Then** the weakness profile reflects the new data within 2 seconds (NFR4)
**And** TanStack Query invalidates the weakness profile cache
**And** the dashboard weakness summary card refreshes

**Given** I improve on a previously weak item (crosses 70% threshold)
**When** the weakness profile is recalculated
**Then** the item is removed from the weakness dashboard
**And** future adaptive quizzes no longer target that item

---

### Story 10.6: Distinguishing "Never Practiced" vs "Practiced but Weak"

As a user,
I want the system to distinguish between content I've never practiced and content I've practiced but struggle with,
So that the weakness dashboard and adaptive system focus on real weaknesses, not just unexplored content.

**Acceptance Criteria:**

**Given** I have never attempted Matching exercises for Chapter 12
**When** I view the Exercise Type Selection screen
**Then** Matching shows "New" (not a weak area indicator)

**Given** I have attempted Matching for Chapter 12 with 40% accuracy
**When** I view the Exercise Type Selection screen
**Then** Matching shows "40%" with a teal (in progress) indicator
**And** the Weakness Dashboard includes Matching for Chapter 12 as a focus area

**Given** the adaptive system generates a quiz
**When** it biases toward weak areas
**Then** it only targets items with actual attempt history and low accuracy (FR36)
**And** "never practiced" items are not treated as weaknesses
