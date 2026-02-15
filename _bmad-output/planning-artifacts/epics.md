---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
workflowComplete: true
completedAt: 2026-02-15
inputDocuments:
  - '/home/maxime/repos/dangdai-app/_bmad-output/planning-artifacts/prd.md'
  - '/home/maxime/repos/dangdai-app/_bmad-output/planning-artifacts/architecture.md'
  - '/home/maxime/repos/dangdai-app/_bmad-output/planning-artifacts/ux-design-specification.md'
---

# dangdai-app - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for dangdai-app, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

- **FR1:** User can create account using email
- **FR2:** User can sign in using email
- **FR3:** User can sign in using Apple ID (iOS)
- **FR4:** User can sign out
- **FR5:** User can reset password (email accounts)
- **FR6:** System persists identity across sessions
- **FR7:** User can view available textbooks (Books 1-2)
- **FR8:** User can view chapters within a book
- **FR9:** User can select any chapter (open navigation, no gates)
- **FR10:** User can see chapter completion status at a glance
- **FR11:** User can start vocabulary quiz for selected chapter
- **FR12:** System generates questions via RAG + LLM using chapter content
- **FR13:** User answers questions (character ↔ pinyin ↔ meaning)
- **FR14:** User receives immediate feedback per answer
- **FR15:** User sees quiz results with score upon completion
- **FR16:** User can start grammar quiz for selected chapter
- **FR17:** System generates grammar questions via RAG + LLM
- **FR18:** User answers grammar questions (sentence completion, pattern recognition)
- **FR19:** User receives immediate feedback per answer
- **FR20:** User sees quiz results with score upon completion
- **FR21:** User can take chapter test combining vocabulary and grammar
- **FR22:** User sees chapter mastery status after assessment
- **FR23:** System tracks quiz scores per chapter
- **FR24:** System calculates chapter completion percentage
- **FR25:** User can view progress across all chapters
- **FR26:** User can view quiz history
- **FR27:** System awards points for correct answers
- **FR28:** System tracks daily streak (consecutive active days)
- **FR29:** User can view current streak
- **FR30:** User can view total points
- **FR31:** System resets streak after missed day
- **FR32:** User can view dashboard with recent activity
- **FR33:** User can see book/chapter progress on dashboard
- **FR34:** User can see streak and points on dashboard
- **FR35:** User can quickly continue where they left off

### NonFunctional Requirements

- **NFR1:** Quiz generation completes within 5 seconds (loading indicator displayed)
- **NFR2:** Screen navigation completes within 500ms
- **NFR3:** App launches to usable state within 3 seconds
- **NFR4:** Authentication via Supabase Auth only
- **NFR5:** Apple Sign-In follows Apple security guidelines
- **NFR6:** API keys stored securely (not in client bundle)
- **NFR7:** All data transmitted over HTTPS
- **NFR8:** Quiz progress saved after each answer (crash-safe)
- **NFR9:** Progress persists across app restarts and devices
- **NFR10:** Data synced to server within 5 seconds of activity
- **NFR11:** Supabase connection required for core functionality
- **NFR12:** LLM API failures display user-friendly error
- **NFR13:** Apple Sign-In available on iOS devices
- **NFR14:** "No connection" displayed immediately when offline
- **NFR15:** No cached content or offline functionality in MVP
- **NFR16:** System supports 100 concurrent users (12-month target)
- **NFR17:** Supabase handles scaling (no special infrastructure for MVP)
- **NFR18:** UI supports English, French, Japanese, Korean
- **NFR19:** Quiz instructions generated in user's selected language
- **NFR20:** User can change display language in settings
- **NFR21:** Chinese content unchanged regardless of UI language

### Additional Requirements

**From Architecture - Starter Templates (CRITICAL for Epic 1 Story 1):**
- Mobile App initialization: `yarn create tamagui@latest --template expo-router`
- Python Backend initialization: `langgraph new --template=new-langgraph-project-python dangdai-api`

