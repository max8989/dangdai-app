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
 * Story 4.7: Extended with placedTileIds, placeTile, removeTile, clearTiles
 * Story 4.9: Extended with showFeedback, feedbackIsCorrect, triggerShowFeedback, hideFeedback
 * Story 4.10: Added persist middleware, chapterId/bookId/exerciseType, hasActiveQuiz, _hasHydrated
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

  // Derived getters
  getCurrentQuestion: () => QuizQuestion | null
  isLastQuestion: () => boolean
  hasActiveQuiz: () => boolean

  // Actions
  startQuiz: (quizId: string, payload?: QuizResponse, chapterId?: number | null, bookId?: number | null, exerciseType?: string | null) => void
  setQuizPayload: (payload: QuizResponse) => void
  setAnswer: (questionIndex: number, answer: string) => void
  nextQuestion: () => void
  addScore: (points: number) => void
  resetQuiz: () => void
  setHasHydrated: (hydrated: boolean) => void

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
      placedTileIds: [],
      showFeedback: false,
      feedbackIsCorrect: null,
      _hasHydrated: false,

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

      // Actions
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
          placedTileIds: [], // Reset tile placement state on new session start
          showFeedback: false, // Reset feedback state on new session start
          feedbackIsCorrect: null,
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
          placedTileIds: [], // Reset tile placement on quiz reset
          showFeedback: false, // Reset feedback state on quiz reset
          feedbackIsCorrect: null,
        }),

      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),

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
