/**
 * Quiz Loading Screen Tests
 *
 * Comprehensive tests for the quiz loading screen covering:
 * - Loading state with tips, progress bar, cancel button
 * - Error state with retry and back buttons
 * - Insufficient content state
 * - Tip rotation
 * - Navigation on cancel
 *
 * Story 4.2: Quiz Loading Screen with Progressive Loading
 */

import React from 'react'
import { render, fireEvent, act } from '@testing-library/react-native'

// Mock expo-router
const mockUseLocalSearchParams = jest.fn()
const mockRouterBack = jest.fn()
const mockRouterReplace = jest.fn()
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => ({
    back: mockRouterBack,
    replace: mockRouterReplace,
  }),
  Stack: {
    Screen: () => null,
  },
}))

// Mock useQuizGeneration hook
const mockMutate = jest.fn()
const mockReset = jest.fn()
let mockHookReturn: Record<string, unknown> = {}
jest.mock('../../hooks/useQuizGeneration', () => ({
  useQuizGeneration: () => mockHookReturn,
}))

// Mock useQuizStore
const mockStartQuiz = jest.fn()
jest.mock('../../stores/useQuizStore', () => ({
  useQuizStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ startQuiz: mockStartQuiz }),
}))

// Mock tips
jest.mock('../../constants/tips', () => ({
  LOADING_TIPS: [
    'Tip 1: Learn characters daily.',
    'Tip 2: Practice tones.',
    'Tip 3: Watch Chinese shows.',
  ],
  TIP_ROTATION_INTERVAL_MS: 2000,
  getNextTipIndex: jest.fn().mockReturnValue(1),
}))

// Mock quiz types
jest.mock('../../types/quiz', () => ({
  EXERCISE_TYPE_LABELS: {
    vocabulary: 'Vocabulary',
    grammar: 'Grammar',
    fill_in_blank: 'Fill-in-the-Blank',
    matching: 'Matching',
  },
  QuizGenerationError: class QuizGenerationError extends Error {
    type: string
    constructor(type: string, message: string) {
      super(message)
      this.name = 'QuizGenerationError'
      this.type = type
    }
  },
}))

// Mock Tamagui components
jest.mock('tamagui', () => {
  const { View, Text: RNText, TouchableOpacity, ActivityIndicator } = require('react-native')

  return {
    YStack: ({ children, testID, ...props }: any) => (
      <View testID={testID}>{children}</View>
    ),
    XStack: ({ children, testID }: any) => (
      <View testID={testID}>{children}</View>
    ),
    Text: ({ children, testID }: any) => (
      <RNText testID={testID}>{children}</RNText>
    ),
    Button: ({ children, testID, onPress }: any) => (
      <TouchableOpacity testID={testID} onPress={onPress}>
        <RNText>{children}</RNText>
      </TouchableOpacity>
    ),
    Spinner: ({ testID }: any) => <ActivityIndicator testID={testID} />,
    AnimatePresence: ({ children }: any) => <View>{children}</View>,
  }
})

// Mock lucide icons
jest.mock('@tamagui/lucide-icons', () => ({
  AlertTriangle: () => null,
}))

// Import after mocks
import QuizLoadingScreen from './loading'
import { QuizGenerationError } from '../../types/quiz'

