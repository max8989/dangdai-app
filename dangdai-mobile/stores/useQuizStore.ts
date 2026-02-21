/**
 * Quiz Store
 *
 * Per architecture specification, Zustand is used for local state:
 * - Current quiz state (answers, progress within a quiz session)
 *
 * This store manages the state of an active quiz session.
 * It is ephemeral - quiz results are synced to server via TanStack Query.
 *
 * Server data like quiz history is managed by TanStack Query, not this store.
 *
 * Story 4.3: Extended with quizPayload, getCurrentQuestion, isLastQuestion
 * Story 4.4: Extended with blankAnswers, setBlankAnswer, clearBlankAnswer
 * Story 4.7: Extended with placedTileIds, placeTile, removeTile, clearTiles
 */

import { create } from 'zustand'

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

  // Quiz payload (full quiz data for active session)
  quizPayload: QuizResponse | null

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
  placedTileIds: string[]

  // Derived getters
  getCurrentQuestion: () => QuizQuestion | null
  isLastQuestion: () => boolean

  // Actions
  startQuiz: (quizId: string, payload?: QuizResponse) => void
  setQuizPayload: (payload: QuizResponse) => void
  setAnswer: (questionIndex: number, answer: string) => void
  nextQuestion: () => void
  addScore: (points: number) => void
  resetQuiz: () => void

  // Fill-in-blank actions
  setBlankAnswer: (blankIndex: number, word: string | null, wordBankIndex?: number | null) => void
  clearBlankAnswer: (blankIndex: number) => void

  // Sentence construction tile placement actions (Story 4.7)
  placeTile: (tileId: string) => void
  removeTile: (tileId: string) => void
  clearTiles: () => void
}

/**
 * Quiz store for managing active quiz session state
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
export const useQuizStore = create<QuizState>((set, get) => ({
  // Initial state
  currentQuizId: null,
  currentQuestion: 0,
  answers: {},
  score: 0,
  quizPayload: null,
  blankAnswers: {},
  blankAnswerIndices: {},
  placedTileIds: [],

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

  // Actions
  startQuiz: (quizId, payload) =>
    set((state) => ({
      currentQuizId: quizId,
      currentQuestion: 0,
      answers: {},
      score: 0,
      quizPayload: payload ?? state.quizPayload,
      blankAnswers: {}, // Reset fill-in-blank state on new session start (H3 fix)
      blankAnswerIndices: {},
      placedTileIds: [], // Reset tile placement state on new session start
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
    })),

  addScore: (points) => set((state) => ({ score: state.score + points })),

  resetQuiz: () =>
    set({
      currentQuizId: null,
      currentQuestion: 0,
      answers: {},
      score: 0,
      quizPayload: null,
      blankAnswers: {}, // Reset blank answers on quiz reset
      blankAnswerIndices: {},
      placedTileIds: [], // Reset tile placement on quiz reset
    }),

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
}))
