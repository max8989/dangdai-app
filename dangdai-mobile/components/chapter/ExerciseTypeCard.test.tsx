/**
 * ExerciseTypeCard Component Tests
 *
 * Unit tests for the ExerciseTypeCard component.
 * Tests: rendering, progress indicators, Mixed card styling, press handler.
 *
 * Story 3.5: Exercise Type Selection Screen — Task 6
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'

// Mock Tamagui components
jest.mock('tamagui', () => {
  const { View, Text, TouchableOpacity } = require('react-native')

  return {
    Card: ({ children, testID, onPress, accessibilityRole, accessibilityLabel }: any) => (
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </TouchableOpacity>
    ),
    XStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    YStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    Text: ({ children, testID }: any) => <Text testID={testID}>{children}</Text>,
    Theme: ({ children }: any) => <View testID="theme-primary-wrapper">{children}</View>,
  }
})

// Mock lucide icons
jest.mock('@tamagui/lucide-icons', () => ({
  Check: ({ testID }: any) => {
    const { View } = require('react-native')
    return <View testID={testID ?? 'check-icon'} />
  },
  BookOpen: () => {
    const { View } = require('react-native')
    return <View testID="book-open-icon" />
  },
}))

// Import after mocks
import { ExerciseTypeCard } from './ExerciseTypeCard'
import type { ExerciseTypeProgress } from './ExerciseTypeCard'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const mockIcon = (() => {
  const { View } = require('react-native')
  return <View testID="mock-icon" />
})()

const mockOnPress = jest.fn()

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ExerciseTypeCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders the card with correct testID', () => {
      const { getByTestId } = render(
        <ExerciseTypeCard
          type="vocabulary"
          label="Vocabulary"
          icon={mockIcon}
          onPress={mockOnPress}
        />
      )
      expect(getByTestId('exercise-type-card-vocabulary')).toBeTruthy()
    })

    it('renders the label', () => {
      const { getByTestId } = render(
        <ExerciseTypeCard
          type="grammar"
          label="Grammar"
          icon={mockIcon}
          onPress={mockOnPress}
        />
      )
      expect(getByTestId('exercise-type-label')).toHaveTextContent('Grammar')
    })

    it('renders subtitle when provided', () => {
      const { getByTestId } = render(
        <ExerciseTypeCard
          type="mixed"
          label="Mixed"
          icon={mockIcon}
          subtitle="AI picks exercises based on your weak areas"
          onPress={mockOnPress}
          isMixed
        />
      )
      expect(getByTestId('exercise-type-subtitle')).toHaveTextContent(
        'AI picks exercises based on your weak areas'
      )
    })

    it('does not render subtitle when not provided', () => {
      const { queryByTestId } = render(
        <ExerciseTypeCard
          type="vocabulary"
          label="Vocabulary"
          icon={mockIcon}
          onPress={mockOnPress}
        />
      )
      expect(queryByTestId('exercise-type-subtitle')).toBeNull()
    })
  })

  describe('progress indicators (AC #2)', () => {
    it('shows "New" when no progress data', () => {
      const { getByTestId } = render(
        <ExerciseTypeCard
          type="vocabulary"
          label="Vocabulary"
          icon={mockIcon}
          progress={null}
          onPress={mockOnPress}
        />
      )
      expect(getByTestId('progress-new')).toHaveTextContent('New')
    })

    it('shows "New" when progress is undefined', () => {
      const { getByTestId } = render(
        <ExerciseTypeCard
          type="vocabulary"
          label="Vocabulary"
          icon={mockIcon}
          onPress={mockOnPress}
        />
      )
      expect(getByTestId('progress-new')).toHaveTextContent('New')
    })

    it('shows percentage when progress < 80%', () => {
      const progress: ExerciseTypeProgress = {
        bestScore: 65,
        attemptCount: 2,
        mastered: false,
      }
      const { getByTestId } = render(
        <ExerciseTypeCard
          type="vocabulary"
          label="Vocabulary"
          icon={mockIcon}
          progress={progress}
          onPress={mockOnPress}
        />
      )
      expect(getByTestId('progress-percentage')).toHaveTextContent('65%')
    })

    it('shows checkmark when mastered (≥80%)', () => {
      const progress: ExerciseTypeProgress = {
        bestScore: 85,
        attemptCount: 3,
        mastered: true,
      }
      const { getByTestId, queryByTestId } = render(
        <ExerciseTypeCard
          type="vocabulary"
          label="Vocabulary"
          icon={mockIcon}
          progress={progress}
          onPress={mockOnPress}
        />
      )
      expect(getByTestId('progress-mastered')).toBeTruthy()
      expect(queryByTestId('progress-percentage')).toBeNull()
      expect(queryByTestId('progress-new')).toBeNull()
    })
  })

  describe('Mixed card styling (AC #2)', () => {
    it('wraps Mixed card in Theme primary wrapper', () => {
      const { getByTestId } = render(
        <ExerciseTypeCard
          type="mixed"
          label="Mixed"
          icon={mockIcon}
          isMixed
          onPress={mockOnPress}
        />
      )
      expect(getByTestId('theme-primary-wrapper')).toBeTruthy()
    })

    it('does not wrap non-Mixed cards in Theme', () => {
      const { queryByTestId } = render(
        <ExerciseTypeCard
          type="vocabulary"
          label="Vocabulary"
          icon={mockIcon}
          onPress={mockOnPress}
        />
      )
      expect(queryByTestId('theme-primary-wrapper')).toBeNull()
    })
  })

  describe('navigation (AC #4)', () => {
    it('calls onPress when card is tapped', () => {
      const { getByTestId } = render(
        <ExerciseTypeCard
          type="vocabulary"
          label="Vocabulary"
          icon={mockIcon}
          onPress={mockOnPress}
        />
      )
      fireEvent.press(getByTestId('exercise-type-card-vocabulary'))
      expect(mockOnPress).toHaveBeenCalledTimes(1)
    })
  })

  describe('accessibility', () => {
    it('has accessibilityRole="button"', () => {
      const { getByTestId } = render(
        <ExerciseTypeCard
          type="vocabulary"
          label="Vocabulary"
          icon={mockIcon}
          onPress={mockOnPress}
        />
      )
      const card = getByTestId('exercise-type-card-vocabulary')
      expect(card.props.accessibilityRole).toBe('button')
    })

    it('has descriptive accessibilityLabel', () => {
      const { getByTestId } = render(
        <ExerciseTypeCard
          type="vocabulary"
          label="Vocabulary"
          icon={mockIcon}
          onPress={mockOnPress}
        />
      )
      const card = getByTestId('exercise-type-card-vocabulary')
      expect(card.props.accessibilityLabel).toBe('Vocabulary exercise type')
    })
  })
})