**From Architecture - Infrastructure:**
- Supabase PostgreSQL for user data, progress, auth
- Supabase pgvector for Dangdai content embeddings (existing RAG system)
- Python backend (LangGraph + FastAPI) for RAG/quiz generation
- Azure Container Apps for Python backend hosting
- Terraform for infrastructure as code
- GitHub Actions for CI/CD

**From Architecture - Data Architecture:**
- Hybrid data modeling (normalized + aggregates)
- Tables: `users`, `quiz_attempts`, `chapter_progress`, `daily_activity`
- Cached aggregates on users table (total_points, current_streak, streak_updated_at)

**From Architecture - State Management:**
- TanStack Query v5 for server state (user profile, progress, quiz history)
- Zustand v5 for local state (quiz state, UI preferences, theme)

**From Architecture - API Patterns:**
- REST API between mobile and Python backend
- Supabase JS client for direct mobile-to-Supabase communication
- JWT token passing via Authorization header
- Python backend verifies Supabase JWT

**From Architecture - Error Handling:**
- TanStack Query retry: 1 for API calls
- Custom error boundary for React components
- Toast notifications for recoverable errors

**From UX Design - UI/UX Requirements:**
- Tamagui as UI framework with custom playful theme
- Sound + visual feedback for correct/incorrect answers (ding/bonk sounds)
- GitHub-style activity calendar for progress tracking
- Weekly/monthly activity counts (no streak guilt mechanics)
- Full-screen celebration for exercise completion with points tally animation
- Loading tips during 5-second quiz generation
- Portrait-only orientation
- Minimum 48px touch targets
- 72px Chinese characters for quiz display
- Light and dark mode support
- Gentle orange for wrong answers (not harsh red)

**From UX Design - Component Requirements:**
- QuizQuestionCard with correct/incorrect states
- AnswerOptionGrid (2x2 grid and list variants)
- TextInputAnswer for typed responses
- ActivityCalendar (week and month views)
- PointsCounter with count-up animation
- CompletionScreen with celebration sequence
- ChapterListItem with progress states
- BookCard with overall progress
- FeedbackOverlay with auto-advance

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
| FR10 | Epic 3 | User can see chapter completion status |
| FR11 | Epic 4 | User can start vocabulary quiz |
| FR12 | Epic 4 | System generates questions via RAG + LLM |
| FR13 | Epic 4 | User answers questions |
| FR14 | Epic 4 | User receives immediate feedback |
| FR15 | Epic 4 | User sees quiz results with score |
| FR16 | Epic 4 | User can start grammar quiz |
| FR17 | Epic 4 | System generates grammar questions |
| FR18 | Epic 4 | User answers grammar questions |
| FR19 | Epic 4 | User receives immediate feedback |
| FR20 | Epic 4 | User sees quiz results with score |
| FR21 | Epic 5 | User can take chapter test |
| FR22 | Epic 5 | User sees chapter mastery status |
| FR23 | Epic 6 | System tracks quiz scores per chapter |
| FR24 | Epic 6 | System calculates chapter completion % |
| FR25 | Epic 6 | User can view progress across chapters |
| FR26 | Epic 6 | User can view quiz history |
| FR27 | Epic 7 | System awards points for correct answers |
| FR28 | Epic 7 | System tracks daily streak |
| FR29 | Epic 7 | User can view current streak |
| FR30 | Epic 7 | User can view total points |
| FR31 | Epic 7 | System resets streak after missed day |
| FR32 | Epic 8 | User can view dashboard with recent activity |
| FR33 | Epic 8 | User can see book/chapter progress on dashboard |
| FR34 | Epic 8 | User can see streak and points on dashboard |
| FR35 | Epic 8 | User can quickly continue where left off |

## Epic List

### Epic 1: Project Foundation & Infrastructure
**Goal:** Establish the complete technical foundation so that development teams can begin building user-facing features with all infrastructure, tooling, and base architecture in place.

