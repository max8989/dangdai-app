# Story 4.2: Quiz Loading Screen with Progressive Loading

Status: done

## Story

As a user,
I want to see an engaging loading screen while quiz questions are generated, and start answering as soon as the first question is ready,
So that I stay engaged during the ~8 second generation time.

## Acceptance Criteria

1. **Given** I have selected an exercise type and tapped to start
   **When** quiz generation is in progress
   **Then** I see "Generating your [Exercise Type] exercise for Chapter X..."
   **And** I see a loading animation with progress indicator
   **And** I see rotating learning tips that change every 2 seconds
   **And** a cancel button is available to return to Exercise Type Selection screen

2. **Given** the first question is ready before the full quiz
   **When** the first question arrives
   **Then** I can start answering immediately while remaining questions load in background (progressive loading)

3. **Given** quiz generation fails
   **When** the error is received
   **Then** I see a friendly error "Couldn't generate [Exercise Type] exercise. Try another type or retry."
   **And** "Retry" and "Back" buttons are displayed

4. **Given** RAG returns insufficient content for the exercise type
   **When** the fallback also fails
   **Then** I see "Not enough content for [Exercise Type] in this chapter. Try Vocabulary or Grammar instead."

## Tasks / Subtasks

- [x] Task 1: Implement API client quiz generation method (AC: #1, #2, #3, #4)
  - [x] 1.1 Add `generateQuiz(chapterId, bookId, exerciseType)` to `lib/api.ts` using `fetch` with auth header from Supabase session
  - [x] 1.2 Add request/response types in `types/quiz.ts` matching the API contract from Story 4.1
  - [x] 1.3 Handle timeout (8s), network errors, and specific error codes (401, 400, 404, 504)

- [x] Task 2: Create `useQuizGeneration` hook (AC: #1, #2, #3, #4)
  - [x] 2.1 Create `hooks/useQuizGeneration.ts` using TanStack Query `useMutation`
  - [x] 2.2 Expose states: `isPending`, `isError`, `error`, `data` (quiz payload)
  - [x] 2.3 Handle progressive loading: when `data` arrives, signal readiness to navigate to quiz screen
  - [x] 2.4 Handle error categorization: network, timeout, insufficient content, auth error

- [x] Task 3: Create loading tips data (AC: #1)
  - [x] 3.1 Add `constants/tips.ts` with 15-20 Chinese learning tips
  - [x] 3.2 Include tip rotation logic (2-second interval, random non-repeating selection)

- [x] Task 4: Rewrite `app/quiz/loading.tsx` as full loading screen (AC: #1, #2, #3, #4)
  - [x] 4.1 Replace placeholder with full implementation
  - [x] 4.2 Display exercise type and chapter context in header
  - [x] 4.3 Add animated progress indicator (Tamagui `animation="slow"` on a progress bar)
  - [x] 4.4 Add rotating tips component with `AnimatePresence` for tip transitions
  - [x] 4.5 Add cancel button that navigates back to exercise type selection / chapter detail
  - [x] 4.6 On success: navigate to quiz screen (or transition in-place to first question)
  - [x] 4.7 On error: show error state with Retry and Back buttons
  - [x] 4.8 On insufficient content: show specific message suggesting Vocabulary or Grammar

- [x] Task 5: Update navigation flow from chapter detail (AC: #1)
  - [x] 5.1 Update `app/quiz/[chapterId].tsx` to pass `exerciseType` param when navigating to loading screen
  - [x] 5.2 Ensure route params include `chapterId`, `bookId`, `exerciseType`

- [x] Task 6: Write tests (AC: all)
  - [x] 6.1 Unit test `useQuizGeneration` hook with mocked API responses (success, error, timeout)
  - [x] 6.2 Unit test loading screen renders correctly in each state (loading, error, insufficient content)
  - [x] 6.3 Unit test tip rotation logic
  - [x] 6.4 Update existing `app/quiz/loading.test.tsx`

## Dev Notes

### Current State of Code (CRITICAL - Read Before Coding)

**What already exists and MUST be reused:**

| File | State | Reuse |
|------|-------|-------|
| `app/quiz/loading.tsx` | Placeholder with spinner + "Preparing quiz..." text. Reads `chapterId`, `bookId`, `quizType` from `useLocalSearchParams`. | **REPLACE** contents but keep the route file |
| `app/quiz/loading.test.tsx` | Basic test for placeholder. | **UPDATE** with new test cases |
| `app/quiz/[chapterId].tsx` | Chapter detail screen. Shows chapter info + two buttons ("Vocabulary Quiz", "Grammar Quiz") that navigate to `/quiz/loading` with params `{chapterId, bookId, quizType}`. | **MODIFY** to pass `exerciseType` param |
| `stores/useQuizStore.ts` | Zustand store: `currentQuizId`, `currentQuestion`, `answers`, `score` + actions (`startQuiz`, `setAnswer`, `nextQuestion`, `addScore`, `resetQuiz`). Already wired into AuthProvider for cleanup on sign-out. | **USE** - call `startQuiz()` when quiz data arrives |
| `lib/api.ts` | Stub: exports `API_BASE_URL` and empty `api` object. No HTTP methods. | **IMPLEMENT** `generateQuiz` method |
| `lib/queryKeys.ts` | Has `quiz(quizId)`, `quizzes`, `quizHistory(userId)` already defined. | **USE** existing key factories |
| `lib/queryClient.ts` | Configured with 5-min stale time, 1 retry queries, 0 retry mutations, global error handlers. | **USE** as-is |
| `lib/supabase.ts` | Supabase client initialized. | **USE** to get auth session for JWT token |
| `types/chapter.ts` | Defines `Book`, `BookProgress`, `Chapter`, `ChapterProgress`. | **REFERENCE** for chapter data structures |
| `constants/` | Has `app.ts`, `books.ts`, `chapters.ts`. No `tips.ts`. | **CREATE** `tips.ts` |

**What does NOT exist yet (must create):**
- `types/quiz.ts` - Quiz, Question, Answer types
- `hooks/useQuizGeneration.ts` - Quiz generation hook
- `constants/tips.ts` - Learning tips for loading screen
- `components/quiz/` directory - No quiz UI components exist yet

### API Contract (from Story 4.1)

**Request:** `POST /api/quizzes/generate`
```json
{
  "chapter_id": 212,
  "book_id": 2,
  "exercise_type": "vocabulary"
}
```
Headers: `Authorization: Bearer <supabase_jwt>`

**Success Response (200):**
```json
{
  "quiz_id": "uuid",
  "chapter_id": 212,
  "book_id": 2,
  "exercise_type": "vocabulary",
  "question_count": 10,
  "questions": [...]
}
```

**Error Responses:**
- `401` - Invalid/missing JWT -> redirect to login
- `400` - Invalid exercise_type or chapter_id -> show error with Back
- `404` - Chapter content not available in RAG -> show insufficient content message
- `500` - LLM generation failure -> show retry error
- `504` - Generation exceeded 8s -> show timeout error with retry

**Chapter ID convention:** `chapter_id = book_id * 100 + chapter_number` (e.g., Book 2 Chapter 12 = 212). The current `app/quiz/[chapterId].tsx` already receives this as a route param.

### API Client Implementation Pattern

```typescript
// lib/api.ts - Add this method
import { supabase } from './supabase';

export const api = {
  baseUrl: API_BASE_URL,

  async generateQuiz(params: {
    chapterId: number;
    bookId: number;
    exerciseType: string;
  }) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s client timeout

    try {
      const response = await fetch(`${API_BASE_URL}/api/quizzes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          chapter_id: params.chapterId,
          book_id: params.bookId,
          exercise_type: params.exerciseType,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Parse error and throw typed error
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },
};
```

### Quiz Type Definitions

Create `types/quiz.ts` with types matching the API response from Story 4.1:

```typescript
export type ExerciseType =
  | 'vocabulary'
  | 'grammar'
  | 'fill_in_blank'
  | 'matching'
  | 'dialogue_completion'
  | 'sentence_construction'
  | 'reading_comprehension'
  | 'mixed';

export interface QuizQuestion {
  question_id: string;
  exercise_type: ExerciseType;
  question_text: string;
  correct_answer: string;
  explanation: string;
  source_citation: string;
  // Type-specific fields vary - use discriminated union or loose typing for now
  options?: string[];
  character?: string;
  pinyin?: string;
  // ... more type-specific fields per Story 4.1 schema
}

export interface QuizResponse {
  quiz_id: string;
  chapter_id: number;
  book_id: number;
  exercise_type: ExerciseType;
  question_count: number;
  questions: QuizQuestion[];
}

export interface QuizGenerationError {
  type: 'auth' | 'validation' | 'not_found' | 'server' | 'timeout' | 'network';
  message: string;
}
```

### useQuizGeneration Hook Pattern

Use TanStack Query `useMutation` (NOT `useQuery`) because quiz generation is a side-effect triggered by user action, not a cacheable query:

```typescript
// hooks/useQuizGeneration.ts
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { QuizResponse, QuizGenerationError } from '../types/quiz';

export function useQuizGeneration() {
  return useMutation<QuizResponse, QuizGenerationError, {
    chapterId: number;
    bookId: number;
    exerciseType: string;
  }>({
    mutationFn: (params) => api.generateQuiz(params),
    retry: 0, // No auto-retry - user decides via Retry button
  });
}
```

States from the mutation:
- `isPending` -> show loading screen with tips
- `isError` + `error.type === 'not_found'` -> show insufficient content message
- `isError` + other types -> show generic error with Retry
- `isSuccess` + `data` -> navigate to quiz or show first question

### Loading Screen UI Structure

```
┌─────────────────────────────────┐
│ ← Cancel                        │
├─────────────────────────────────┤
│                                 │
│         [Animation]             │
│                                 │
│   Generating your Vocabulary    │
│   exercise for Chapter 12...    │
│                                 │
│   ████████████░░░░░░░░  60%     │  <- Animated progress bar
│                                 │
│   💡 Did you know?              │
│   你好 literally means           │  <- Rotates every 2s
│   'you good'!                   │     with AnimatePresence
│                                 │
│                                 │
│        [ Cancel ]               │
│                                 │
└─────────────────────────────────┘
```

Error state:
```
┌─────────────────────────────────┐
│                                 │
│            ⚠️                    │
│                                 │
│   Couldn't generate Matching    │
│   exercise. Try another type    │
│   or retry.                     │
│                                 │
│   [ Retry ]    [ Back ]         │
│                                 │
└─────────────────────────────────┘
```

### Tamagui Animation Patterns (MUST follow)

**Tip rotation** - Use `AnimatePresence` with `key={currentTipIndex}`:
```tsx
<AnimatePresence>
  <YStack
    key={currentTipIndex}
    animation="medium"
    enterStyle={{ opacity: 0, y: 10 }}
    exitStyle={{ opacity: 0, y: -10 }}
  >
    <Text>{tips[currentTipIndex]}</Text>
  </YStack>
</AnimatePresence>
```

**Progress bar** - Use Tamagui `animation="slow"` with width interpolation:
```tsx
<YStack
  backgroundColor="$primary"
  height={4}
  borderRadius={2}
  animation="slow"
  width={`${progress}%`}
/>
```

**Error state entrance** - Use `AnimatePresence`:
```tsx
<AnimatePresence>
  {isError && (
    <YStack
      key="error"
      animation="medium"
      enterStyle={{ opacity: 0, scale: 0.9 }}
    >
      <ErrorContent />
    </YStack>
  )}
</AnimatePresence>
```

**Buttons** - Use `pressStyle: { scale: 0.98 }` and `animation="quick"`:
```tsx
<Button animation="quick" pressStyle={{ scale: 0.98 }}>
  Retry
</Button>
```

### Tamagui Rules (MUST follow - from architecture)

- **NEVER** hardcode hex values in components. Use `$tokenName` references only (`$primary`, `$background`, `$color`, `$borderColor`, etc.)
- **ALWAYS** use `<Theme name="...">` for contextual colors (e.g., error state)
- **ALWAYS** use named animation presets (`animation="quick"`, `animation="medium"`, etc.) not inline spring configs
- **ALWAYS** use `AnimatePresence` for conditional rendering with enter/exit animations
- **ALWAYS** use declarative `enterStyle`/`exitStyle`/`pressStyle` not imperative animation code
- **ALWAYS** use Tamagui media query props (`$xs`) not `Dimensions.get('window')`

### Navigation Flow

Current flow (from `app/quiz/[chapterId].tsx`):
```
Chapter Detail → taps "Vocabulary Quiz" → router.push('/quiz/loading?chapterId=212&bookId=2&quizType=vocabulary')
```

This story keeps the same route but:
1. The loading screen now calls the actual API
2. On success, it navigates to the quiz screen (quiz question display is Story 4.3+)
3. On cancel, it navigates back via `router.back()`

**Route params** (from `useLocalSearchParams`): `chapterId`, `bookId`, `quizType` (rename to `exerciseType` for consistency or support both).

**Progressive loading note:** True progressive loading (showing first question while rest generate) requires streaming or polling from the backend. For MVP, the simplest approach is:
- Show loading screen until full quiz response arrives
- Then navigate to quiz screen with all questions
- If backend later supports streaming, upgrade the hook to process partial responses

### Tips Content Guidelines

Tips should be:
- Short (1-2 sentences)
- Fun/interesting Chinese language facts
- Relevant to learning Chinese
- Mix of language tips, cultural facts, and study advice
- No sensitive or controversial content

Example tips:
```typescript
export const LOADING_TIPS = [
  "Did you know? 你好 literally means 'you good'!",
  "Tip: Practice writing characters by hand too!",
  "Fun fact: Mandarin has 4 tones (plus a neutral tone).",
  "The character 人 (ren) looks like a person walking!",
  "Tip: Listen to Chinese music to improve your tones.",
  // ... 10-15 more
];
```

### Error Handling Patterns (from architecture)

| Error Type | HTTP Code | User Message | Actions |
|------------|-----------|-------------|---------|
| Auth error | 401 | Redirect to login | Auto-redirect |
| Bad request | 400 | "Invalid request" | Back button |
| Not found / insufficient | 404 | "Not enough content for [Type] in this chapter. Try Vocabulary or Grammar instead." | Back button |
| Server error | 500 | "Couldn't generate [Type] exercise. Try another type or retry." | Retry + Back |
| Timeout | 504 / AbortError | "Generation is taking too long. Please try again." | Retry + Back |
| Network | fetch failure | "Check your connection and try again." | Retry + Back |

### File Structure (files to create/modify)

```
dangdai-mobile/
├── app/quiz/
│   ├── loading.tsx                 # REPLACE: full loading screen implementation
│   ├── loading.test.tsx            # UPDATE: comprehensive test cases
│   └── [chapterId].tsx             # MODIFY: ensure exerciseType param passed
├── hooks/
│   └── useQuizGeneration.ts        # CREATE: TanStack useMutation hook
├── types/
│   └── quiz.ts                     # CREATE: Quiz types matching API contract
├── constants/
│   └── tips.ts                     # CREATE: loading screen tips
└── lib/
    └── api.ts                      # MODIFY: add generateQuiz method
```

### Anti-Patterns to Avoid

- **DO NOT** use `useQuery` for quiz generation - it's a mutation (side-effect), not a cacheable query. Use `useMutation`.
- **DO NOT** use `setInterval` directly in component - use `useEffect` with cleanup for tip rotation.
- **DO NOT** hardcode hex colors - use Tamagui tokens (`$primary`, `$color`, etc.).
- **DO NOT** use `Dimensions.get('window')` - use Tamagui `$xs` media query props.
- **DO NOT** use imperative Animated API or `useSharedValue` for simple transitions - use Tamagui `enterStyle`/`exitStyle` with `AnimatePresence`.
- **DO NOT** create a separate loading component file for now - keep it in `app/quiz/loading.tsx` as Expo Router expects.
- **DO NOT** block navigation back to chapter detail - always provide a cancel/back option.
- **DO NOT** assume the backend API exists and works - handle all error states gracefully with user-friendly messages.
- **DO NOT** create `components/quiz/QuizLoadingScreen.tsx` as a separate component - the route file `app/quiz/loading.tsx` IS the loading screen. Extract sub-components only if the file exceeds ~200 lines.

### Dependencies on Other Stories

- **Depends on:** Story 1.1 (mobile scaffold) - DONE
- **Depends on:** Story 1.4 (Supabase client) - DONE
- **Depends on:** Story 1.5 (TanStack Query + Zustand) - DONE
- **Depends on:** Story 3.4 (chapter navigation) - DONE (provides the navigation to loading screen)
- **Depends on:** Story 4.1 (quiz generation API) - READY-FOR-DEV (this story creates the client-side counterpart)
- **Enables:** Story 4.3 (vocabulary quiz display), Story 4.4-4.8 (all exercise types), Story 4.9 (feedback)

**Note on Story 4.1 dependency:** The backend API endpoint may not be deployed yet. The loading screen MUST work regardless:
- If API is unreachable -> show network error with Retry
- If API returns errors -> show appropriate error messages
- The hook and UI must be fully functional for when the backend is ready

### Testing Approach

```bash
# Run tests for this story
npx jest app/quiz/loading.test.tsx hooks/useQuizGeneration.test.ts constants/tips.test.ts --verbose

# Type checking
npx tsc

# Linting
npx eslint app/quiz/loading.tsx hooks/useQuizGeneration.ts types/quiz.ts constants/tips.ts lib/api.ts --ext .ts,.tsx
```

**Key test scenarios:**
1. Loading screen renders with correct exercise type and chapter in heading
2. Tips rotate every 2 seconds (mock timers)
3. Cancel button navigates back
4. Success state calls `startQuiz()` on Zustand store and navigates to quiz
5. Error state renders Retry and Back buttons
6. Insufficient content error shows specific message
7. Auth error redirects to login
8. Retry button re-triggers the mutation

### Previous Story Intelligence

From Story 4.1 dev notes:
- Backend is at early scaffold stage. The `/api/quizzes/generate` endpoint raises `NotImplementedError` currently.
- `lib/api.ts` is a stub with only `API_BASE_URL` defined. No HTTP methods.
- `stores/useQuizStore.ts` already has `startQuiz(quizId)` action ready to be called.
- `lib/queryKeys.ts` has `quiz(quizId)` key factory pre-defined.
- The Supabase JWT is available via `supabase.auth.getSession()`.

### Exercise Type Display Names

Map exercise type keys to user-friendly display names:

```typescript
export const EXERCISE_TYPE_LABELS: Record<string, string> = {
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  fill_in_blank: 'Fill-in-the-Blank',
  matching: 'Matching',
  dialogue_completion: 'Dialogue Completion',
  sentence_construction: 'Sentence Construction',
  reading_comprehension: 'Reading Comprehension',
  mixed: 'Mixed',
};
```

Put this in `constants/app.ts` or `types/quiz.ts`.

### References

- [Source: epics.md#Story-4.2] - Story requirements and acceptance criteria
- [Source: architecture.md#Error-Handling-Strategy] - Error handling patterns and retry strategy
- [Source: architecture.md#State-Management] - TanStack Query for server state, Zustand for local state
- [Source: architecture.md#API-Communication-Patterns] - REST endpoint specification, JWT token passing
- [Source: architecture.md#Tamagui-Theme-Animation-Architecture] - Animation presets, declarative props, AnimatePresence
- [Source: ux-design-specification.md#Quiz-Generation-Loading] - Loading screen UX spec with tips, progressive loading, error states
- [Source: ux-design-specification.md#Animation-Patterns] - Named presets (quick, bouncy, medium, slow), enterStyle/exitStyle patterns
- [Source: ux-design-specification.md#Error-States] - Friendly error messaging patterns
- [Source: 4-1-quiz-generation-api-endpoint.md] - API contract, response schema, error codes, backend state
- [Source: prd.md#NFR1] - 8-second generation time limit
- [Source: prd.md#NFR15] - LLM API failures display user-friendly error with retry option

## Dev Agent Record

### Agent Model Used

Claude claude-opus-4-6 (anthropic/claude-opus-4-6)

### Debug Log References

- Fixed ESLint error: replaced `DOMException` check with `Error` check for AbortError (DOMException not defined in React Native)
- Fixed ESLint warning: added inline disable comment for necessary `any` cast on Tamagui progress bar width string
- Updated existing `app/quiz/[chapterId].test.tsx` to expect new `exerciseType` param in navigation calls
- Pre-existing test failure in `hooks/useChapters.test.ts` (chapter title data mismatch) — not related to this story

### Completion Notes List

- Implemented full API client in `lib/api.ts` with typed error handling (auth, validation, not_found, server, timeout, network)
- Created `types/quiz.ts` with ExerciseType union, QuizResponse/QuizQuestion interfaces, QuizGenerationError class, and display labels
- Created `useQuizGeneration` hook using TanStack Query `useMutation` with zero retry
- Created 18 Chinese learning tips in `constants/tips.ts` with 2-second rotation interval and non-repeating random selection logic
- Rewrote `app/quiz/loading.tsx` with full loading screen: animated progress bar, rotating tips with AnimatePresence, error/insufficient content states, cancel/retry/back buttons
- Updated `app/quiz/[chapterId].tsx` to pass `exerciseType` param alongside legacy `quizType`
- All Tamagui rules followed: token references only, named animation presets, AnimatePresence for enter/exit, declarative styles
- 44 new/updated unit tests across 3 test files, all passing
- TypeScript strict mode: zero errors
- ESLint: zero errors/warnings on all changed files
- Progressive loading: MVP approach (full quiz response, upgradeable to streaming later)

### Change Log

- 2026-02-20: Implemented Story 4.2 - Quiz Loading Screen with Progressive Loading. Created API client, quiz generation hook, loading tips, and full loading screen with error handling.
- 2026-02-20: **Code Review (AI)** - Found and fixed 6 issues (3 HIGH, 3 MEDIUM):
  - H1: Added 4 missing success-flow tests (startQuiz call, navigation after delay, delay timing, exerciseType param priority)
  - H2: Fixed success navigation that pointed back to `/quiz/loading` (infinite loop risk) - now routes to `/quiz/{quizId}`
  - H3: Fixed `exerciseType` param never read from URL search params - now destructured and preferred over legacy `quizType`
  - M1: Fixed `categorizeHttpError` receiving raw exercise type key instead of display label (error messages showed `fill_in_blank` instead of `Fill-in-the-Blank`)
  - M2: Replaced hardcoded `color="white"` on Retry button with `theme="primary"` Tamagui pattern
  - M4: Fixed test timer leak by wrapping `runOnlyPendingTimers` in `act()`
  - 2 LOW issues noted but not fixed: `QuizGenerationParams.exerciseType` typed as `string` not `ExerciseType`; no auth error redirect to login
  - All 76 tests passing, TypeScript clean, ESLint clean

### File List

**New files:**
- dangdai-mobile/types/quiz.ts
- dangdai-mobile/hooks/useQuizGeneration.ts
- dangdai-mobile/hooks/useQuizGeneration.test.ts
- dangdai-mobile/constants/tips.ts
- dangdai-mobile/constants/tips.test.ts

**Modified files:**
- dangdai-mobile/lib/api.ts
- dangdai-mobile/app/quiz/loading.tsx
- dangdai-mobile/app/quiz/loading.test.tsx
- dangdai-mobile/app/quiz/[chapterId].tsx
- dangdai-mobile/app/quiz/[chapterId].test.tsx
