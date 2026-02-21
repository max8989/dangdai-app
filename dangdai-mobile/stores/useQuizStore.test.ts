/**
 * useQuizStore Tests
 *
 * Unit tests for the quiz store extensions added in Story 4.3:
 * - quizPayload storage
 * - getCurrentQuestion derived getter
 * - isLastQuestion derived boolean
 * - setQuizPayload action
 * - resetQuiz clears quizPayload
 * - startQuiz accepts optional payload
 *
 * Story 4.4 additions:
 * - blankAnswers state for fill-in-blank
 * - setBlankAnswer action
 * - clearBlankAnswer action
 * - blankAnswers reset on nextQuestion and resetQuiz
 *
 * Story 4.9 additions:
 * - showFeedback boolean state
 * - feedbackIsCorrect boolean | null state
 * - showFeedback(isCorrect) action
 * - hideFeedback() action
 * - feedback state resets on resetQuiz() and nextQuestion()
 *
 * Story 4.10 additions:
 * - persist middleware (state survives store recreation)
 * - chapterId / bookId / exerciseType fields
 * - hasActiveQuiz() derived getter
 * - _hasHydrated boolean + setHasHydrated action
 * - resetQuiz() clears all persisted fields
 * - startQuiz() stores chapterId, bookId, exerciseType
 *
 * Story 4.3: Vocabulary & Grammar Quiz (Multiple Choice) — Task 7.8
 * Story 4.4: Fill-in-the-Blank Exercise (Word Bank) — Task 6.9
 * Story 4.5: Matching Exercise — Task 4.6
 * Story 4.9: Immediate Answer Feedback — Task 4.6
 * Story 4.10: Quiz Progress Saving — Task 1.11
 */

// Mock AsyncStorage before importing the store
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

import { useQuizStore } from './useQuizStore'
import type { QuizResponse } from '../types/quiz'

// ─── Mock quiz data ────────────────────────────────────────────────────────────