**User Outcome:** Development environment ready with mobile app scaffold, Python backend scaffold, Supabase database schema, and deployment pipeline configured.

**FRs covered:** None directly (enables all FRs)
**NFRs addressed:** NFR4, NFR6, NFR7, NFR11, NFR16, NFR17

---

### Epic 2: User Authentication & Identity
**Goal:** Enable users to create accounts, sign in, and maintain their identity across sessions so they can begin their personalized learning journey.

**User Outcome:** Users can register, login (email or Apple ID), sign out, reset password, and have their identity persist across sessions.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6
**NFRs addressed:** NFR4, NFR5, NFR7, NFR13

---

### Epic 3: Content Navigation & Book Selection
**Goal:** Enable users to browse available Dangdai textbooks and chapters, selecting any chapter to study without restrictions.

**User Outcome:** Users can view Books 1-2, see all chapters within each book, select any chapter freely (open navigation), and see chapter completion status at a glance.

**FRs covered:** FR7, FR8, FR9, FR10
**NFRs addressed:** NFR2

---

### Epic 4: Quiz Experience & Feedback
**Goal:** Enable users to take vocabulary and grammar quizzes with AI-generated questions and receive immediate, satisfying feedback on their answers.

**User Outcome:** Users can start vocabulary/grammar quizzes, answer questions (character ↔ pinyin ↔ meaning), receive immediate visual/audio feedback per answer, and see quiz results with scores.

**FRs covered:** FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20
**NFRs addressed:** NFR1, NFR2, NFR8, NFR12

---

### Epic 5: Chapter Assessment & Mastery
**Goal:** Enable users to take comprehensive chapter tests and achieve chapter mastery status.

**User Outcome:** Users can take chapter tests combining vocabulary and grammar, see chapter mastery status (80%+ threshold), and receive special celebration for mastery achievement.

**FRs covered:** FR21, FR22
**NFRs addressed:** NFR8, NFR9

---

### Epic 6: Progress Tracking & History
**Goal:** Enable users to track their learning progress across all chapters and review their quiz history.

**User Outcome:** Users can view quiz scores per chapter, see chapter completion percentages, view progress across all chapters, and access their complete quiz history.

**FRs covered:** FR23, FR24, FR25, FR26
**NFRs addressed:** NFR9, NFR10

---

### Epic 7: Gamification & Motivation
**Goal:** Enable users to earn points, track streaks, and stay motivated through gamification mechanics.

**User Outcome:** Users earn points for correct answers, track daily streaks, view current streak and total points, with streak reset logic after missed days.

**FRs covered:** FR27, FR28, FR29, FR30, FR31
**NFRs addressed:** NFR9, NFR10

---

### Epic 8: Dashboard & Quick Continue
**Goal:** Enable users to see their learning status at a glance and quickly continue where they left off.

**User Outcome:** Users can view dashboard with recent activity, see book/chapter progress, see streak and points, and one-tap continue to their current learning position.

**FRs covered:** FR32, FR33, FR34, FR35
**NFRs addressed:** NFR2, NFR3

---

### Epic 9: Localization & Settings
**Goal:** Enable users to customize their app experience with language preferences and settings.

**User Outcome:** Users can change display language (English, French, Japanese, Korean), receive quiz instructions in their selected language, with Chinese content unchanged.

**FRs covered:** None directly (enhances all user experience)
**NFRs addressed:** NFR18, NFR19, NFR20, NFR21

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
I want to configure the Supabase project with the base database schema,
So that authentication and data storage foundations are ready.

**Acceptance Criteria:**

**Given** a Supabase project exists
**When** I apply the initial migration
**Then** the `users` table is created with columns: id, email, display_name, total_points, current_streak, streak_updated_at, created_at, updated_at
**And** Supabase Auth is configured for email and Apple Sign-In
**And** Row Level Security (RLS) is enabled on the users table
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

**Goal:** Enable users to browse available Dangdai textbooks and chapters, selecting any chapter to study without restrictions.

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

