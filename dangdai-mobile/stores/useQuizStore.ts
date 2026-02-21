/**
 * Quiz Store
 *
 * Per architecture specification, Zustand is used for local state:
 * - Current quiz state (answers, progress within a quiz session)
 *
 * This store manages the state of an active quiz session.
 * It is crash-safe — Zustand persist middleware serializes minimal resume state
 * to AsyncStorage on every change and rehydrates on app launch (NFR10).
 *
 * Server data like quiz history is managed by TanStack Query, not this store.
 *
 * Story 4.3: Extended with quizPayload, getCurrentQuestion, isLastQuestion
 * Story 4.4: Extended with blankAnswers, setBlankAnswer, clearBlankAnswer
 * Story 4.5: Extended with matchingScore, addMatchedPairScore, addIncorrectAttempt, resetMatchingScore
 * Story 4.7: Extended with placedTileIds, placeTile, removeTile, clearTiles
 * Story 4.9: Extended with showFeedback, feedbackIsCorrect, triggerShowFeedback, hideFeedback
 * Story 4.10: Added persist middleware, chapterId/bookId/exerciseType, hasActiveQuiz, _hasHydrated
 * Story 4.11: Extended with isComplete, quizStartTime, completeQuiz(), getQuizDuration(), getIncorrectAnswers()
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

import type { QuizResponse, QuizQuestion } from '../types/quiz'

/**
 * Quiz session state interface
 */
interface QuizState {
  // Current quiz session
  currentQuizId: string | null
  currentQuestion: number
  answers: Record<number, string>
  score: number

  // Quiz payload (full quiz data for active session — persisted for crash recovery)
  quizPayload: QuizResponse | null

  // Quiz context metadata (persisted for crash recovery and Supabase writes)
  chapterId: number | null
  bookId: number | null
  exerciseType: string | null

  // Fill-in-blank state (per question, resets on nextQuestion/resetQuiz)
  blankAnswers: Record<number, string | null>
  /**
   * Tracks which word-bank *index* fills each blank position.
   * Index-based (not value-based) to correctly handle duplicate words in the bank.
   * blankIndex → wordBankIndex | null
   */
  blankAnswerIndices: Record<number, number | null>

  // Matching exercise session-level score tracking (Story 4.5)
  // Aggregate score for the session — used by completion flow (Story 4.11) and
  // progress saving (Story 4.10). Transient interaction state (selectedLeft, etc.)
  // lives in the MatchingExercise component, NOT here.
  matchingScore: { correct: number; incorrect: number }

  // Sentence construction tile placement state (Story 4.7)
  // Ordered list of tile IDs placed in the answer area.
  // Tile ID format: "tile-N" where N is the index into scrambled_words[].
  // This handles duplicate words correctly (two "的" tiles get different IDs).
  // NOT persisted — ephemeral UI state.
  placedTileIds: string[]

  // Feedback overlay state (Story 4.9)
  // Controls visibility of FeedbackOverlay after each answer submission.
  showFeedback: boolean
  feedbackIsCorrect: boolean | null

  // Hydration tracking (Story 4.10)
  // Set to true by onRehydrateStorage callback after AsyncStorage data is loaded.
  // Use this to gate the resume dialog check.
  _hasHydrated: boolean

  // Quiz completion state (Story 4.11)
  // Set to true by completeQuiz() when the quiz is finished and CompletionScreen shows.
  // NOT persisted — ephemeral UI state, resets on resetQuiz().
  isComplete: boolean
  // Timestamp (ms) when the quiz was started, used to compute quiz duration.
  // Set in startQuiz(), cleared in resetQuiz().
  quizStartTime: number | null

  // Derived getters
  getCurrentQuestion: () => QuizQuestion | null
  isLastQuestion: () => boolean
  hasActiveQuiz: () => boolean
  /** Returns elapsed quiz duration in minutes (0 if not started). Story 4.11 Task 1.4 */
  getQuizDuration: () => number
  /** Returns details of incorrectly answered questions. Story 4.11 Task 1.5 */
  getIncorrectAnswers: () => { questionIndex: number; userAnswer: string; correctAnswer: string }[]

  // Actions
  /** Sets isComplete to true — called when the last question's feedback timer fires. Story 4.11 Task 1.3 */
  completeQuiz: () => void
  startQuiz: (quizId: string, payload?: QuizResponse, chapterId?: number | null, bookId?: number | null, exerciseType?: string | null) => void
  setQuizPayload: (payload: QuizResponse) => void
  setAnswer: (questionIndex: number, answer: string) => void
  nextQuestion: () => void
  addScore: (points: number) => void
  resetQuiz: () => void
  setHasHydrated: (hydrated: boolean) => void