const mockQuizResponse: QuizResponse = {
  quiz_id: 'test-quiz-1',
  chapter_id: 212,
  book_id: 2,
  exercise_type: 'vocabulary',
  question_count: 3,
  questions: [
    {
      question_id: 'q1',
      exercise_type: 'vocabulary',
      question_text: 'What does this character mean?',
      correct_answer: 'to study',
      explanation: '學 means to study.',
      source_citation: 'Book 2, Chapter 12',
      character: '學',
      pinyin: 'xué',
      options: ['to study', 'to teach', 'to read', 'to write'],
    },
    {
      question_id: 'q2',
      exercise_type: 'vocabulary',
      question_text: 'What is the pinyin?',
      correct_answer: 'chī',
      explanation: '吃 means to eat.',
      source_citation: 'Book 2, Chapter 12',
      character: '吃',
      options: ['chī', 'hē', 'chá', 'fàn'],
    },
    {
      question_id: 'q3',
      exercise_type: 'grammar',
      question_text: 'Which sentence is correct?',
      correct_answer: '我把書放在桌子上了',
      explanation: 'The 把 construction.',
      source_citation: 'Book 2, Chapter 12',
      options: ['我把書放在桌子上了', '我放書把桌子上了', '把我書放在桌子上了', '我書把放在桌子上了'],
    },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get a clean store state for each test */
function getStore() {
  return useQuizStore.getState()
}

function resetStore() {
  useQuizStore.getState().resetQuiz()
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useQuizStore — Story 4.3 extensions', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('initial state', () => {
    it('starts with quizPayload as null', () => {
      expect(getStore().quizPayload).toBeNull()
    })

    it('starts with currentQuestion at 0', () => {
      expect(getStore().currentQuestion).toBe(0)
    })
  })

  describe('setQuizPayload (Task 6.2)', () => {
    it('stores the quiz payload', () => {
      getStore().setQuizPayload(mockQuizResponse)
      expect(getStore().quizPayload).toEqual(mockQuizResponse)
    })

    it('does not reset currentQuestion when setting payload', () => {
      getStore().startQuiz('quiz-1')
      getStore().nextQuestion()
      getStore().setQuizPayload(mockQuizResponse)
      expect(getStore().currentQuestion).toBe(1)
    })
  })

  describe('startQuiz with optional payload (Task 6.3)', () => {
    it('accepts a payload and stores it', () => {
      getStore().startQuiz('quiz-1', mockQuizResponse)
      expect(getStore().quizPayload).toEqual(mockQuizResponse)
      expect(getStore().currentQuizId).toBe('quiz-1')
    })

    it('resets question index to 0 when starting a new quiz', () => {
      getStore().startQuiz('quiz-1', mockQuizResponse)
      getStore().nextQuestion()
      expect(getStore().currentQuestion).toBe(1)

      getStore().startQuiz('quiz-2', mockQuizResponse)
      expect(getStore().currentQuestion).toBe(0)
    })

    it('preserves existing payload when no payload provided', () => {
      getStore().setQuizPayload(mockQuizResponse)
      getStore().startQuiz('quiz-2') // No payload passed
      expect(getStore().quizPayload).toEqual(mockQuizResponse)
    })

    it('resets blankAnswers when starting a new quiz (H3 fix)', () => {
      getStore().setBlankAnswer(0, '想')
      getStore().setBlankAnswer(1, '超市')
      expect(getStore().blankAnswers[0]).toBe('想')

      getStore().startQuiz('quiz-2', mockQuizResponse)
      expect(getStore().blankAnswers).toEqual({})
    })
  })

  describe('getCurrentQuestion (Task 6.4)', () => {
    it('returns the first question when currentQuestion is 0', () => {
      getStore().setQuizPayload(mockQuizResponse)
      const question = getStore().getCurrentQuestion()
      expect(question).toEqual(mockQuizResponse.questions[0])
    })

    it('returns the second question after nextQuestion is called', () => {
      getStore().setQuizPayload(mockQuizResponse)
      getStore().nextQuestion()
      const question = getStore().getCurrentQuestion()
      expect(question).toEqual(mockQuizResponse.questions[1])
    })

    it('returns null when quizPayload is null', () => {
      expect(getStore().getCurrentQuestion()).toBeNull()
    })

    it('returns null when currentQuestion is out of range', () => {
      getStore().setQuizPayload(mockQuizResponse)
      // Manually set past end (3 questions, index 3 = out of range)
      getStore().nextQuestion()
      getStore().nextQuestion()
      getStore().nextQuestion()
      const question = getStore().getCurrentQuestion()
      expect(question).toBeNull()
    })
  })

  describe('isLastQuestion (Task 6.5)', () => {
    it('returns false for the first question of a 3-question quiz', () => {
      getStore().setQuizPayload(mockQuizResponse)
      expect(getStore().isLastQuestion()).toBe(false)
    })

    it('returns false for the second question', () => {
      getStore().setQuizPayload(mockQuizResponse)
      getStore().nextQuestion()
      expect(getStore().isLastQuestion()).toBe(false)
    })

    it('returns true for the last question (index 2 of 3)', () => {
      getStore().setQuizPayload(mockQuizResponse)
      getStore().nextQuestion()
      getStore().nextQuestion()
      expect(getStore().isLastQuestion()).toBe(true)
    })

    it('returns false when quizPayload is null', () => {
      expect(getStore().isLastQuestion()).toBe(false)
    })
  })

  describe('resetQuiz clears quizPayload (Task 6.6)', () => {
    it('sets quizPayload back to null on reset', () => {
      getStore().setQuizPayload(mockQuizResponse)
      expect(getStore().quizPayload).not.toBeNull()

      getStore().resetQuiz()
      expect(getStore().quizPayload).toBeNull()
    })

    it('resets all state fields on reset', () => {
      getStore().startQuiz('quiz-1', mockQuizResponse)
      getStore().nextQuestion()
      getStore().addScore(3)
      getStore().setAnswer(0, 'to study')

      getStore().resetQuiz()

      const state = getStore()
      expect(state.currentQuizId).toBeNull()
      expect(state.currentQuestion).toBe(0)
      expect(state.answers).toEqual({})
      expect(state.score).toBe(0)
      expect(state.quizPayload).toBeNull()
    })
  })

  describe('matchingScore state — Story 4.5 (Task 4.6)', () => {
    it('starts with matchingScore { correct: 0, incorrect: 0 }', () => {
      expect(getStore().matchingScore).toEqual({ correct: 0, incorrect: 0 })
    })

    it('addMatchedPairScore increments correct count', () => {
      getStore().addMatchedPairScore()
      getStore().addMatchedPairScore()
      expect(getStore().matchingScore.correct).toBe(2)
    })

    it('addIncorrectMatchingAttempt increments incorrect count', () => {
      getStore().addIncorrectMatchingAttempt()
      expect(getStore().matchingScore.incorrect).toBe(1)
    })

    it('addMatchedPairScore does not affect incorrect count', () => {
      getStore().addMatchedPairScore()
      expect(getStore().matchingScore.incorrect).toBe(0)
    })

    it('addIncorrectMatchingAttempt does not affect correct count', () => {
      getStore().addIncorrectMatchingAttempt()
      expect(getStore().matchingScore.correct).toBe(0)
    })

    it('resetMatchingScore resets both counts to 0', () => {
      getStore().addMatchedPairScore()
      getStore().addIncorrectMatchingAttempt()
      getStore().resetMatchingScore()
      expect(getStore().matchingScore).toEqual({ correct: 0, incorrect: 0 })
    })

    it('nextQuestion resets matchingScore to { correct: 0, incorrect: 0 }', () => {
      getStore().addMatchedPairScore()
      getStore().addIncorrectMatchingAttempt()
      getStore().nextQuestion()
      expect(getStore().matchingScore).toEqual({ correct: 0, incorrect: 0 })
    })

    it('resetQuiz resets matchingScore to { correct: 0, incorrect: 0 }', () => {
      getStore().addMatchedPairScore()
      getStore().addIncorrectMatchingAttempt()
      getStore().resetQuiz()
      expect(getStore().matchingScore).toEqual({ correct: 0, incorrect: 0 })
    })

    it('startQuiz resets matchingScore to { correct: 0, incorrect: 0 }', () => {
      getStore().addMatchedPairScore()
      getStore().startQuiz('quiz-new', mockQuizResponse)
      expect(getStore().matchingScore).toEqual({ correct: 0, incorrect: 0 })
    })
  })

  describe('blankAnswers state — Story 4.4 (Task 6.9)', () => {
    it('starts with empty blankAnswers', () => {
      expect(getStore().blankAnswers).toEqual({})
    })

    it('setBlankAnswer stores a word at the given blank index', () => {
      getStore().setBlankAnswer(0, '想')
      expect(getStore().blankAnswers[0]).toBe('想')
    })

    it('setBlankAnswer can store multiple blanks independently', () => {
      getStore().setBlankAnswer(0, '想')
      getStore().setBlankAnswer(1, '超市')
      expect(getStore().blankAnswers[0]).toBe('想')
      expect(getStore().blankAnswers[1]).toBe('超市')
    })

    it('clearBlankAnswer sets a blank back to null', () => {
      getStore().setBlankAnswer(0, '想')
      getStore().clearBlankAnswer(0)
      expect(getStore().blankAnswers[0]).toBeNull()
    })

    it('clearBlankAnswer only affects the specified blank', () => {
      getStore().setBlankAnswer(0, '想')
      getStore().setBlankAnswer(1, '超市')
      getStore().clearBlankAnswer(0)
      expect(getStore().blankAnswers[0]).toBeNull()
      expect(getStore().blankAnswers[1]).toBe('超市')
    })

    it('nextQuestion resets blankAnswers to empty object', () => {
      getStore().setBlankAnswer(0, '想')
      getStore().setBlankAnswer(1, '超市')
      getStore().nextQuestion()
      expect(getStore().blankAnswers).toEqual({})
    })

    it('resetQuiz resets blankAnswers to empty object', () => {
      getStore().setBlankAnswer(0, '想')
      getStore().resetQuiz()
      expect(getStore().blankAnswers).toEqual({})
    })
  })

  describe('tile placement state — Story 4.7 (Task 3)', () => {
    it('starts with empty placedTileIds', () => {
      expect(getStore().placedTileIds).toEqual([])
    })

    it('placeTile appends a tile ID to placedTileIds', () => {
      getStore().placeTile('tile-0')
      expect(getStore().placedTileIds).toEqual(['tile-0'])
    })

    it('placeTile appends multiple tiles in order', () => {
      getStore().placeTile('tile-2')
      getStore().placeTile('tile-0')
      getStore().placeTile('tile-3')
      expect(getStore().placedTileIds).toEqual(['tile-2', 'tile-0', 'tile-3'])
    })

    it('removeTile removes a tile ID from placedTileIds', () => {
      getStore().placeTile('tile-0')
      getStore().placeTile('tile-1')
      getStore().removeTile('tile-0')
      expect(getStore().placedTileIds).toEqual(['tile-1'])
    })

    it('removeTile preserves order of remaining tiles', () => {
      getStore().placeTile('tile-0')
      getStore().placeTile('tile-1')
      getStore().placeTile('tile-2')
      getStore().removeTile('tile-1')
      expect(getStore().placedTileIds).toEqual(['tile-0', 'tile-2'])
    })

    it('removeTile is a no-op when tile ID not found', () => {
      getStore().placeTile('tile-0')
      getStore().removeTile('tile-99')
      expect(getStore().placedTileIds).toEqual(['tile-0'])
    })

    it('clearTiles resets placedTileIds to empty array', () => {
      getStore().placeTile('tile-0')
      getStore().placeTile('tile-1')
      getStore().clearTiles()
      expect(getStore().placedTileIds).toEqual([])
    })

    it('nextQuestion resets placedTileIds to empty array', () => {
      getStore().placeTile('tile-0')
      getStore().nextQuestion()
      expect(getStore().placedTileIds).toEqual([])
    })

    it('resetQuiz resets placedTileIds to empty array', () => {
      getStore().placeTile('tile-0')
      getStore().placeTile('tile-1')
      getStore().resetQuiz()
      expect(getStore().placedTileIds).toEqual([])
    })

    it('startQuiz resets placedTileIds to empty array', () => {
      getStore().placeTile('tile-0')
      getStore().startQuiz('quiz-new', mockQuizResponse)
      expect(getStore().placedTileIds).toEqual([])
    })
  })

  describe('feedback state — Story 4.9 (Task 4)', () => {
    it('starts with showFeedback as false (Task 4.1)', () => {
      expect(getStore().showFeedback).toBe(false)
    })

    it('starts with feedbackIsCorrect as null (Task 4.2)', () => {
      expect(getStore().feedbackIsCorrect).toBeNull()
    })

    it('showFeedback(true) sets showFeedback to true and feedbackIsCorrect to true (Task 4.3)', () => {
      getStore().triggerShowFeedback(true)
      expect(getStore().showFeedback).toBe(true)
      expect(getStore().feedbackIsCorrect).toBe(true)
    })

    it('showFeedback(false) sets showFeedback to true and feedbackIsCorrect to false (Task 4.3)', () => {
      getStore().triggerShowFeedback(false)
      expect(getStore().showFeedback).toBe(true)
      expect(getStore().feedbackIsCorrect).toBe(false)
    })

    it('hideFeedback() sets showFeedback to false and feedbackIsCorrect to null (Task 4.4)', () => {
      getStore().triggerShowFeedback(true)
      getStore().hideFeedback()
      expect(getStore().showFeedback).toBe(false)
      expect(getStore().feedbackIsCorrect).toBeNull()
    })

    it('resetQuiz() resets feedback state to defaults (Task 4.5)', () => {
      getStore().triggerShowFeedback(true)
      getStore().resetQuiz()
      expect(getStore().showFeedback).toBe(false)
      expect(getStore().feedbackIsCorrect).toBeNull()
    })

    it('nextQuestion() resets feedback state (Task 4.5)', () => {
      getStore().triggerShowFeedback(false)
      getStore().nextQuestion()
      expect(getStore().showFeedback).toBe(false)
      expect(getStore().feedbackIsCorrect).toBeNull()
    })
  })

  describe('existing actions (regression tests)', () => {
    it('setAnswer stores the answer at the correct index', () => {
      getStore().setAnswer(1, 'to study')
      expect(getStore().answers[1]).toBe('to study')
    })

    it('addScore accumulates points', () => {
      getStore().addScore(2)
      getStore().addScore(3)
      expect(getStore().score).toBe(5)
    })

    it('nextQuestion increments currentQuestion', () => {
      getStore().nextQuestion()
      getStore().nextQuestion()
      expect(getStore().currentQuestion).toBe(2)
    })
  })
})