### Story 3.3: Chapter Completion Status Display

As a user,
I want to see chapter completion status at a glance,
So that I know my progress and which chapters need more work.

**Acceptance Criteria:**

**Given** I am on the chapter list screen
**When** I view a chapter that I have not started
**Then** the chapter shows "0%" or "Not started" indicator

**Given** I have partially completed a chapter
**When** I view that chapter in the list
**Then** the chapter shows the completion percentage (e.g., "45%")

**Given** I have mastered a chapter (80%+)
**When** I view that chapter in the list
**Then** the chapter shows a checkmark and "Mastered" or "100%" indicator

---

### Story 3.4: Open Chapter Navigation (No Gates)

As a user,
I want to select any chapter freely without restrictions,
So that I can study the content that matches my current learning needs.

**Acceptance Criteria:**

**Given** I am on the chapter list screen
**When** I tap on any chapter (regardless of completion status of other chapters)
**Then** I can start a quiz for that chapter
**And** no "unlock" or "complete previous chapters first" message is shown

**Given** I have never used the app before
**When** I navigate to Book 2, Chapter 10
**Then** I can immediately start a quiz for that chapter

---

## Epic 4: Quiz Experience & Feedback

**Goal:** Enable users to take vocabulary and grammar quizzes with AI-generated questions and receive immediate, satisfying feedback on their answers.

### Story 4.1: Quiz Generation API Endpoint

As a developer,
I want to implement the quiz generation API endpoint in the Python backend,
So that the mobile app can request AI-generated quizzes for any chapter.

**Acceptance Criteria:**

**Given** the Python backend is running
**When** a POST request is made to `/api/quizzes` with `{ "chapter_id": 10, "book_id": 2, "quiz_type": "vocabulary" }`
**Then** the RAG system retrieves chapter content from pgvector
**And** the LLM generates 10-15 quiz questions
**And** the response includes `{ "quiz_id": "...", "questions": [...] }`
**And** the response is returned within 5 seconds (NFR1)

**Given** the chapter_id is invalid
**When** the request is made
**Then** a 404 error with `{ "detail": "Chapter not found" }` is returned

---

### Story 4.2: Quiz Loading Screen with Tips

As a user,
I want to see an engaging loading screen while quiz questions are generated,
So that I stay entertained during the ~5 second wait.

**Acceptance Criteria:**

**Given** I have selected a chapter and tapped "Start Quiz"
**When** quiz generation is in progress
**Then** I see a loading animation (rotating Chinese character or bouncing element)
**And** I see rotating learning tips that change every 2 seconds
**And** a cancel button is available to return to chapter list

**Given** quiz generation fails
**When** the error is received
**Then** I see a friendly error message "Couldn't load questions"
**And** a "Try Again" button is displayed (NFR12)

---

### Story 4.3: Vocabulary Quiz Question Display

As a user,
I want to see vocabulary quiz questions with clear Chinese character display,
So that I can read and understand what I'm being asked.

**Acceptance Criteria:**

**Given** a vocabulary quiz has loaded
**When** I view a question
**Then** I see the question type label (e.g., "What does this mean?")
**And** the Chinese character is displayed at 72px minimum
**And** pinyin is shown below the character when applicable
**And** a progress bar shows my position in the quiz (e.g., "3/10")

---

### Story 4.4: Answer Selection with 2x2 Grid

As a user,
I want to select my answer from a 2x2 grid of options,
So that I can quickly tap my choice on mobile.

**Acceptance Criteria:**

**Given** I am viewing a multiple-choice question
**When** the answer options load
**Then** 4 options are displayed in a 2x2 grid layout
**And** each option has a minimum touch target of 48x48px
**And** tapping an option selects it visually (highlighted border)

**Given** I tap an answer option
**When** my selection is registered
**Then** the answer is submitted immediately
**And** I cannot change my answer after submission

---

### Story 4.5: Immediate Answer Feedback (Visual + Sound)

