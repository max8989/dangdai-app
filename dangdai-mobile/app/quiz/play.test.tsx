/**
 * Quiz Play Screen Tests
 *
 * Integration tests for the quiz play screen.
 * Tests: initial render with quiz data, answer selection, question advancement,
 * last question handling, fill-in-blank rendering, dialogue completion, and edge cases.
 *
 * Story 4.3: Vocabulary & Grammar Quiz (Multiple Choice)
 * Story 4.4: Fill-in-the-Blank Exercise (Word Bank) — Tasks 6.10, 6.11
 * Story 4.6: Dialogue Completion Exercise — Task 5 integration
 * Story 4.7: Sentence Construction Exercise — Task 6.10 (play.tsx integration)
 */

import React from 'react'
import { render, fireEvent, act, waitFor } from '@testing-library/react-native'

import type { QuizResponse } from '../../types/quiz'

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockFillInBlankQuizResponse: QuizResponse = {
  quiz_id: 'test-fib-quiz-1',
  chapter_id: 105,
  book_id: 1,
  exercise_type: 'fill_in_blank',
  question_count: 2,
  questions: [
    {
      question_id: 'fib-q1',
      exercise_type: 'fill_in_blank',
      question_text: 'Complete the sentence:',
      correct_answer: '想,超市',
      explanation: '想 means "want to" and 超市 means "supermarket".',
      source_citation: 'Book 1, Chapter 5',
      sentence_with_blanks: '我___去___買東西。',
      word_bank: ['想', '要', '超市', '商店', '會'],
      blank_positions: [0, 1],
    },
    {
      question_id: 'fib-q2',
      exercise_type: 'fill_in_blank',
      question_text: 'Complete the sentence:',
      correct_answer: '喜歡',
      explanation: '喜歡 means "to like".',
      source_citation: 'Book 1, Chapter 5',
      sentence_with_blanks: '我很___吃中國菜。',
      word_bank: ['喜歡', '想要', '可以', '應該'],
      blank_positions: [0],
    },
  ],
}

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

const mockSentenceConstructionQuizResponse: QuizResponse = {
  quiz_id: 'test-sc-quiz-1',
  chapter_id: 212,
  book_id: 2,
  exercise_type: 'sentence_construction',
  question_count: 2,
  questions: [
    {
      question_id: 'sc-q1',
      exercise_type: 'sentence_construction',
      question_text: 'Arrange the words into a correct sentence:',
      correct_answer: '我很喜歡咖啡。',
      explanation: 'The adverb 很 comes before the verb 喜歡 in Chinese.',
      source_citation: 'Book 2, Chapter 12 - Grammar',
      scrambled_words: ['咖啡', '我', '喜歡', '很', '。'],
      correct_order: ['我', '很', '喜歡', '咖啡', '。'],
    },
    {
      question_id: 'sc-q2',
      exercise_type: 'sentence_construction',
      question_text: 'Arrange the words into a correct sentence:',
      correct_answer: '他每天早上喝咖啡。',
      explanation: 'Time expressions come before the verb.',
      source_citation: 'Book 2, Chapter 12 - Grammar',
      scrambled_words: ['喝', '每天', '他', '咖啡', '早上', '。'],
      correct_order: ['他', '每天', '早上', '喝', '咖啡', '。'],
    },
  ],
}

