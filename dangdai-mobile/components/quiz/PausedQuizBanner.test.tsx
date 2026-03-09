/**
 * PausedQuizBanner Component Tests
 *
 * Unit tests for the paused quiz banner shown on the Exercise Type Selection screen.
 *
 * Story 4.10b: Quiz Pause/Resume — Task 9.9
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'

import { PausedQuizBanner } from './PausedQuizBanner'

// ─── Mock hooks ────────────────────────────────────────────────────────────────
// jest.mock is hoisted before variable declarations, so we cannot reference
// module-level variables inside the factory. Instead we mock with jest.fn()
// and configure return values in beforeEach.

jest.mock('../../hooks/usePausedQuiz', () => ({
  usePausedQuiz: jest.fn(),
}))

jest.mock('../../hooks/usePauseQuiz', () => ({
  usePauseQuiz: jest.fn(),
}))

// Import the mocked modules AFTER jest.mock declarations
import { usePausedQuiz } from '../../hooks/usePausedQuiz'
import { usePauseQuiz } from '../../hooks/usePauseQuiz'

const mockUsePausedQuiz = usePausedQuiz as jest.Mock
const mockUsePauseQuiz = usePauseQuiz as jest.Mock

// ─── Mock Tamagui ──────────────────────────────────────────────────────────────

jest.mock('tamagui', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text, TouchableOpacity } = require('react-native')

  const YStack = ({ children, testID, ...rest }: any) => (
    <View testID={testID} {...rest}>{children}</View>
  )
  const XStack = ({ children, testID, ...rest }: any) => (
    <View testID={testID} {...rest}>{children}</View>
  )
  const TamaguiText = ({ children, testID, ...rest }: any) => (
    <Text testID={testID} {...rest}>{children}</Text>
  )
  const Button = ({ children, testID, onPress, disabled }: any) => (
    <TouchableOpacity testID={testID} onPress={onPress} disabled={disabled}>
      <Text>{children}</Text>
    </TouchableOpacity>
  )
  const Card = ({ children, testID, ...rest }: any) => (
    <View testID={testID} {...rest}>{children}</View>
  )

  return { YStack, XStack, Text: TamaguiText, Button, Card }
})

jest.mock('@tamagui/lucide-icons', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native')

  const Pause = ({ testID, ...rest }: any) => <View testID={testID ?? 'pause-icon'} {...rest} />
  const Play = ({ testID, ...rest }: any) => <View testID={testID ?? 'play-icon'} {...rest} />
  const Trash2 = ({ testID, ...rest }: any) => <View testID={testID ?? 'trash-icon'} {...rest} />

  return { Pause, Play, Trash2 }
})

// ─── Test data ────────────────────────────────────────────────────────────────

const mockPausedQuiz = {
  id: 'pq-uuid-1',
  user_id: 'test-user-id',
  chapter_id: 101,
  exercise_type: 'vocabulary',
  quiz_state: {
    questions: [
      {
        question_id: 'q1',
        exercise_type: 'vocabulary',
        question_text: 'What does this mean?',
        correct_answer: 'hello',
        explanation: 'It means hello.',
        source_citation: 'Book 1, Ch 1',
        character: '你好',
        options: ['hello', 'goodbye', 'thank you', 'sorry'],
      },
    ],
    currentQuestionIndex: 0,
    answers: { 0: 'hello' },
    startedAt: '2026-03-09T10:00:00.000Z',
    timeElapsed: 0,
    exerciseType: 'vocabulary',
    chapterId: 101,
    bookId: 1,
  },
  paused_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: '2026-03-09T10:05:00.000Z',
  updated_at: '2026-03-09T10:05:00.000Z',
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PausedQuizBanner — Story 4.10b (Task 9)', () => {
  const defaultProps = {
    chapterId: 101,
    exerciseType: 'vocabulary',
    onResume: jest.fn(),
    onDiscard: jest.fn(),
  }

  // Per-test mock for deletePausedQuiz — created fresh in beforeEach so
  // jest.clearAllMocks() doesn't wipe the implementation.
  let mockDeletePausedQuiz: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockDeletePausedQuiz = jest.fn().mockResolvedValue(undefined)
    mockUsePauseQuiz.mockReturnValue({
      deletePausedQuiz: mockDeletePausedQuiz,
      deletePausedQuizMutation: { isPending: false },
    })
  })

  describe('rendering (Task 9.4, 9.5)', () => {
    it('renders null when no paused quiz exists', () => {
      mockUsePausedQuiz.mockReturnValue({ data: null, isLoading: false })
      const { queryByTestId } = render(<PausedQuizBanner {...defaultProps} />)
      expect(queryByTestId('paused-quiz-banner')).toBeNull()
    })

    it('renders null while loading', () => {
      mockUsePausedQuiz.mockReturnValue({ data: undefined, isLoading: true })
      const { queryByTestId } = render(<PausedQuizBanner {...defaultProps} />)
      expect(queryByTestId('paused-quiz-banner')).toBeNull()
    })

    it('renders banner when paused quiz exists', () => {
      mockUsePausedQuiz.mockReturnValue({ data: mockPausedQuiz, isLoading: false })
      const { getByTestId } = render(<PausedQuizBanner {...defaultProps} />)
      expect(getByTestId('paused-quiz-banner')).toBeTruthy()
    })

    it('shows exercise type label in banner title', () => {
      mockUsePausedQuiz.mockReturnValue({ data: mockPausedQuiz, isLoading: false })
      const { getByTestId } = render(<PausedQuizBanner {...defaultProps} />)
      const title = getByTestId('paused-quiz-banner-title')
      expect(title.props.children).toContain('Vocabulary')
    })

    it('shows progress in banner', () => {
      mockUsePausedQuiz.mockReturnValue({ data: mockPausedQuiz, isLoading: false })
      const { getByTestId } = render(<PausedQuizBanner {...defaultProps} />)
      const progress = getByTestId('paused-quiz-banner-progress')
      // 1 answer out of 1 question
      expect(progress.props.children.join('')).toContain('1/1')
    })

    it('renders Resume button', () => {
      mockUsePausedQuiz.mockReturnValue({ data: mockPausedQuiz, isLoading: false })
      const { getByTestId } = render(<PausedQuizBanner {...defaultProps} />)
      expect(getByTestId('paused-quiz-resume-button')).toBeTruthy()
    })

    it('renders Discard button', () => {
      mockUsePausedQuiz.mockReturnValue({ data: mockPausedQuiz, isLoading: false })
      const { getByTestId } = render(<PausedQuizBanner {...defaultProps} />)
      expect(getByTestId('paused-quiz-discard-button')).toBeTruthy()
    })
  })

  describe('callbacks (Task 9.7, 9.8)', () => {
    it('calls onResume when Resume button is pressed', () => {
      const onResume = jest.fn()
      mockUsePausedQuiz.mockReturnValue({ data: mockPausedQuiz, isLoading: false })
      const { getByTestId } = render(
        <PausedQuizBanner {...defaultProps} onResume={onResume} />
      )
      fireEvent.press(getByTestId('paused-quiz-resume-button'))
      expect(onResume).toHaveBeenCalledTimes(1)
    })

    it('calls deletePausedQuiz and onDiscard when Discard button is pressed', async () => {
      const onDiscard = jest.fn()
      mockUsePausedQuiz.mockReturnValue({ data: mockPausedQuiz, isLoading: false })
      const { getByTestId } = render(
        <PausedQuizBanner {...defaultProps} onDiscard={onDiscard} />
      )
      fireEvent.press(getByTestId('paused-quiz-discard-button'))

      await waitFor(() => {
        expect(mockDeletePausedQuiz).toHaveBeenCalledWith({
          chapterId: 101,
          exerciseType: 'vocabulary',
        })
        expect(onDiscard).toHaveBeenCalledTimes(1)
      })
    })
  })
})