As a user,
I want to receive immediate visual and audio feedback on my answer,
So that I know instantly if I was correct and feel rewarded.

**Acceptance Criteria:**

**Given** I have submitted a correct answer
**When** feedback is displayed
**Then** the selected option shows a green border and checkmark
**And** a satisfying "ding" sound plays
**And** points increment is shown (+10 or similar)
**And** the feedback displays for ~1 second before auto-advancing

**Given** I have submitted an incorrect answer
**When** feedback is displayed
**Then** the selected option shows an orange border (not harsh red)
**And** the correct answer is highlighted in green
**And** a gentle "bonk" sound plays
**And** the feedback displays for ~1 second before auto-advancing

---

### Story 4.6: Quiz Progress Saving (Crash-Safe)

As a user,
I want my quiz progress saved after each answer,
So that I don't lose progress if the app crashes or I leave.

**Acceptance Criteria:**

**Given** I am taking a quiz
**When** I answer a question
**Then** my answer and score are saved to local state immediately
**And** progress is synced to Supabase within 5 seconds (NFR10)

**Given** the app crashes mid-quiz
**When** I reopen the app
**Then** I can resume from where I left off (NFR8)

---

### Story 4.7: Grammar Quiz Question Types

As a user,
I want to take grammar quizzes with sentence completion and pattern recognition questions,
So that I can practice grammar patterns from the chapter.

**Acceptance Criteria:**

**Given** I start a grammar quiz for a chapter
**When** the quiz loads
**Then** questions test grammar patterns (sentence completion, fill-in-the-blank)
**And** answer options may include longer text (list layout instead of 2x2 when needed)
**And** the same feedback patterns (sound, visual) apply as vocabulary quizzes

---

### Story 4.8: Quiz Results Screen

As a user,
I want to see my quiz results with score upon completion,
So that I know how well I performed.

**Acceptance Criteria:**

**Given** I have answered all quiz questions
**When** the quiz completes
**Then** I see a completion screen with celebration animation
**And** my score is displayed (e.g., "8/10 correct - 80%")
**And** points earned are shown with count-up animation
**And** "You struggled with:" section shows missed items (if any)
**And** a "Continue" button returns me to the chapter list or dashboard

---

### Story 4.9: Text Input Answer Type

As a user,
I want to type my answer for certain question types,
So that I can practice recall without multiple choice hints.

**Acceptance Criteria:**

**Given** a question requires typed input (pinyin or meaning)
**When** I view the question
**Then** a text input field is displayed instead of the 2x2 grid
**And** placeholder text shows what to enter (e.g., "Type the pinyin...")
**And** I can submit with Enter key or Submit button

**Given** I submit a typed answer
**When** the answer is validated
**Then** correct/incorrect feedback is shown with the same visual/audio patterns
**And** for incorrect answers, the correct answer is displayed

---

## Epic 5: Chapter Assessment & Mastery

**Goal:** Enable users to take comprehensive chapter tests and achieve chapter mastery status.

### Story 5.1: Chapter Test (Combined Vocabulary + Grammar)

As a user,
I want to take a comprehensive chapter test combining vocabulary and grammar,
So that I can assess my overall mastery of the chapter.

**Acceptance Criteria:**

**Given** I am on a chapter screen with progress < 80%
**When** I tap "Take Chapter Test"
**Then** a quiz is generated with ~20 questions mixing vocabulary and grammar
**And** the quiz includes cumulative review from previous chapters
**And** the same quiz UI and feedback patterns are used

**Given** the chapter test is in progress
**When** I view the progress bar
**Then** I see "Chapter Test" label to distinguish from regular quizzes

---

### Story 5.2: Chapter Mastery Calculation

As a user,
I want the system to calculate my chapter mastery based on test performance,
So that I know when I've truly learned the material.

**Acceptance Criteria:**

**Given** I complete a chapter test
**When** the results are calculated
**Then** my chapter completion percentage is updated in `chapter_progress` table
**And** the percentage reflects weighted scores from all quiz attempts

