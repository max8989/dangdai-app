---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics']
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

{{requirements_coverage_map}}

## Epic List

{{epics_list}}

<!-- Repeat for each epic in epics_list (N = 1, 2, 3...) -->

## Epic {{N}}: {{epic_title_N}}

{{epic_goal_N}}

<!-- Repeat for each story (M = 1, 2, 3...) within epic N -->

### Story {{N}}.{{M}}: {{story_title_N_M}}

As a {{user_type}},
I want {{capability}},
So that {{value_benefit}}.

**Acceptance Criteria:**

<!-- for each AC on this story -->

**Given** {{precondition}}
**When** {{action}}
**Then** {{expected_outcome}}
**And** {{additional_criteria}}

<!-- End story repeat -->