  // Matching exercise score actions (Story 4.5)
  /** Increment the correct pair count for the current matching exercise session */
  addMatchedPairScore: () => void
  /** Increment the incorrect attempt count for the current matching exercise session */
  addIncorrectMatchingAttempt: () => void
  /** Reset matching score state (called on nextQuestion and resetQuiz) */
  resetMatchingScore: () => void

  // Fill-in-blank actions
  setBlankAnswer: (blankIndex: number, word: string | null, wordBankIndex?: number | null) => void
  clearBlankAnswer: (blankIndex: number) => void

  // Sentence construction tile placement actions (Story 4.7)
  placeTile: (tileId: string) => void
  removeTile: (tileId: string) => void
  clearTiles: () => void

  // Feedback overlay actions (Story 4.9)
  triggerShowFeedback: (isCorrect: boolean) => void
  hideFeedback: () => void
}

/**
 * Quiz store for managing active quiz session state
 *
 * Uses Zustand persist middleware to write minimal resume state to AsyncStorage
 * on every state change (NFR10 — crash-safe progress).
 *
 * Persisted fields: currentQuizId, currentQuestion, answers, score, quizPayload,
 *   chapterId, bookId, exerciseType
 * NOT persisted: placedTileIds, blankAnswers, blankAnswerIndices, showFeedback,
 *   feedbackIsCorrect, _hasHydrated (and all action functions)
 *
 * Usage:
 * ```tsx
 * import { useQuizStore } from '../stores/useQuizStore';
 *
 * function QuizScreen() {
 *   const { currentQuestion, setAnswer, nextQuestion } = useQuizStore();
 *   // ... quiz logic
 * }
 * ```
 */
