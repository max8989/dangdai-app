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
    })),

  setQuizPayload: (payload) => set({ quizPayload: payload }),

  setAnswer: (questionIndex, answer) =>
    set((state) => ({
      answers: { ...state.answers, [questionIndex]: answer },
    })),

  nextQuestion: () => set((state) => ({ currentQuestion: state.currentQuestion + 1 })),

  addScore: (points) => set((state) => ({ score: state.score + points })),

  resetQuiz: () =>
    set({
      currentQuizId: null,
      currentQuestion: 0,
      answers: {},
      score: 0,
      quizPayload: null,
    }),
}))