const mockDialogueQuizResponse: QuizResponse = {
  quiz_id: 'test-dialogue-quiz-1',
  chapter_id: 112,
  book_id: 1,
  exercise_type: 'dialogue_completion',
  question_count: 2,
  questions: [
    {
      question_id: 'dq1',
      exercise_type: 'dialogue_completion',
      question_text: 'Complete the conversation by selecting the best response.',
      correct_answer: '咖啡',
      explanation: 'The question asks what you want to drink. 咖啡 (coffee) is the appropriate response.',
      source_citation: 'Book 1, Chapter 12 - Dialogue',
      dialogue_lines: [
        { speaker: 'a', text: '你要喝什麼？', isBlank: false },
        { speaker: 'b', text: '', isBlank: true },
        { speaker: 'a', text: '好的，我也是。', isBlank: false },
      ],
      options: ['咖啡', '你好', '謝謝', '再見'],
    },
    {
      question_id: 'dq2',
      exercise_type: 'dialogue_completion',
      question_text: 'Complete the conversation.',
      correct_answer: '謝謝',
      explanation: '謝謝 means "thank you".',
      source_citation: 'Book 1, Chapter 12 - Dialogue',
      dialogue_lines: [
        { speaker: 'a', text: '這是你的書。', isBlank: false },
        { speaker: 'b', text: '', isBlank: true },
      ],
      options: ['謝謝', '你好', '再見'],
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

// Mock fill-in-blank components
jest.mock('../../components/quiz/FillInBlankSentence', () => ({
  FillInBlankSentence: ({ sentenceWithBlanks, filledBlanks, onBlankTap, testID }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native')
    const parts = sentenceWithBlanks.split('___')
    return (
      <View testID={testID || 'fill-in-blank-sentence'}>
        <Text testID="sentence-text">{sentenceWithBlanks}</Text>
        {parts.slice(0, -1).map((_: any, i: number) => (
          <TouchableOpacity
            key={i}
            testID={`blank-slot-${i}`}
            onPress={() => filledBlanks[i] && onBlankTap(i)}
          >
            <Text>{filledBlanks[i] ?? '___'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )
  },
}))

jest.mock('../../components/quiz/WordBankSelector', () => ({
  WordBankSelector: ({ words, usedIndices, onWordSelect, disabled, testID }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native')
    return (
      <View testID={testID || 'word-bank-selector'}>
        {words.map((word: string, index: number) => {
          const isUsed = usedIndices?.has(index) ?? false
          const isDisabled = disabled || isUsed
          return (
            <TouchableOpacity
              key={index}
              testID={`word-bank-item-${index}`}
              onPress={() => !isDisabled && onWordSelect(word, index)}
              disabled={isDisabled}
            >
              <Text>{word}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    )
  },
}))

// Mock SentenceBuilder component (added in Story 4.7)
jest.mock('../../components/quiz/SentenceBuilder', () => ({
  SentenceBuilder: ({ questionText, scrambledWords, onAnswer, testID }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native')
    return (
      <View testID={testID || 'sentence-builder'}>
        <Text testID="sentence-builder-question">{questionText}</Text>
        <Text testID="sentence-builder-word-count">{scrambledWords?.length ?? 0}</Text>
        <TouchableOpacity
          testID="sentence-builder-correct-trigger"
          onPress={() => onAnswer(true)}
        >
          <Text>Submit Correct</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="sentence-builder-incorrect-trigger"
          onPress={() => onAnswer(false)}
        >
          <Text>Submit Incorrect</Text>
        </TouchableOpacity>
      </View>
    )
  },
}))

// Mock DialogueCard component (added in Story 4.6)
jest.mock('../../components/quiz/DialogueCard', () => ({
  DialogueCard: ({ question, onAnswerResult, testID }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native')
    return (
      <View testID={testID || 'dialogue-card'}>
        <Text testID="dialogue-question-text">{question?.question_text}</Text>
        {(question?.options ?? []).map((option: string, index: number) => (
          <TouchableOpacity
            key={option}
            testID={`dialogue-option-${index}`}
            onPress={() => onAnswerResult({
              correct: option === question?.correct_answer,
              selectedAnswer: option,
              isAlternative: false,
              explanation: question?.explanation ?? '',
            })}
          >
            <Text>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )
  },
}))

// ─── Store mock (isolated per test) ──────────────────────────────────────────

let mockQuizState = {
  quizPayload: null as QuizResponse | null,
  currentQuestion: 0,
  answers: {} as Record<number, string>,
  score: 0,
  currentQuizId: null as string | null,
  blankAnswers: {} as Record<number, string | null>,
  blankAnswerIndices: {} as Record<number, number | null>,
  placedTileIds: [] as string[],
}

const mockStartQuiz = jest.fn()
const mockSetAnswer = jest.fn()
const mockNextQuestion = jest.fn()
const mockAddScore = jest.fn()
const mockResetQuiz = jest.fn()
const mockSetBlankAnswer = jest.fn((blankIndex: number, word: string | null, wordBankIndex: number | null = null) => {
  mockQuizState.blankAnswers = { ...mockQuizState.blankAnswers, [blankIndex]: word }
  mockQuizState.blankAnswerIndices = { ...mockQuizState.blankAnswerIndices, [blankIndex]: wordBankIndex }
})
const mockClearBlankAnswer = jest.fn((blankIndex: number) => {
  mockQuizState.blankAnswers = { ...mockQuizState.blankAnswers, [blankIndex]: null }
  mockQuizState.blankAnswerIndices = { ...mockQuizState.blankAnswerIndices, [blankIndex]: null }
})
const mockClearTiles = jest.fn()

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
      setBlankAnswer: mockSetBlankAnswer,
      clearBlankAnswer: mockClearBlankAnswer,
      clearTiles: mockClearTiles,
      getCurrentQuestion: mockGetCurrentQuestion,
      isLastQuestion: mockIsLastQuestion,
      blankAnswerIndices: mockQuizState.blankAnswerIndices,
      placedTileIds: mockQuizState.placedTileIds,
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
      blankAnswers: {},
      blankAnswerIndices: {},
      placedTileIds: [],
    }
    mockGetCurrentQuestion.mockImplementation(() => {
      if (!mockQuizState.quizPayload) return null
      return mockQuizState.quizPayload.questions[mockQuizState.currentQuestion] ?? null
    })
    mockIsLastQuestion.mockImplementation(() => {
      if (!mockQuizState.quizPayload) return false
      return mockQuizState.currentQuestion >= mockQuizState.quizPayload.questions.length - 1
    })
    // Reset fill-in-blank mocks
    mockSetBlankAnswer.mockImplementation((blankIndex: number, word: string | null, wordBankIndex: number | null = null) => {
      mockQuizState.blankAnswers = { ...mockQuizState.blankAnswers, [blankIndex]: word }
      mockQuizState.blankAnswerIndices = { ...mockQuizState.blankAnswerIndices, [blankIndex]: wordBankIndex }
    })
    mockClearBlankAnswer.mockImplementation((blankIndex: number) => {
      mockQuizState.blankAnswers = { ...mockQuizState.blankAnswers, [blankIndex]: null }
      mockQuizState.blankAnswerIndices = { ...mockQuizState.blankAnswerIndices, [blankIndex]: null }
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

  // ─── Story 4.4: Fill-in-the-Blank Integration Tests ──────────────────────────

  describe('fill-in-blank: renders sentence + word bank (Task 6.10, AC #1)', () => {
    beforeEach(() => {
      mockQuizState.quizPayload = mockFillInBlankQuizResponse
      mockQuizState.currentQuestion = 0
      mockGetCurrentQuestion.mockReturnValue(mockFillInBlankQuizResponse.questions[0])
      mockIsLastQuestion.mockReturnValue(false)
    })

    it('renders fill-in-blank sentence component', () => {
      const { getByTestId } = render(<QuizPlayScreen />)
      expect(getByTestId('fill-in-blank-sentence')).toBeTruthy()
    })

    it('renders word bank selector component', () => {
      const { getByTestId } = render(<QuizPlayScreen />)
      expect(getByTestId('word-bank-selector')).toBeTruthy()
    })

    it('does not render multiple choice answer grid for fill-in-blank', () => {
      const { queryByTestId } = render(<QuizPlayScreen />)
      expect(queryByTestId('answer-option-grid')).toBeNull()
    })

    it('renders all word bank items from the word_bank field', () => {
      const { getByTestId } = render(<QuizPlayScreen />)
      // word_bank has 5 words for question 1
      expect(getByTestId('word-bank-item-0')).toBeTruthy()
      expect(getByTestId('word-bank-item-4')).toBeTruthy()
    })
  })

  describe('fill-in-blank: selecting words fills blanks (Task 6.11, AC #2)', () => {
    beforeEach(() => {
      mockQuizState.quizPayload = mockFillInBlankQuizResponse
      mockQuizState.currentQuestion = 0
      mockGetCurrentQuestion.mockReturnValue(mockFillInBlankQuizResponse.questions[0])
      mockIsLastQuestion.mockReturnValue(false)
    })

    it('calls setBlankAnswer with word value and word-bank index when a word is tapped', () => {
      const { getByTestId } = render(<QuizPlayScreen />)
      fireEvent.press(getByTestId('word-bank-item-0')) // '想' at index 0
      expect(mockSetBlankAnswer).toHaveBeenCalledWith(0, '想', 0)
    })

    it('fills the next empty blank when a second word is tapped', () => {
      // Simulate first blank already filled
      mockQuizState.blankAnswers = { 0: '想' }
      mockQuizState.blankAnswerIndices = { 0: 0 }
      const { getByTestId } = render(<QuizPlayScreen />)
      fireEvent.press(getByTestId('word-bank-item-2')) // '超市' at index 2
      expect(mockSetBlankAnswer).toHaveBeenCalledWith(1, '超市', 2)
    })
  })

  // ─── Story 4.6: Dialogue Completion Integration Tests (Task 5) ────────────────

  describe('dialogue completion: renders DialogueCard (Task 5.1, 5.2, 5.3, AC #1)', () => {
    beforeEach(() => {
      mockQuizState.quizPayload = mockDialogueQuizResponse
      mockQuizState.currentQuestion = 0
      mockGetCurrentQuestion.mockReturnValue(mockDialogueQuizResponse.questions[0])
      mockIsLastQuestion.mockReturnValue(false)
    })

    it('renders the DialogueCard for dialogue_completion exercise type', () => {
      const { getByTestId } = render(<QuizPlayScreen />)
      expect(getByTestId('dialogue-card')).toBeTruthy()
    })

    it('does not render multiple choice answer grid for dialogue', () => {
      const { queryByTestId } = render(<QuizPlayScreen />)
      expect(queryByTestId('answer-option-grid')).toBeNull()
    })

    it('does not render fill-in-blank sentence for dialogue', () => {
      const { queryByTestId } = render(<QuizPlayScreen />)
      expect(queryByTestId('fill-in-blank-sentence')).toBeNull()
    })

    it('passes question data to DialogueCard (question_text visible)', () => {
      const { getByTestId } = render(<QuizPlayScreen />)
      expect(getByTestId('dialogue-question-text').props.children).toBe(
        mockDialogueQuizResponse.questions[0].question_text
      )
    })
  })

  describe('dialogue completion: answer result wiring (Task 5.4, AC #2)', () => {
    beforeEach(() => {
      mockQuizState.quizPayload = mockDialogueQuizResponse
      mockQuizState.currentQuestion = 0
      mockGetCurrentQuestion.mockReturnValue(mockDialogueQuizResponse.questions[0])
      mockIsLastQuestion.mockReturnValue(false)
    })

    it('calls setAnswer with selectedAnswer when onAnswerResult fires', async () => {
      const { getByTestId } = render(<QuizPlayScreen />)

      // The mock DialogueCard triggers onAnswerResult when an option is pressed
      fireEvent.press(getByTestId('dialogue-option-0')) // '咖啡' — correct answer

      await waitFor(() => {
        expect(mockSetAnswer).toHaveBeenCalledWith(0, '咖啡')
      })
    })

    it('calls addScore(1) when correct answer result fires', async () => {
      const { getByTestId } = render(<QuizPlayScreen />)

      fireEvent.press(getByTestId('dialogue-option-0')) // '咖啡' — correct

      await waitFor(() => {
        expect(mockAddScore).toHaveBeenCalledWith(1)
      })
    })

    it('does NOT call addScore for incorrect answer result', async () => {
      const { getByTestId } = render(<QuizPlayScreen />)

      fireEvent.press(getByTestId('dialogue-option-1')) // '你好' — incorrect

      await waitFor(() => {
        expect(mockSetAnswer).toHaveBeenCalled()
        expect(mockAddScore).not.toHaveBeenCalled()
      })
    })
  })

  // ─── Story 4.7: Sentence Construction Integration Tests (Task 6.10) ──────────

  describe('6.10 — sentence_construction: renders SentenceBuilder (Task 5.1, AC #1)', () => {
    beforeEach(() => {
      mockQuizState.quizPayload = mockSentenceConstructionQuizResponse
      mockQuizState.currentQuestion = 0
      mockGetCurrentQuestion.mockReturnValue(mockSentenceConstructionQuizResponse.questions[0])
      mockIsLastQuestion.mockReturnValue(false)
    })

    it('renders the SentenceBuilder for sentence_construction exercise type', () => {
      const { getByTestId } = render(<QuizPlayScreen />)
      expect(getByTestId('sentence-builder')).toBeTruthy()
    })

    it('does not render multiple choice answer grid for sentence_construction', () => {
      const { queryByTestId } = render(<QuizPlayScreen />)
      expect(queryByTestId('answer-option-grid')).toBeNull()
    })

    it('does not render fill-in-blank for sentence_construction', () => {
      const { queryByTestId } = render(<QuizPlayScreen />)
      expect(queryByTestId('fill-in-blank-sentence')).toBeNull()
    })

    it('does not render dialogue card for sentence_construction', () => {
      const { queryByTestId } = render(<QuizPlayScreen />)
      expect(queryByTestId('dialogue-card')).toBeNull()
    })

    it('passes question text to SentenceBuilder', () => {
      const { getByTestId } = render(<QuizPlayScreen />)
      expect(getByTestId('sentence-builder-question').props.children).toBe(
        mockSentenceConstructionQuizResponse.questions[0].question_text
      )
    })

    it('passes scrambled_words count to SentenceBuilder', () => {
      const { getByTestId } = render(<QuizPlayScreen />)
      expect(getByTestId('sentence-builder-word-count').props.children).toBe(5)
    })

    it('calls setAnswer and addScore(1) when onAnswer(true) fires', async () => {
      const { getByTestId } = render(<QuizPlayScreen />)

      fireEvent.press(getByTestId('sentence-builder-correct-trigger'))

      await waitFor(() => {
        expect(mockSetAnswer).toHaveBeenCalledWith(0, '我很喜歡咖啡。')
        expect(mockAddScore).toHaveBeenCalledWith(1)
      })
    })

    it('calls setAnswer but NOT addScore when onAnswer(false) fires', async () => {
      const { getByTestId } = render(<QuizPlayScreen />)

      fireEvent.press(getByTestId('sentence-builder-incorrect-trigger'))

      await waitFor(() => {
        expect(mockSetAnswer).toHaveBeenCalledWith(0, '')
        expect(mockAddScore).not.toHaveBeenCalled()
      })
    })

    it('calls nextQuestion after correct answer on non-last question', async () => {
      const { getByTestId } = render(<QuizPlayScreen />)

      fireEvent.press(getByTestId('sentence-builder-correct-trigger'))

      await waitFor(() => {
        expect(mockNextQuestion).toHaveBeenCalled()
      })
    })

    it('navigates to books on last sentence_construction question answered', async () => {
      mockIsLastQuestion.mockReturnValue(true)

      const { getByTestId } = render(<QuizPlayScreen />)

      fireEvent.press(getByTestId('sentence-builder-correct-trigger'))

      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)/books')
      })
    })
  })

  describe('dialogue completion: question advancement (Task 5.5, AC #2)', () => {
    beforeEach(() => {
      mockQuizState.quizPayload = mockDialogueQuizResponse
      mockQuizState.currentQuestion = 0
      mockGetCurrentQuestion.mockReturnValue(mockDialogueQuizResponse.questions[0])
      mockIsLastQuestion.mockReturnValue(false)
    })

    it('calls nextQuestion after 1s feedback delay on dialogue answer', async () => {
      const { getByTestId } = render(<QuizPlayScreen />)

      fireEvent.press(getByTestId('dialogue-option-0')) // any answer triggers advance

      expect(mockNextQuestion).not.toHaveBeenCalled()

      act(() => {
        jest.advanceTimersByTime(1100)
      })

      expect(mockNextQuestion).toHaveBeenCalled()
    })

    it('navigates to books on last dialogue question answered', async () => {
      mockIsLastQuestion.mockReturnValue(true)

      const { getByTestId } = render(<QuizPlayScreen />)

      fireEvent.press(getByTestId('dialogue-option-0'))

      act(() => {
        jest.advanceTimersByTime(1100)
      })

      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)/books')
      })
    })
  })
})
