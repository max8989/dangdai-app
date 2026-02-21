/**
 * Quiz Play Screen Tests
 *
 * Integration tests for the quiz play screen.
 * Tests: initial render with quiz data, answer selection, question advancement,
 * last question handling, and edge cases.
 *
 * Story 4.3: Vocabulary & Grammar Quiz (Multiple Choice)
 */

import React from 'react'
import { render, fireEvent, act, waitFor } from '@testing-library/react-native'

import type { QuizResponse } from '../../types/quiz'

// ─── Mock data ────────────────────────────────────────────────────────────────

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
      explanation: '學 (xué) means to study/learn.',
      source_citation: 'Book 2, Chapter 12 - Vocabulary',
      character: '學',
      pinyin: 'xué',
      options: ['to study', 'to teach', 'to read', 'to write'],
    },
    {
      question_id: 'q2',
      exercise_type: 'vocabulary',
      question_text: 'What is the pinyin for this character?',
      correct_answer: 'chī',
      explanation: '吃 means to eat.',
      source_citation: 'Book 2, Chapter 12 - Vocabulary',
      character: '吃',
      options: ['chī', 'hē', 'chá', 'fàn'],
    },
    {
      question_id: 'q3',
      exercise_type: 'grammar',
      question_text: 'Which sentence correctly uses the 把 construction?',
      correct_answer: '我把書放在桌子上了',
      explanation: 'The 把 construction places the object before the verb.',
      source_citation: 'Book 2, Chapter 12 - Grammar',
      options: [
        '我把書放在桌子上了',
        '我放書把桌子上了',
        '把我書放在桌子上了',
        '我書把放在桌子上了',
      ],
    },
  ],
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRouterReplace = jest.fn()
const mockRouterBack = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
    back: mockRouterBack,
  }),
  Stack: {
    Screen: ({ options }: any) => null,
  },
}))

