# Story 4.10b: Quiz Pause/Resume

Status: ready-for-dev

## Story

As a user,
I want to pause an in-progress quiz and resume it later from where I left off,
So that I don't lose my progress when I need to step away or accidentally navigate away from the quiz.

## Acceptance Criteria

1. **Given** I am taking a quiz and have answered at least 1 question
   **When** I press the back button or attempt to navigate away
   **Then** an exit confirmation modal appears with three options:
   - "Stay" button (dismisses modal, continues quiz)
   - "Pause Quiz" button (primary action, saves progress)
   - "Cancel Quiz" button (destructive action, loses progress)

2. **Given** the exit modal is open
   **When** I tap "Pause Quiz"
   **Then** my current quiz state is saved to Supabase `paused_quizzes` table including:
   - All quiz questions
   - My current question index
   - All my answers so far
   - Time spent
   - Chapter ID and exercise type
   **And** I navigate back to the Exercise Type Selection screen
   **And** a success toast shows "Quiz paused. Resume anytime from the dashboard."

3. **Given** I have paused a quiz
   **When** I view the Exercise Type Selection screen for that chapter
   **Then** I see a banner at the top: "⏸️ You have a paused [Exercise Type] quiz. Tap to resume or start a new one."

4. **Given** I have paused a quiz
   **When** I tap the pause banner or tap the dashboard continue card
   **Then** I navigate to the quiz screen
   **And** my quiz state is fully restored (same questions, current position, previous answers)
   **And** the paused quiz record is removed from the database (now active)

5. **Given** I resume a paused quiz
   **When** I complete the remaining questions
   **Then** the quiz is scored normally
   **And** my final score includes both pre-pause and post-resume answers
   **And** a `quiz_attempts` record is created as normal

6. **Given** I have already paused a quiz for Chapter 5 Vocabulary
   **When** I pause a new quiz for Chapter 5 Vocabulary
   **Then** the old paused quiz is overwritten (upsert behavior)
   **And** only the latest paused state is saved

7. **Given** I paused a quiz 7 days ago
   **When** I view my paused quizzes
   **Then** the paused quiz has been automatically deleted by the cleanup job

## Tasks / Subtasks

