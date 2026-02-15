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
 */

import { create } from 'zustand'

/**
 * Quiz session state interface
 */
interface QuizState {
  // Current quiz session
  currentQuizId: string | null
  currentQuestion: number
  answers: Record<number, string>
  score: number

  // Actions
  startQuiz: (quizId: string) => void
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
export const useQuizStore = create<QuizState>((set) => ({
  // Initial state
  currentQuizId: null,
  currentQuestion: 0,
  answers: {},
  score: 0,

  // Actions
  startQuiz: (quizId) =>
    set({
      currentQuizId: quizId,
      currentQuestion: 0,
      answers: {},
      score: 0,
    }),

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
    }),
}))