jest.mock('tamagui', () => {
  const { View, Text, TouchableOpacity, Modal } = require('react-native')

  return {
    YStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    XStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    Text: ({ children, testID }: any) => <Text testID={testID}>{children}</Text>,
    Button: ({ children, onPress, testID, disabled }: any) => (
      <TouchableOpacity testID={testID} onPress={onPress} disabled={disabled}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
    Dialog: {
      Portal: ({ children }: any) => <>{children}</>,
      Overlay: () => null,
      Content: ({ children }: any) => <View>{children}</View>,
      Title: ({ children }: any) => <Text>{children}</Text>,
      Description: ({ children }: any) => <Text>{children}</Text>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    Spinner: ({ testID }: any) => <View testID={testID} />,
    Theme: ({ children }: any) => <>{children}</>,
    Card: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    styled: (_component: any, _config: any) => {
      const Mock = ({ children, testID, onPress, disabled, ...rest }: any) => (
        <TouchableOpacity testID={testID} onPress={onPress} disabled={disabled} {...rest}>
          <Text>{children}</Text>
        </TouchableOpacity>
      )
      return Mock
    },
  }
})

// Mock quiz components to simplify integration test rendering
jest.mock('../../components/quiz/QuizQuestionCard', () => ({
  QuizQuestionCard: ({ questionTypeLabel, primaryContent, secondaryContent, testID }: any) => {
    const { View, Text } = require('react-native')
    return (
      <View testID={testID || 'quiz-question-card'}>
        <Text testID="question-type-label">{questionTypeLabel}</Text>
        <Text testID="primary-content">{primaryContent}</Text>
        {secondaryContent ? <Text testID="secondary-content">{secondaryContent}</Text> : null}
      </View>
    )
  },
}))

jest.mock('../../components/quiz/AnswerOptionGrid', () => ({
  AnswerOptionGrid: ({ options, onSelect, disabled, testID }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native')
    return (
      <View testID={testID || 'answer-option-grid'}>
        {options.map((option: string, index: number) => (
          <TouchableOpacity
            key={option}
            testID={`answer-option-${index}`}
            onPress={() => !disabled && onSelect(option)}
            disabled={disabled}
          >
            <Text>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )
  },
}))

jest.mock('../../components/quiz/QuizProgress', () => ({
  QuizProgress: ({ currentQuestion, totalQuestions, testID }: any) => {
    const { View, Text } = require('react-native')
    return (
      <View testID={testID || 'quiz-progress'}>
        <Text testID="progress-text">{currentQuestion}/{totalQuestions}</Text>
      </View>
    )
  },
}))

// Mock lucide icons
jest.mock('@tamagui/lucide-icons', () => ({
  ArrowLeft: () => null,
}))

// ─── Store mock (isolated per test) ──────────────────────────────────────────

let mockQuizState = {
  quizPayload: null as QuizResponse | null,
  currentQuestion: 0,
  answers: {} as Record<number, string>,
  score: 0,
  currentQuizId: null as string | null,
}

const mockStartQuiz = jest.fn()
const mockSetAnswer = jest.fn()
const mockNextQuestion = jest.fn()
const mockAddScore = jest.fn()
const mockResetQuiz = jest.fn()

const mockGetCurrentQuestion = jest.fn(() => {
  if (!mockQuizState.quizPayload) return null
  return mockQuizState.quizPayload.questions[mockQuizState.currentQuestion] ?? null
})

const mockIsLastQuestion = jest.fn(() => {
  if (!mockQuizState.quizPayload) return false
  return mockQuizState.currentQuestion >= mockQuizState.quizPayload.questions.length - 1
})

jest.mock('../../stores/useQuizStore', () => ({
  useQuizStore: (selector: any) => {
    const state = {
      ...mockQuizState,
      startQuiz: mockStartQuiz,
      setAnswer: mockSetAnswer,
      nextQuestion: mockNextQuestion,
      addScore: mockAddScore,
      resetQuiz: mockResetQuiz,
      getCurrentQuestion: mockGetCurrentQuestion,
      isLastQuestion: mockIsLastQuestion,
    }
    return selector ? selector(state) : state
  },
}))

// Import AFTER all mocks
import QuizPlayScreen from './play'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('QuizPlayScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockQuizState = {
      quizPayload: mockQuizResponse,
      currentQuestion: 0,
      answers: {},
      score: 0,
      currentQuizId: 'test-quiz-1',
    }
    mockGetCurrentQuestion.mockImplementation(() => {
      if (!mockQuizState.quizPayload) return null
      return mockQuizState.quizPayload.questions[mockQuizState.currentQuestion] ?? null
    })
    mockIsLastQuestion.mockImplementation(() => {
      if (!mockQuizState.quizPayload) return false
      return mockQuizState.currentQuestion >= mockQuizState.quizPayload.questions.length - 1
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('initial render with quiz data (AC #3)', () => {
    it('renders the quiz play screen', () => {
      const { getByTestId } = render(<QuizPlayScreen />)
      expect(getByTestId('quiz-play-screen')).toBeTruthy()
    })

    it('calls startQuiz on mount (AC #3)', () => {
      render(<QuizPlayScreen />)
      expect(mockStartQuiz).toHaveBeenCalledWith('test-quiz-1')
    })

    it('displays the first question', () => {
      const { getByTestId } = render(<QuizPlayScreen />)
      expect(getByTestId('quiz-question-card')).toBeTruthy()
    })

    it('renders QuizProgress component', () => {
      const { getByTestId } = render(<QuizPlayScreen />)
      expect(getByTestId('quiz-progress')).toBeTruthy()
    })

    it('renders AnswerOptionGrid', () => {
      const { getByTestId } = render(<QuizPlayScreen />)
      expect(getByTestId('answer-option-grid')).toBeTruthy()
    })

    it('shows correct progress position 1/3 for first question', () => {
      const { getByTestId } = render(<QuizPlayScreen />)
      expect(getByTestId('progress-text')).toHaveTextContent('1/3')
    })
  })

  describe('edge case: no quiz data (AC #4)', () => {
    it('navigates back when quizPayload is null', async () => {
      mockQuizState.quizPayload = null
      mockGetCurrentQuestion.mockReturnValue(null)

      // Component renders null and schedules redirect via useEffect — use waitFor
      render(<QuizPlayScreen />)

      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)/books')
      })
    })
  })

  describe('answer selection (AC #2)', () => {
    it('validates answer locally against correct_answer', async () => {
      const { getByTestId } = render(<QuizPlayScreen />)

      fireEvent.press(getByTestId('answer-option-0')) // 'to study' is correct

      expect(mockSetAnswer).toHaveBeenCalledWith(0, 'to study')
      expect(mockAddScore).toHaveBeenCalledWith(1)
    })

    it('does not add score for wrong answer', async () => {
      const { getByTestId } = render(<QuizPlayScreen />)

      fireEvent.press(getByTestId('answer-option-1')) // 'to teach' is wrong

      expect(mockSetAnswer).toHaveBeenCalledWith(0, 'to teach')
      expect(mockAddScore).not.toHaveBeenCalled()
    })
  })

  describe('question advancement (AC #2)', () => {
    it('calls nextQuestion after feedback delay (~1s)', async () => {
      const { getByTestId } = render(<QuizPlayScreen />)

      fireEvent.press(getByTestId('answer-option-0'))

      // Before delay: nextQuestion not called yet
      expect(mockNextQuestion).not.toHaveBeenCalled()

      // After 1s feedback delay
      act(() => {
        jest.advanceTimersByTime(1100)
      })

      expect(mockNextQuestion).toHaveBeenCalled()
    })
  })

  describe('last question handling (AC #4)', () => {
    it('navigates to results after last question is answered', async () => {
      // Set to last question
      mockQuizState.currentQuestion = 2
      mockIsLastQuestion.mockReturnValue(true)
      mockGetCurrentQuestion.mockReturnValue(mockQuizResponse.questions[2])

      const { getByTestId } = render(<QuizPlayScreen />)

      fireEvent.press(getByTestId('answer-option-0')) // select first option

      act(() => {
        jest.advanceTimersByTime(1100)
      })

      // Should navigate to completion (placeholder)
      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalled()
      })
    })
  })
})