- [ ] Task 1: Create Supabase `paused_quizzes` table schema (AC: #2, #6, #7)
  - [ ] 1.1 Create migration `supabase/migrations/YYYYMMDDHHMMSS_create_paused_quizzes_table.sql`
  - [ ] 1.2 Define table schema:
    - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    - `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
    - `chapter_id INTEGER NOT NULL`
    - `exercise_type TEXT NOT NULL`
    - `quiz_state JSONB NOT NULL` (structure: `{ questions, currentQuestionIndex, answers, startedAt, timeElapsed, exerciseType, chapterId, bookId }`)
    - `paused_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
    - `expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
    - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - [ ] 1.3 Add unique constraint: `CONSTRAINT paused_quizzes_user_chapter_unique UNIQUE (user_id, chapter_id, exercise_type)`
  - [ ] 1.4 Add indexes: `CREATE INDEX idx_paused_quizzes_user_id ON paused_quizzes(user_id)`, `CREATE INDEX idx_paused_quizzes_expires_at ON paused_quizzes(expires_at)`
  - [ ] 1.5 Enable RLS: `ALTER TABLE paused_quizzes ENABLE ROW LEVEL SECURITY`
  - [ ] 1.6 Add RLS policies for SELECT, INSERT, UPDATE, DELETE (users can only access their own paused quizzes)
  - [ ] 1.7 Run migration: `supabase db push` or apply via Supabase dashboard
  - [ ] 1.8 Verify table exists and RLS policies work: test with authenticated user

- [ ] Task 2: Define TypeScript types for paused quiz state (AC: #2, #4)
  - [ ] 2.1 Create `types/paused-quiz.ts` file
  - [ ] 2.2 Define `PausedQuizState` interface matching JSONB structure:
    ```typescript
    interface PausedQuizState {
      questions: Question[];
      currentQuestionIndex: number;
      answers: Record<number, string>;
      startedAt: string;
      timeElapsed: number;
      exerciseType: ExerciseType;
      chapterId: number;
      bookId: number;
    }
    ```
  - [ ] 2.3 Define `PausedQuiz` database row type:
    ```typescript
    interface PausedQuiz {
      id: string;
      user_id: string;
      chapter_id: number;
      exercise_type: string;
      quiz_state: PausedQuizState;
      paused_at: string;
      expires_at: string;
      created_at: string;
      updated_at: string;
    }
    ```
  - [ ] 2.4 Export both types from `types/paused-quiz.ts`

- [ ] Task 3: Create `usePauseQuiz` hook with pause/resume/delete operations (AC: #2, #4, #6)
  - [ ] 3.1 Create `hooks/usePauseQuiz.ts` file
  - [ ] 3.2 Implement `pauseQuiz` mutation using TanStack Query `useMutation`:
    - Accept `{ chapterId, exerciseType, quizState: PausedQuizState }` as input
    - Get authenticated user via `supabase.auth.getUser()`
    - Upsert to `paused_quizzes` table (insert or update based on unique constraint)
    - Set `paused_at: new Date().toISOString()`, `expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()`
    - On success, invalidate `['pausedQuizzes']` query key
  - [ ] 3.3 Implement `resumeQuiz` mutation:
    - Accept `{ chapterId, exerciseType }` as input
    - Fetch paused quiz from `paused_quizzes` WHERE `user_id = current_user AND chapter_id = chapterId AND exercise_type = exerciseType`
    - Return `quiz_state` as `PausedQuizState`
  - [ ] 3.4 Implement `deletePausedQuiz` mutation:
    - Accept `{ chapterId, exerciseType }` as input
    - Delete from `paused_quizzes` WHERE `user_id = current_user AND chapter_id = chapterId AND exercise_type = exerciseType`
    - On success, invalidate `['pausedQuizzes']` query key
  - [ ] 3.5 Export hook with `{ pauseQuiz: mutateAsync, resumeQuiz: mutateAsync, deletePausedQuiz: mutateAsync }`
  - [ ] 3.6 Write unit tests in `hooks/usePauseQuiz.test.ts`: test pause/resume/delete operations, upsert behavior

- [ ] Task 4: Create `usePausedQuiz` query hook for fetching paused quiz by chapter (AC: #3, #4)
  - [ ] 4.1 Create `hooks/usePausedQuiz.ts` file
  - [ ] 4.2 Implement query hook using TanStack Query `useQuery`:
    - Accept `(chapterId: number, exerciseType: string)` as parameters
    - Query key: `['pausedQuizzes', chapterId, exerciseType]`
    - Fetch from `paused_quizzes` WHERE `user_id = current_user AND chapter_id = chapterId AND exercise_type = exerciseType`
    - Handle "no rows" error gracefully (return `null` instead of throwing)
    - Return `PausedQuiz | null`
  - [ ] 4.3 Export hook as `usePausedQuiz(chapterId, exerciseType)`
  - [ ] 4.4 Write unit tests: test query success, no rows case, error handling

- [ ] Task 5: Add `restoreState` action to Zustand `useQuizStore` (AC: #4)
  - [ ] 5.1 Add `startedAt: string | null` field to `QuizState` interface
  - [ ] 5.2 Add `timeElapsed: number` field to `QuizState` interface (default: 0)
  - [ ] 5.3 Implement `restoreState(state: PausedQuizState)` action:
    ```typescript
    restoreState: (state: PausedQuizState) =>
      set({
        questions: state.questions,
        currentQuestionIndex: state.currentQuestionIndex,
        answers: state.answers,
        startedAt: state.startedAt,
        timeElapsed: state.timeElapsed,
        chapterId: state.chapterId,
        bookId: state.bookId,
        exerciseType: state.exerciseType,
        currentQuizId: `paused-${state.chapterId}-${state.exerciseType}`, // synthetic ID for paused quizzes
      }),
    ```
  - [ ] 5.4 Update `resetQuiz()` to clear `startedAt` and `timeElapsed`
  - [ ] 5.5 Write unit tests: test `restoreState` populates all fields correctly, `resetQuiz` clears new fields

- [ ] Task 6: Create `ExitConfirmationModal` component (AC: #1)
  - [ ] 6.1 Create `components/quiz/ExitConfirmationModal.tsx`
  - [ ] 6.2 Use Tamagui `Dialog` component with `AnimatePresence` for modal behavior
  - [ ] 6.3 Render modal with three buttons:
    - "Stay" button (chromeless/ghost style, low emphasis)
    - "Pause Quiz" button (primary theme, high emphasis)
    - "Cancel Quiz" button (error theme, destructive)
  - [ ] 6.4 Accept props: `{ open: boolean, onStay: () => void, onPause: () => void, onCancel: () => void }`
  - [ ] 6.5 Apply animations: `enterStyle={{ opacity: 0, scale: 0.9 }}`, `exitStyle={{ opacity: 0, scale: 0.9 }}`, `animation="medium"`
  - [ ] 6.6 Add title text: "What would you like to do?"
  - [ ] 6.7 Use `XStack` for horizontal button layout with `gap="$3"` and `flex={1}` on each button
  - [ ] 6.8 Write component tests: test modal renders, button clicks trigger correct callbacks

- [ ] Task 7: Integrate exit modal into quiz screen with `beforeRemove` listener (AC: #1, #2)
  - [ ] 7.1 Update `app/quiz/[chapterId].tsx` to import `ExitConfirmationModal` and `usePauseQuiz`
  - [ ] 7.2 Add local state: `const [showExitModal, setShowExitModal] = useState(false)`
  - [ ] 7.3 Add `useEffect` to register `beforeRemove` listener:
    ```typescript
    useEffect(() => {
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (quizState.isComplete) return; // Allow navigation if quiz complete
        e.preventDefault(); // Block navigation
        setShowExitModal(true); // Show modal
      });
      return unsubscribe;
    }, [navigation, quizState.isComplete]);
    ```
  - [ ] 7.4 Implement `handlePause` callback:
    - Call `pauseQuiz({ chapterId, exerciseType, quizState: { ... } })` with current quiz state from Zustand
    - Show success toast: "Quiz paused. Resume anytime from the dashboard."
    - Close modal: `setShowExitModal(false)`
    - Navigate back: `navigation.goBack()`
  - [ ] 7.5 Implement `handleCancel` callback:
    - Close modal: `setShowExitModal(false)`
    - Navigate back: `navigation.goBack()` (no state saved)
  - [ ] 7.6 Implement `handleStay` callback:
    - Close modal: `setShowExitModal(false)` (remain on quiz screen)
  - [ ] 7.7 Render `<ExitConfirmationModal open={showExitModal} onStay={handleStay} onPause={handlePause} onCancel={handleCancel} />`
  - [ ] 7.8 Test manually: press back during quiz, verify modal appears, test all three button behaviors

- [ ] Task 8: Add resume logic to quiz screen on mount (AC: #4)
  - [ ] 8.1 Import `usePausedQuiz` and `usePauseQuiz` in `app/quiz/[chapterId].tsx`
  - [ ] 8.2 Query for paused quiz: `const { data: pausedQuiz } = usePausedQuiz(Number(chapterId), exerciseType)`
  - [ ] 8.3 Add `useEffect` to restore state on mount:
    ```typescript
    useEffect(() => {
      if (pausedQuiz) {
        const state = pausedQuiz.quiz_state as PausedQuizState;
        quizStore.restoreState(state);
        // Delete paused quiz record (now active)
        deletePausedQuiz({ chapterId: Number(chapterId), exerciseType });
      }
    }, [pausedQuiz]);
    ```
  - [ ] 8.4 Handle race condition: if quiz is already loading (fresh generation), don't restore
  - [ ] 8.5 Test manually: pause a quiz, navigate away, navigate back to quiz screen, verify state restored

- [ ] Task 9: Create `PausedQuizBanner` component for Exercise Type Selection screen (AC: #3)
  - [ ] 9.1 Create `components/quiz/PausedQuizBanner.tsx`
  - [ ] 9.2 Accept props: `{ chapterId: number, exerciseType: string, onResume: () => void, onDiscard: () => void }`
  - [ ] 9.3 Use `usePausedQuiz(chapterId, exerciseType)` to fetch paused quiz data
  - [ ] 9.4 If no paused quiz exists, render `null`
  - [ ] 9.5 If paused quiz exists, render banner with:
    - Pause icon (⏸️ or from `@tamagui/lucide-icons`)
    - Text: "Paused [Exercise Type] quiz (X/10 complete)"
    - Timestamp: "Paused X hours ago" (use `formatDistanceToNow` from `date-fns`)
    - "Resume" button (primary theme)
    - "Discard" button (ghost/chromeless)
  - [ ] 9.6 Animate banner entry: `enterStyle={{ y: -100 }}`, `animation="quick"`
  - [ ] 9.7 Wire up "Resume" button to `onResume` prop
  - [ ] 9.8 Wire up "Discard" button to call `deletePausedQuiz({ chapterId, exerciseType })` then `onDiscard` prop
  - [ ] 9.9 Write component tests: test banner renders when paused quiz exists, test resume/discard callbacks

- [ ] Task 10: Integrate `PausedQuizBanner` into Exercise Type Selection screen (AC: #3)
  - [ ] 10.1 Update `app/exercise-type/[chapterId].tsx` to import `PausedQuizBanner`
  - [ ] 10.2 Render banner at top of screen (above exercise type grid)
  - [ ] 10.3 Implement `handleResume` callback:
    - Navigate to quiz screen: `router.push(\`/quiz/\${chapterId}?exerciseType=\${exerciseType}\`)`
  - [ ] 10.4 Implement `handleDiscard` callback (no-op, banner will disappear automatically after delete)
  - [ ] 10.5 Render: `<PausedQuizBanner chapterId={chapterId} exerciseType={selectedType} onResume={handleResume} onDiscard={handleDiscard} />`
  - [ ] 10.6 Test manually: pause a quiz, navigate to exercise type selection, verify banner appears, test resume/discard

- [ ] Task 11: Update Dashboard Continue Card to show paused quizzes (AC: #4)
  - [ ] 11.1 Update `components/dashboard/ContinueCard.tsx` to query for latest paused quiz:
    ```typescript
    const { data: pausedQuizzes } = useQuery({
      queryKey: ['pausedQuizzes'],
      queryFn: async () => {
        const { data } = await supabase
          .from('paused_quizzes')
          .select('*')
          .order('paused_at', { ascending: false })
          .limit(1);
        return data;
      },
    });
    const latestPaused = pausedQuizzes?.[0];
    ```
  - [ ] 11.2 If `latestPaused` exists, render paused quiz card:
    - Pause icon
    - Title: "Resume [Exercise Type]"
    - Subtitle: "Chapter X • Y hours ago"
    - Progress indicator: "X of 10 questions complete"
  - [ ] 11.3 On tap, navigate to quiz screen: `router.push(\`/quiz/\${latestPaused.chapter_id}?exerciseType=\${latestPaused.exercise_type}\`)`
  - [ ] 11.4 Add swipe-to-delete gesture (iOS) or long-press menu (Android) to delete paused quiz
  - [ ] 11.5 If no paused quiz, render normal continue card behavior (last active chapter)
  - [ ] 11.6 Test manually: pause a quiz, check dashboard shows resume card, tap to resume, swipe to delete

- [ ] Task 12: Add pause badge indicator to Chapter List items (AC: #3)
  - [ ] 12.1 Update `components/chapter/ChapterListItem.tsx` to query for paused quizzes for the chapter
  - [ ] 12.2 Use TanStack Query to fetch paused quizzes: `const { data: pausedCount } = useQuery(['pausedQuizzes', chapterId], async () => { ... })`
  - [ ] 12.3 If `pausedCount > 0`, render small pause badge icon (top-right or next to chapter title)
  - [ ] 12.4 Use Tamagui `Badge` or custom icon component
  - [ ] 12.5 Apply subtle animation on badge appearance: `enterStyle={{ scale: 0 }}`, `animation="bouncy"`
  - [ ] 12.6 Test manually: pause a quiz, check chapter list shows badge

- [ ] Task 13: Create Supabase Edge Function for automatic cleanup of expired paused quizzes (AC: #7)
  - [ ] 13.1 Create `supabase/functions/cleanup-paused-quizzes/index.ts`
  - [ ] 13.2 Implement function:
    ```typescript
    import { createClient } from '@supabase/supabase-js';

    Deno.serve(async (req) => {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { error, count } = await supabase
        .from('paused_quizzes')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }

      return new Response(JSON.stringify({ deleted: count }), { status: 200 });
    });
    ```
  - [ ] 13.3 Deploy function: `supabase functions deploy cleanup-paused-quizzes`
  - [ ] 13.4 Schedule function to run daily via Supabase Cron or external scheduler (e.g., GitHub Actions cron)
  - [ ] 13.5 Test manually: set `expires_at` to yesterday in Supabase, trigger function, verify record deleted

- [ ] Task 14: Handle edge cases and error states (AC: #1, #2, #4)
  - [ ] 14.1 Handle offline pause attempt:
    - Wrap `pauseQuiz` call in try/catch
    - On error, show toast: "Can't pause quiz - no internet connection"
    - Keep exit modal open with "Stay" and "Cancel Quiz" options only
  - [ ] 14.2 Handle corrupted paused quiz state on resume:
    - Wrap `restoreState` call in try/catch
    - On error, show error message: "Paused quiz is corrupted. Starting a new quiz."
    - Delete paused quiz record
    - Generate fresh quiz
  - [ ] 14.3 Handle conflict when starting new quiz with existing paused quiz:
    - Detect paused quiz before generation starts
    - Show confirmation modal: "You have a paused quiz. Discard it and start fresh?"
    - On confirm: delete paused quiz, generate new quiz
    - On cancel: navigate back to exercise type selection
  - [ ] 14.4 Test all edge cases manually

- [ ] Task 15: Add success toast notifications (AC: #2)
  - [ ] 15.1 After successful pause, show toast: "Quiz paused. Resume anytime from the dashboard."
  - [ ] 15.2 Use Tamagui `Toast` component or custom toast implementation
  - [ ] 15.3 Apply animation: `enterStyle={{ opacity: 0, y: 20 }}`, `animation="quick"`
  - [ ] 15.4 Auto-dismiss after 3 seconds
  - [ ] 15.5 Test toast appearance and dismissal

## Architecture Reference

See `architecture.md#quiz-pauseresume-architecture` for full technical specification.

## Dependencies

**Requires:**
- Story 4.10 (Quiz Progress Saving) - Zustand `useQuizStore` with persist
- Story 4.3 (Vocabulary & Grammar Quiz) - base quiz screen implementation
- Supabase `paused_quizzes` table created via migration

**Blocks:**
- None (this is an enhancement to existing quiz flow)

## Testing Notes

### Manual Test Scenarios

1. **Happy Path:**
   - Start quiz → answer 3 questions → press back → tap "Pause Quiz"
   - Verify paused quiz saved in Supabase (check via Supabase dashboard)
   - Navigate to dashboard → tap Continue card
   - Verify quiz state restored (question 4, previous answers intact)
   - Complete quiz → verify paused record deleted

2. **Overwrite Existing Paused Quiz:**
   - Pause a quiz for Chapter 5 Vocabulary
   - Start new quiz for Chapter 5 Vocabulary → answer different questions → pause
   - Verify only latest paused quiz exists in Supabase

3. **Multiple Paused Quizzes (Different Chapters):**
   - Pause quiz for Chapter 3 Grammar
   - Pause quiz for Chapter 5 Vocabulary
   - Verify both exist in Supabase
   - Verify dashboard shows most recent
   - Resume Chapter 3 → verify correct state restored

4. **Offline Pause Attempt:**
   - Disable network
   - Try to pause quiz
   - Verify error toast shown
   - Verify exit modal remains open

5. **Corrupted State Resume:**
   - Manually corrupt `quiz_state` JSONB in Supabase
   - Try to resume
   - Verify error message shown
   - Verify paused quiz deleted
   - Verify fresh quiz generated

### Success Metrics

**Functional:**
- ✅ Users can pause and resume quizzes without data loss
- ✅ Paused quiz state persists across app restarts
- ✅ Only one paused quiz per chapter/type (upsert behavior)
- ✅ Paused quizzes auto-expire after 7 days

**UX:**
- 📊 Track pause rate: % of quizzes paused (expect 5-15%)
- 📊 Track resume rate: % of paused quizzes resumed (target >70%)
- 📊 Track completion after resume: % of resumed quizzes completed (target >80%)

**Performance:**
- ⚡ Pause operation completes in <1s
- ⚡ Resume state restoration in <500ms
- 💾 Paused quiz storage: ~2-5 KB JSONB per quiz

## Definition of Done

- [ ] All tasks completed
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing for hooks and components
- [ ] Manual testing scenarios completed
- [ ] Code reviewed and approved
- [ ] Supabase migration applied to production
- [ ] Edge function deployed and scheduled
- [ ] No regressions in existing quiz flow
- [ ] Documentation updated (README, architecture)