describe('useQuizStore — Story 4.11 completion state (Task 1)', () => {
  beforeEach(() => {
    useQuizStore.getState().resetQuiz()
  })

  describe('initial state', () => {
    it('starts with isComplete as false (Task 1.1)', () => {
      expect(useQuizStore.getState().isComplete).toBe(false)
    })

    it('starts with quizStartTime as null (Task 1.2)', () => {
      expect(useQuizStore.getState().quizStartTime).toBeNull()
    })
  })

  describe('startQuiz() sets quizStartTime (Task 1.2)', () => {
    it('sets quizStartTime to a number when startQuiz is called', () => {
      useQuizStore.getState().startQuiz('quiz-1', mockQuizResponse, 212, 2, 'vocabulary')
      expect(typeof useQuizStore.getState().quizStartTime).toBe('number')
    })

    it('quizStartTime is a recent timestamp (within 5 seconds)', () => {
      const before = Date.now()
      useQuizStore.getState().startQuiz('quiz-1', mockQuizResponse)
      const after = Date.now()
      const startTime = useQuizStore.getState().quizStartTime
      expect(startTime).toBeGreaterThanOrEqual(before)
      expect(startTime).toBeLessThanOrEqual(after)
    })
  })

  describe('completeQuiz() action (Task 1.3)', () => {
    it('sets isComplete to true', () => {
      useQuizStore.getState().completeQuiz()
      expect(useQuizStore.getState().isComplete).toBe(true)
    })
  })

  describe('getQuizDuration() derived getter (Task 1.4)', () => {
    it('returns 0 when quizStartTime is null', () => {
      expect(useQuizStore.getState().getQuizDuration()).toBe(0)
    })

    it('returns elapsed minutes (approximately 0 for a just-started quiz)', () => {
      useQuizStore.getState().startQuiz('quiz-1', mockQuizResponse)
      const duration = useQuizStore.getState().getQuizDuration()
      expect(typeof duration).toBe('number')
      expect(duration).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getIncorrectAnswers() derived getter (Task 1.5)', () => {
    it('returns empty array when no quiz payload', () => {
      expect(useQuizStore.getState().getIncorrectAnswers()).toEqual([])
    })

    it('returns empty array when all answers are correct', () => {
      useQuizStore.getState().startQuiz('quiz-1', mockQuizResponse)
      // Answer all correctly
      useQuizStore.getState().setAnswer(0, 'to study')
      useQuizStore.getState().setAnswer(1, 'chī')
      useQuizStore.getState().setAnswer(2, '我把書放在桌子上了')
      const incorrect = useQuizStore.getState().getIncorrectAnswers()
      expect(incorrect).toHaveLength(0)
    })

    it('returns incorrect answers with questionIndex, userAnswer, correctAnswer', () => {
      useQuizStore.getState().startQuiz('quiz-1', mockQuizResponse)
      useQuizStore.getState().setAnswer(0, 'to teach') // wrong
      useQuizStore.getState().setAnswer(1, 'chī') // correct
      useQuizStore.getState().setAnswer(2, '我放書把桌子上了') // wrong
      const incorrect = useQuizStore.getState().getIncorrectAnswers()
      expect(incorrect).toHaveLength(2)
      expect(incorrect[0]).toEqual({
        questionIndex: 0,
        userAnswer: 'to teach',
        correctAnswer: 'to study',
      })
      expect(incorrect[1]).toEqual({
        questionIndex: 2,
        userAnswer: '我放書把桌子上了',
        correctAnswer: '我把書放在桌子上了',
      })
    })

    it('returns empty array when no answers recorded', () => {
      useQuizStore.getState().startQuiz('quiz-1', mockQuizResponse)
      // No answers set
      const incorrect = useQuizStore.getState().getIncorrectAnswers()
      expect(incorrect).toEqual([])
    })
  })

  describe('resetQuiz() resets completion state (Task 1.6)', () => {
    it('resets isComplete to false on reset', () => {
      useQuizStore.getState().completeQuiz()
      expect(useQuizStore.getState().isComplete).toBe(true)
      useQuizStore.getState().resetQuiz()
      expect(useQuizStore.getState().isComplete).toBe(false)
    })

    it('resets quizStartTime to null on reset', () => {
      useQuizStore.getState().startQuiz('quiz-1', mockQuizResponse)
      useQuizStore.getState().resetQuiz()
      expect(useQuizStore.getState().quizStartTime).toBeNull()
    })
  })
})

describe('useQuizStore — Story 4.10 persist middleware', () => {
  beforeEach(() => {
    useQuizStore.getState().resetQuiz()
  })

  describe('chapterId / bookId / exerciseType fields (Task 1.6)', () => {
    it('starts with chapterId as null', () => {
      expect(useQuizStore.getState().chapterId).toBeNull()
    })

    it('starts with bookId as null', () => {
      expect(useQuizStore.getState().bookId).toBeNull()
    })

    it('starts with exerciseType as null', () => {
      expect(useQuizStore.getState().exerciseType).toBeNull()
    })
  })

  describe('startQuiz() with chapterId/bookId/exerciseType (Task 1.7)', () => {
    it('stores chapterId, bookId, exerciseType when passed to startQuiz', () => {
      useQuizStore.getState().startQuiz('quiz-1', mockQuizResponse, 101, 1, 'vocabulary')
      const state = useQuizStore.getState()
      expect(state.chapterId).toBe(101)
      expect(state.bookId).toBe(1)
      expect(state.exerciseType).toBe('vocabulary')
      expect(state.currentQuizId).toBe('quiz-1')
    })

    it('starts chapterId/bookId/exerciseType as null when not provided', () => {
      useQuizStore.getState().startQuiz('quiz-1')
      const state = useQuizStore.getState()
      expect(state.chapterId).toBeNull()
      expect(state.bookId).toBeNull()
      expect(state.exerciseType).toBeNull()
    })
  })

  describe('hasActiveQuiz() derived getter (Task 1.8)', () => {
    it('returns false when store is empty', () => {
      expect(useQuizStore.getState().hasActiveQuiz()).toBe(false)
    })

    it('returns false when currentQuizId is set but quizPayload is null', () => {
      useQuizStore.getState().startQuiz('quiz-1')
      expect(useQuizStore.getState().hasActiveQuiz()).toBe(false)
    })

    it('returns true when both currentQuizId and quizPayload are set', () => {
      useQuizStore.getState().startQuiz('quiz-1', mockQuizResponse)
      expect(useQuizStore.getState().hasActiveQuiz()).toBe(true)
    })

    it('returns false after resetQuiz()', () => {
      useQuizStore.getState().startQuiz('quiz-1', mockQuizResponse)
      useQuizStore.getState().resetQuiz()
      expect(useQuizStore.getState().hasActiveQuiz()).toBe(false)
    })
  })

  describe('resetQuiz() clears all persist fields (Task 1.9)', () => {
    it('clears chapterId, bookId, exerciseType on reset', () => {
      useQuizStore.getState().startQuiz('quiz-1', mockQuizResponse, 101, 1, 'grammar')
      useQuizStore.getState().resetQuiz()
      const state = useQuizStore.getState()
      expect(state.chapterId).toBeNull()
      expect(state.bookId).toBeNull()
      expect(state.exerciseType).toBeNull()
      expect(state.currentQuizId).toBeNull()
      expect(state.quizPayload).toBeNull()
    })
  })

  describe('_hasHydrated and setHasHydrated (Task 1.10)', () => {
    it('_hasHydrated field exists on the store', () => {
      // In the test environment, the AsyncStorage mock rehydrates synchronously,
      // so _hasHydrated may already be true. We only verify the field exists and
      // is a boolean (not undefined).
      expect(typeof useQuizStore.getState()._hasHydrated).toBe('boolean')
    })

    it('setHasHydrated(true) sets _hasHydrated to true', () => {
      useQuizStore.getState().setHasHydrated(true)
      expect(useQuizStore.getState()._hasHydrated).toBe(true)
    })

    it('setHasHydrated(false) sets _hasHydrated back to false', () => {
      useQuizStore.getState().setHasHydrated(true)
      useQuizStore.getState().setHasHydrated(false)
      expect(useQuizStore.getState()._hasHydrated).toBe(false)
    })
  })
})