export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentQuizId: null,
      currentQuestion: 0,
      answers: {},
      score: 0,
      quizPayload: null,
      chapterId: null,
      bookId: null,
      exerciseType: null,
      blankAnswers: {},
      blankAnswerIndices: {},
      matchingScore: { correct: 0, incorrect: 0 },
      placedTileIds: [],
      showFeedback: false,
      feedbackIsCorrect: null,
      _hasHydrated: false,
      // Story 4.11 completion state
      isComplete: false,
      quizStartTime: null,

      // Derived getters
      getCurrentQuestion: () => {
        const { quizPayload, currentQuestion } = get()
        if (!quizPayload || !quizPayload.questions) return null
        return quizPayload.questions[currentQuestion] ?? null
      },

      isLastQuestion: () => {
        const { quizPayload, currentQuestion } = get()
        if (!quizPayload || !quizPayload.questions) return false
        return currentQuestion >= quizPayload.questions.length - 1
      },

      hasActiveQuiz: () => {
        const state = get()
        return state.currentQuizId !== null && state.quizPayload !== null
      },

      // Story 4.11 derived getters
      getQuizDuration: () => {
        const { quizStartTime } = get()
        if (quizStartTime === null) return 0
        const elapsedMs = Date.now() - quizStartTime
        return Math.round(elapsedMs / 60_000)
      },

      getIncorrectAnswers: () => {
        const { quizPayload, answers } = get()
        if (!quizPayload || !quizPayload.questions) return []
        const result: { questionIndex: number; userAnswer: string; correctAnswer: string }[] = []
        quizPayload.questions.forEach((question, index) => {
          const userAnswer = answers[index]
          if (userAnswer === undefined) return // Not answered — skip
          const isCorrect =
            userAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase()
          if (!isCorrect) {
            result.push({
              questionIndex: index,
              userAnswer,
              correctAnswer: question.correct_answer,
            })
          }
        })
        return result
      },

      // Actions
      completeQuiz: () => set({ isComplete: true }),

      startQuiz: (quizId, payload, chapterId = null, bookId = null, exerciseType = null) =>
        set((state) => ({
          currentQuizId: quizId,
          currentQuestion: 0,
          answers: {},
          score: 0,
          quizPayload: payload ?? state.quizPayload,
          chapterId,
          bookId,
          exerciseType,
          blankAnswers: {}, // Reset fill-in-blank state on new session start (H3 fix)
          blankAnswerIndices: {},
          matchingScore: { correct: 0, incorrect: 0 }, // Reset matching score on new session
          placedTileIds: [], // Reset tile placement state on new session start
          showFeedback: false, // Reset feedback state on new session start
          feedbackIsCorrect: null,
          // Story 4.11: record start time for duration calculation; reset completion
          isComplete: false,
          quizStartTime: Date.now(),
        })),

      setQuizPayload: (payload) => set({ quizPayload: payload }),

      setAnswer: (questionIndex, answer) =>
        set((state) => ({
          answers: { ...state.answers, [questionIndex]: answer },
        })),

      nextQuestion: () =>
        set((state) => ({
          currentQuestion: state.currentQuestion + 1,
          blankAnswers: {}, // Reset blank answers on question advance
          blankAnswerIndices: {},
          matchingScore: { correct: 0, incorrect: 0 }, // Reset matching score on question advance
          placedTileIds: [], // Reset tile placement on question advance
          showFeedback: false, // Reset feedback state on question advance
          feedbackIsCorrect: null,
        })),

      addScore: (points) => set((state) => ({ score: state.score + points })),

      resetQuiz: () =>
        set({
          currentQuizId: null,
          currentQuestion: 0,
          answers: {},
          score: 0,
          quizPayload: null,
          chapterId: null,
          bookId: null,
          exerciseType: null,
          blankAnswers: {}, // Reset blank answers on quiz reset
          blankAnswerIndices: {},
          matchingScore: { correct: 0, incorrect: 0 }, // Reset matching score on quiz reset
          placedTileIds: [], // Reset tile placement on quiz reset
          showFeedback: false, // Reset feedback state on quiz reset
          feedbackIsCorrect: null,
          // Story 4.11: reset completion state
          isComplete: false,
          quizStartTime: null,
        }),

      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),

      // Matching exercise score actions (Story 4.5)
      addMatchedPairScore: () =>
        set((state) => ({
          matchingScore: {
            ...state.matchingScore,
            correct: state.matchingScore.correct + 1,
          },
        })),

      addIncorrectMatchingAttempt: () =>
        set((state) => ({
          matchingScore: {
            ...state.matchingScore,
            incorrect: state.matchingScore.incorrect + 1,
          },
        })),

      resetMatchingScore: () =>
        set({ matchingScore: { correct: 0, incorrect: 0 } }),

      // Fill-in-blank actions
      setBlankAnswer: (blankIndex, word, wordBankIndex = null) =>
        set((state) => ({
          blankAnswers: { ...state.blankAnswers, [blankIndex]: word },
          blankAnswerIndices: { ...state.blankAnswerIndices, [blankIndex]: wordBankIndex },
        })),

      clearBlankAnswer: (blankIndex) =>
        set((state) => ({
          blankAnswers: { ...state.blankAnswers, [blankIndex]: null },
          blankAnswerIndices: { ...state.blankAnswerIndices, [blankIndex]: null },
        })),

      // Sentence construction tile placement actions (Story 4.7)
      placeTile: (tileId) =>
        set((state) => ({
          placedTileIds: [...state.placedTileIds, tileId],
        })),

      removeTile: (tileId) =>
        set((state) => ({
          placedTileIds: state.placedTileIds.filter((id) => id !== tileId),
        })),

      clearTiles: () => set({ placedTileIds: [] }),

      // Feedback overlay actions (Story 4.9)
      triggerShowFeedback: (isCorrect: boolean) =>
        set({ showFeedback: true, feedbackIsCorrect: isCorrect }),

      hideFeedback: () =>
        set({ showFeedback: false, feedbackIsCorrect: null }),
    }),
    {
      name: 'dangdai-quiz-store',
      // createJSONStorage(() => AsyncStorage) works on web because
      // @react-native-async-storage/async-storage polyfills to localStorage on web
      // (same pattern used in lib/supabase.ts)
      storage: createJSONStorage(() => AsyncStorage),

      // Persist ONLY the minimal fields needed to resume a quiz after crash.
      // Excludes: _hasHydrated, placedTileIds, blankAnswers, blankAnswerIndices,
      //   showFeedback, feedbackIsCorrect, and all action functions.
      partialize: (state) => ({
        currentQuizId: state.currentQuizId,
        currentQuestion: state.currentQuestion,
        answers: state.answers,
        score: state.score,
        quizPayload: state.quizPayload,
        chapterId: state.chapterId,
        bookId: state.bookId,
        exerciseType: state.exerciseType,
      }),

      // Called after AsyncStorage data is loaded into the store.
      // Sets _hasHydrated to true to signal that the resume dialog check can run.
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  )
)
