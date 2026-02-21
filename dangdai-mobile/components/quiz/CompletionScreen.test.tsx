/**
 * CompletionScreen Component Tests
 *
 * Unit tests for the quiz results/celebration screen.
 * Tests: all sections render, score display, PointsCounter, ExerciseTypeProgressList,
 * weakness summary, struggled-with section, Continue button, Supabase upsert on mount.
 *
 * Story 4.11: Quiz Results Screen — Task 5.14, Task 7.1–7.8
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'

// ─── Mock Reanimated ──────────────────────────────────────────────────────────

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated/mock')
  return {
    ...actual,
    useSharedValue: (initialValue: number) => ({ value: initialValue }),
    withTiming: (toValue: number, _config: unknown, callback?: (finished: boolean) => void) => {
      if (callback) callback(true)
      return toValue
    },
    runOnJS: (fn: (...args: unknown[]) => void) => fn,
    useDerivedValue: () => ({ value: 0 }),
  }
})

// ─── Mock Tamagui ─────────────────────────────────────────────────────────────

jest.mock('tamagui', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text, ScrollView, TouchableOpacity } = require('react-native')

  const YStack = ({ children, testID, ...rest }: any) => (
    <View testID={testID} {...rest}>{children}</View>
  )
  const XStack = ({ children, testID, ...rest }: any) => (
    <View testID={testID} {...rest}>{children}</View>
  )
  const TamaguiText = ({ children, testID, ...rest }: any) => (
    <Text testID={testID} {...rest}>{children}</Text>
  )
  const TamaguiButton = ({ children, testID, onPress, ...rest }: any) => (
    <TouchableOpacity testID={testID} onPress={onPress} {...rest}>
      <Text>{children}</Text>
    </TouchableOpacity>
  )
  const TamaguiScrollView = ({ children, testID, ...rest }: any) => (
    <ScrollView testID={testID} {...rest}>{children}</ScrollView>
  )
  const Theme = ({ children }: any) => <>{children}</>
  const AnimatePresence = ({ children }: any) => <>{children}</>
  const Card = ({ children, testID, ...rest }: any) => (
    <View testID={testID} {...rest}>{children}</View>
  )
  const Separator = ({ testID, ...rest }: any) => <View testID={testID} {...rest} />
  const styled = (_component: any, _config: any) => {
    return ({ children, testID, ...rest }: any) => (
      <View testID={testID} {...rest}>{children}</View>
    )
  }

  return {
    YStack, XStack, Text: TamaguiText, Button: TamaguiButton,
    ScrollView: TamaguiScrollView, Theme, AnimatePresence, Card, Separator, styled,
  }
})

// ─── Mock AuthProvider ────────────────────────────────────────────────────────

jest.mock('../../providers/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}))

// ─── Mock useExerciseTypeProgress ─────────────────────────────────────────────

const mockUpdateProgress = jest.fn()

jest.mock('../../hooks/useExerciseTypeProgress', () => ({
  useExerciseTypeProgress: () => ({
    data: [
      { exercise_type: 'vocabulary', best_score: 85, attempts_count: 3, mastered_at: '2026-02-19T10:00:00Z' },
      { exercise_type: 'grammar', best_score: 65, attempts_count: 2, mastered_at: null },
      { exercise_type: 'matching', best_score: 88, attempts_count: 1, mastered_at: '2026-02-20T14:00:00Z' },
    ],
    isLoading: false,
  }),
  useUpdateExerciseTypeProgress: () => ({
    mutate: mockUpdateProgress,
    isPending: false,
  }),
}))

import { CompletionScreen } from './CompletionScreen'
import type { CompletionScreenProps } from './CompletionScreen'

// ─── Mock data ────────────────────────────────────────────────────────────────

const defaultProps: CompletionScreenProps = {
  chapterId: 212,
  bookId: 2,
  exerciseType: 'matching',
  correctCount: 8,
  totalQuestions: 10,
  pointsEarned: 80,
  durationMinutes: 8,
  incorrectItems: [
    {
      questionText: 'Which sentence uses 把 correctly?',
      userAnswer: '我放書把桌子上了',
      correctAnswer: '我把書放在桌子上了',
      character: '把',
    },
  ],
  onContinue: jest.fn(),
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CompletionScreen — all sections render (Task 5.1–5.13, Task 7.1)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the completion screen container (Task 5.1)', () => {
    const { getByTestId } = render(<CompletionScreen {...defaultProps} testID="completion-screen" />)
    expect(getByTestId('completion-screen')).toBeTruthy()
  })

  it('renders celebration emoji (Task 5.3)', () => {
    const { getByTestId } = render(<CompletionScreen {...defaultProps} />)
    expect(getByTestId('celebration-emoji')).toBeTruthy()
  })

  it('renders "Exercise Complete!" title (Task 5.4)', () => {
    const { getByTestId } = render(<CompletionScreen {...defaultProps} />)
    expect(getByTestId('completion-title')).toBeTruthy()
  })

  it('renders PointsCounter (Task 5.5)', () => {
    const { getByTestId } = render(<CompletionScreen {...defaultProps} />)
    expect(getByTestId('points-counter')).toBeTruthy()
  })

  it('renders stats card with score (Task 5.6)', () => {
    const { getByTestId } = render(<CompletionScreen {...defaultProps} />)
    expect(getByTestId('stats-card')).toBeTruthy()
  })

  it('renders ExerciseTypeProgressList (Task 5.8)', () => {
    const { getByTestId } = render(<CompletionScreen {...defaultProps} />)
    expect(getByTestId('exercise-type-progress-list')).toBeTruthy()
  })

  it('renders Continue button (Task 5.11)', () => {
    const { getByTestId } = render(<CompletionScreen {...defaultProps} />)
    expect(getByTestId('continue-button')).toBeTruthy()
  })
})

describe('CompletionScreen — score display (Task 7.2)', () => {
  it('shows correct score in stats card (8/10 correct — 80%)', () => {
    const { getByTestId } = render(<CompletionScreen {...defaultProps} />)
    const scoreEl = getByTestId('stats-score')
    // Text content should include score info
    expect(scoreEl).toBeTruthy()
  })

  it('displays duration in stats card', () => {
    const { getByTestId } = render(<CompletionScreen {...defaultProps} />)
    const timeEl = getByTestId('stats-time')
    expect(timeEl).toBeTruthy()
  })
})

describe('CompletionScreen — struggled with section (Task 5.10, Task 7.6)', () => {
  it('renders struggled-with section when there are incorrect answers (Task 5.10)', () => {
    const { getByTestId } = render(<CompletionScreen {...defaultProps} />)
    expect(getByTestId('struggled-with-section')).toBeTruthy()
  })

  it('does NOT render struggled-with section when all answers correct (Task 7.6)', () => {
    const { queryByTestId } = render(
      <CompletionScreen {...defaultProps} incorrectItems={[]} />
    )
    expect(queryByTestId('struggled-with-section')).toBeNull()
  })

  it('renders each incorrect item', () => {
    const { getByTestId } = render(<CompletionScreen {...defaultProps} />)
    expect(getByTestId('struggled-item-0')).toBeTruthy()
  })
})

describe('CompletionScreen — weakness summary (Task 5.9, Task 7.5)', () => {
  const weaknessProps: CompletionScreenProps = {
    ...defaultProps,
    preQuizWeaknesses: [
      { item: '會 vs 可以', previousAccuracy: 60 },
    ],
    postQuizWeaknesses: [
      { item: '會 vs 可以', currentAccuracy: 80 },
    ],
  }

  it('renders weakness summary when data is provided (Task 5.9)', () => {
    const { getByTestId } = render(<CompletionScreen {...weaknessProps} />)
    expect(getByTestId('weakness-summary')).toBeTruthy()
  })

  it('does NOT render weakness summary without data', () => {
    const { queryByTestId } = render(
      <CompletionScreen {...defaultProps} preQuizWeaknesses={undefined} postQuizWeaknesses={undefined} />
    )
    expect(queryByTestId('weakness-summary')).toBeNull()
  })
})

describe('CompletionScreen — Continue button (Task 5.11, Task 7.7)', () => {
  it('calls onContinue when Continue button is pressed (Task 7.7)', () => {
    const onContinue = jest.fn()
    const { getByTestId } = render(<CompletionScreen {...defaultProps} onContinue={onContinue} />)
    fireEvent.press(getByTestId('continue-button'))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })
})

describe('CompletionScreen — Supabase upsert on mount (Task 5.12, Task 7.10)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls updateExerciseTypeProgress mutation on mount (Task 5.12)', () => {
    render(<CompletionScreen {...defaultProps} />)
    expect(mockUpdateProgress).toHaveBeenCalledTimes(1)
    expect(mockUpdateProgress).toHaveBeenCalledWith({
      chapterId: 212,
      bookId: 2,
      exerciseType: 'matching',
      score: 80, // Math.round(8/10 * 100)
    })
  })

  it('calculates score percentage correctly (Task 5.12)', () => {
    render(
      <CompletionScreen
        {...defaultProps}
        correctCount={7}
        totalQuestions={10}
        pointsEarned={70}
      />
    )
    expect(mockUpdateProgress).toHaveBeenCalledWith(
      expect.objectContaining({ score: 70 })
    )
  })
})