**Given** my chapter score reaches 80% or higher
**When** the mastery threshold is checked
**Then** the chapter is marked as "Mastered" in the database

---

### Story 5.3: Chapter Mastery Celebration

As a user,
I want to receive a special celebration when I master a chapter,
So that I feel accomplished and motivated to continue.

**Acceptance Criteria:**

**Given** I complete a chapter test with 80%+ score
**When** this is my first time mastering the chapter
**Then** I see an enhanced celebration screen with special animation
**And** a "Chapter Mastered!" message is prominently displayed
**And** a special achievement sound plays (different from regular completion)
**And** a badge or achievement indicator is shown

**Given** I redo a mastered chapter and score 80%+
**When** the quiz completes
**Then** I see the normal completion screen (not the mastery celebration)

---

## Epic 6: Progress Tracking & History

**Goal:** Enable users to track their learning progress across all chapters and review their quiz history.

### Story 6.1: Quiz Attempts Database Schema

As a developer,
I want to store quiz attempts in the database,
So that user progress and history can be tracked and queried.

**Acceptance Criteria:**

**Given** the Supabase database exists
**When** I apply the migration
**Then** the `quiz_attempts` table is created with columns: id, user_id, chapter_id, book_id, quiz_type, score, total_questions, answers_json, created_at
**And** the `chapter_progress` table is created with columns: id, user_id, chapter_id, book_id, completion_percentage, mastered_at, updated_at
**And** RLS policies allow users to read/write only their own data

---

### Story 6.2: Chapter Progress Calculation and Storage

As a user,
I want the system to track my quiz scores per chapter,
So that my progress is accurately calculated.

**Acceptance Criteria:**

**Given** I complete a quiz
**When** the results are saved
**Then** the quiz attempt is stored in `quiz_attempts` table
**And** the `chapter_progress` table is updated with new completion percentage
**And** the calculation considers all attempts for that chapter

---

### Story 6.3: Progress Overview Screen

As a user,
I want to view my progress across all chapters,
So that I can see my overall learning journey.

**Acceptance Criteria:**

**Given** I navigate to the Progress tab
**When** the screen loads
**Then** I see a summary of my overall progress (e.g., "12/30 chapters completed")
**And** I see progress by book (Book 1: 8/15, Book 2: 4/15)
**And** I see total points earned
**And** I see current streak

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

### Story 6.5: Quiz History List

As a user,
I want to view my quiz history,
So that I can review past performance and identify patterns.

**Acceptance Criteria:**

**Given** I am on the Progress screen
**When** I scroll to the quiz history section
**Then** I see a list of recent quiz attempts
**And** each entry shows: date, chapter name, score, quiz type
**And** the list is sorted by most recent first

**Given** I tap on a quiz history entry
**When** the details expand
**Then** I see which questions I missed (optional enhancement)

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

**Goal:** Enable users to see their learning status at a glance and quickly continue where they left off.

### Story 8.1: Dashboard Screen Layout

As a user,
I want to see a dashboard with my learning status at a glance,
So that I can quickly understand my progress and decide what to do.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I navigate to the Home tab
**Then** I see the dashboard screen
**And** the screen loads within 3 seconds (NFR3)
**And** the layout includes: stats row, continue card, recent activity

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

### Story 8.3: Continue Learning Card

As a user,
I want to quickly continue where I left off,
So that I can start learning with one tap.

**Acceptance Criteria:**

**Given** I have a chapter in progress
**When** I view the dashboard
**Then** I see a "Continue Learning" card
**And** the card shows the chapter name and progress (e.g., "Book 2, Ch. 10 - 45%")
**And** a prominent "Continue" button is displayed

**Given** I tap the "Continue" button
**When** the navigation completes
**Then** I am taken directly to start a quiz for that chapter

**Given** I have no chapter in progress
**When** I view the dashboard
**Then** I see a "Start Learning" card prompting me to select a book

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