describe('QuizLoadingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    mockUseLocalSearchParams.mockReturnValue({
      chapterId: '212',
      bookId: '2',
      quizType: 'vocabulary',
    })

    // Default: pending state
    mockHookReturn = {
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
      data: undefined,
      isSuccess: false,
      reset: mockReset,
    }
  })

  afterEach(() => {
    // Flush any pending timers inside act() to prevent leak warnings and act() errors
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  describe('loading state', () => {
    it('renders the loading screen container', () => {
      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('quiz-loading-screen')).toBeTruthy()
    })

    it('renders loading state when pending', () => {
      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('loading-state')).toBeTruthy()
    })

    it('shows loading spinner', () => {
      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('loading-spinner')).toBeTruthy()
    })

    it('displays exercise type and chapter in loading text', () => {
      const { getByTestId } = render(<QuizLoadingScreen />)
      const loadingText = getByTestId('loading-text')
      expect(loadingText).toHaveTextContent('Generating your Vocabulary exercise for Chapter 12...')
    })

    it('displays grammar exercise type correctly', () => {
      mockUseLocalSearchParams.mockReturnValue({
        chapterId: '315',
        bookId: '3',
        quizType: 'grammar',
      })

      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('loading-text')).toHaveTextContent(
        'Generating your Grammar exercise for Chapter 15...',
      )
    })

    it('renders progress bar', () => {
      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('progress-bar-container')).toBeTruthy()
      expect(getByTestId('progress-bar')).toBeTruthy()
    })

    it('renders tips container', () => {
      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('tips-container')).toBeTruthy()
    })

    it('displays a tip', () => {
      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('tip-text')).toHaveTextContent('Tip 1: Learn characters daily.')
    })

    it('renders cancel button', () => {
      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('cancel-button')).toBeTruthy()
    })

    it('triggers quiz generation on mount', () => {
      render(<QuizLoadingScreen />)
      expect(mockMutate).toHaveBeenCalledWith({
        chapterId: 212,
        bookId: 2,
        exerciseType: 'vocabulary',
      })
    })
  })

  describe('tip rotation', () => {
    it('rotates tips after interval', () => {
      const { getByTestId } = render(<QuizLoadingScreen />)

      // Initially shows tip at index 0
      expect(getByTestId('tip-text')).toHaveTextContent('Tip 1: Learn characters daily.')

      // Advance timer past the rotation interval
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      // getNextTipIndex is mocked to return 1
      expect(getByTestId('tip-text')).toHaveTextContent('Tip 2: Practice tones.')
    })
  })

  describe('cancel navigation', () => {
    it('navigates back on cancel button press', () => {
      const { getByTestId } = render(<QuizLoadingScreen />)

      fireEvent.press(getByTestId('cancel-button'))
      expect(mockRouterBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('error state', () => {
    beforeEach(() => {
      mockHookReturn = {
        mutate: mockMutate,
        isPending: false,
        isError: true,
        error: new QuizGenerationError(
          'server',
          "Couldn't generate Vocabulary exercise. Try another type or retry.",
        ),
        data: undefined,
        isSuccess: false,
        reset: mockReset,
      }
    })

    it('renders error state', () => {
      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('error-state')).toBeTruthy()
    })

    it('displays error message', () => {
      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('error-text')).toHaveTextContent(
        "Couldn't generate Vocabulary exercise. Try another type or retry.",
      )
    })

    it('renders Retry button', () => {
      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('retry-button')).toBeTruthy()
    })

    it('renders Back button', () => {
      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('back-button')).toBeTruthy()
    })

    it('re-triggers mutation on Retry press', () => {
      const { getByTestId } = render(<QuizLoadingScreen />)

      fireEvent.press(getByTestId('retry-button'))

      expect(mockReset).toHaveBeenCalledTimes(1)
      expect(mockMutate).toHaveBeenCalledWith({
        chapterId: 212,
        bookId: 2,
        exerciseType: 'vocabulary',
      })
    })

    it('navigates back on Back button press', () => {
      const { getByTestId } = render(<QuizLoadingScreen />)

      fireEvent.press(getByTestId('back-button'))
      expect(mockRouterBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('insufficient content state', () => {
    beforeEach(() => {
      mockHookReturn = {
        mutate: mockMutate,
        isPending: false,
        isError: true,
        error: new QuizGenerationError(
          'not_found',
          'Not enough content for Matching in this chapter. Try Vocabulary or Grammar instead.',
        ),
        data: undefined,
        isSuccess: false,
        reset: mockReset,
      }
    })

    it('renders insufficient content state', () => {
      mockUseLocalSearchParams.mockReturnValue({
        chapterId: '212',
        bookId: '2',
        quizType: 'matching',
      })

      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('insufficient-content-state')).toBeTruthy()
    })

    it('displays insufficient content message', () => {
      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('insufficient-text')).toHaveTextContent(
        'Not enough content for Matching in this chapter. Try Vocabulary or Grammar instead.',
      )
    })

    it('renders Back button for insufficient content', () => {
      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('insufficient-back-button')).toBeTruthy()
    })

    it('does not render Retry button for insufficient content', () => {
      const { queryByTestId } = render(<QuizLoadingScreen />)
      expect(queryByTestId('retry-button')).toBeNull()
    })
  })

  describe('timeout error', () => {
    it('shows timeout error with retry', () => {
      mockHookReturn = {
        mutate: mockMutate,
        isPending: false,
        isError: true,
        error: new QuizGenerationError(
          'timeout',
          'Generation is taking too long. Please try again.',
        ),
        data: undefined,
        isSuccess: false,
        reset: mockReset,
      }

      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('error-state')).toBeTruthy()
      expect(getByTestId('error-text')).toHaveTextContent(
        'Generation is taking too long. Please try again.',
      )
      expect(getByTestId('retry-button')).toBeTruthy()
    })
  })

  describe('network error', () => {
    it('shows network error with retry', () => {
      mockHookReturn = {
        mutate: mockMutate,
        isPending: false,
        isError: true,
        error: new QuizGenerationError(
          'network',
          'Check your connection and try again.',
        ),
        data: undefined,
        isSuccess: false,
        reset: mockReset,
      }

      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('error-state')).toBeTruthy()
      expect(getByTestId('error-text')).toHaveTextContent(
        'Check your connection and try again.',
      )
    })
  })

  describe('success state', () => {
    const mockQuizData = {
      quiz_id: 'test-quiz-123',
      chapter_id: 212,
      book_id: 2,
      exercise_type: 'vocabulary' as const,
      question_count: 10,
      questions: [],
    }

    it('calls startQuiz with quiz_id when data arrives', () => {
      mockHookReturn = {
        mutate: mockMutate,
        isPending: false,
        isError: false,
        error: null,
        data: mockQuizData,
        isSuccess: true,
        reset: mockReset,
      }

      render(<QuizLoadingScreen />)
      expect(mockStartQuiz).toHaveBeenCalledWith('test-quiz-123')
    })

    it('navigates to quiz session screen after delay', () => {
      mockHookReturn = {
        mutate: mockMutate,
        isPending: false,
        isError: false,
        error: null,
        data: mockQuizData,
        isSuccess: true,
        reset: mockReset,
      }

      render(<QuizLoadingScreen />)

      // Advance past the 300ms navigation delay
      act(() => {
        jest.advanceTimersByTime(300)
      })

      expect(mockRouterReplace).toHaveBeenCalledWith({
        pathname: '/quiz/test-quiz-123',
        params: {
          chapterId: '212',
          bookId: '2',
          quizType: 'vocabulary',
          quizId: 'test-quiz-123',
        },
      })
    })

    it('does not navigate before the delay completes', () => {
      mockHookReturn = {
        mutate: mockMutate,
        isPending: false,
        isError: false,
        error: null,
        data: mockQuizData,
        isSuccess: true,
        reset: mockReset,
      }

      render(<QuizLoadingScreen />)

      // Advance only 100ms — should not have navigated yet
      act(() => {
        jest.advanceTimersByTime(100)
      })

      expect(mockRouterReplace).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('handles undefined params gracefully', () => {
      mockUseLocalSearchParams.mockReturnValue({})
      mockHookReturn = {
        mutate: mockMutate,
        isPending: true,
        isError: false,
        error: null,
        data: undefined,
        isSuccess: false,
        reset: mockReset,
      }

      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('quiz-loading-screen')).toBeTruthy()
    })

    it('prefers exerciseType param over quizType', () => {
      mockUseLocalSearchParams.mockReturnValue({
        chapterId: '212',
        bookId: '2',
        quizType: 'vocabulary',
        exerciseType: 'grammar',
      })

      render(<QuizLoadingScreen />)

      expect(mockMutate).toHaveBeenCalledWith({
        chapterId: 212,
        bookId: 2,
        exerciseType: 'grammar',
      })
    })
  })
})
