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
System.register(["zustand"], function (exports_1, context_1) {
    "use strict";
    var zustand_1, useQuizStore;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (zustand_1_1) {
                zustand_1 = zustand_1_1;
            }
        ],
        execute: function () {
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
            exports_1("useQuizStore", useQuizStore = zustand_1.create((set) => ({
                // Initial state
                currentQuizId: null,
                currentQuestion: 0,
                answers: {},
                score: 0,
                // Actions
                startQuiz: (quizId) => set({
                    currentQuizId: quizId,
                    currentQuestion: 0,
                    answers: {},
                    score: 0,
                }),
                setAnswer: (questionIndex, answer) => set((state) => ({
                    answers: { ...state.answers, [questionIndex]: answer },
                })),
                nextQuestion: () => set((state) => ({ currentQuestion: state.currentQuestion + 1 })),
                addScore: (points) => set((state) => ({ score: state.score + points })),
                resetQuiz: () => set({
                    currentQuizId: null,
                    currentQuestion: 0,
                    answers: {},
                    score: 0,
                }),
            })));
        }
    };
});
