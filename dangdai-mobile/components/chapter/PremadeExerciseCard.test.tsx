/**
 * PremadeExerciseCard Component Tests
 *
 * Unit tests for the PremadeExerciseCard component.
 * Tests: rendering, completion status indicators, press handlers.
 *
 * Story 3.5: Exercise Type Selection Screen — Task 6
 * Story 4.17: Dual-action Premade + Generate with AI
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'

// Mock Tamagui components
jest.mock('tamagui', () => {
  const { View, Text, TouchableOpacity } = require('react-native')

  return {
    Card: ({ children, testID, accessibilityLabel }: any) => (
      <View testID={testID} accessibilityLabel={accessibilityLabel}>
        {children}
      </View>
    ),
    XStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    YStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    Text: ({ children, testID }: any) => <Text testID={testID}>{children}</Text>,
    Button: ({ children, testID, onPress, accessibilityRole, accessibilityLabel }: any) => (
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
      >
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
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
  Sparkles: () => {
    const { View } = require('react-native')
    return <View testID="sparkles-icon" />
  },
}))

// Import after mocks
import { PremadeExerciseCard } from './PremadeExerciseCard'
import type { PremadeExercise } from '../../hooks/usePremadeExercises'
import type { ExerciseTypeProgress } from './ExerciseTypeCard'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const mockExercise: PremadeExercise = {
  id: 'exercise-1',
  exercise_type: 'vocabulary',
  exercise_order: 1,
  title: 'Vocabulary Practice Set A',
  instructions: 'Match the characters with their meanings',
  difficulty: 'beginner',
}

const mockOnPress = jest.fn()
const mockOnGeneratePress = jest.fn()

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PremadeExerciseCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('action buttons (Story 4.17)', () => {
    it('renders the Premade button', () => {
      const { getByTestId } = render(
        <PremadeExerciseCard
          exercise={mockExercise}
          onPress={mockOnPress}
        />
      )
      expect(getByTestId('premade-action-exercise-1')).toBeTruthy()
    })

    it('renders the Generate with AI button', () => {
      const { getByTestId } = render(
        <PremadeExerciseCard
          exercise={mockExercise}
          onPress={mockOnPress}
        />
      )
      expect(getByTestId('generate-ai-action-exercise-1')).toBeTruthy()
    })

    it('calls onPress when Premade button is pressed', () => {
      const { getByTestId } = render(
        <PremadeExerciseCard
          exercise={mockExercise}
          onPress={mockOnPress}
        />
      )
      fireEvent.press(getByTestId('premade-action-exercise-1'))
      expect(mockOnPress).toHaveBeenCalledTimes(1)
    })

    it('calls onGeneratePress when Generate with AI button is pressed', () => {
      const { getByTestId } = render(
        <PremadeExerciseCard
          exercise={mockExercise}
          onPress={mockOnPress}
          onGeneratePress={mockOnGeneratePress}
        />
      )
      fireEvent.press(getByTestId('generate-ai-action-exercise-1'))
      expect(mockOnGeneratePress).toHaveBeenCalledTimes(1)
    })

    it('does not call onPress when Generate with AI button is pressed', () => {
      const { getByTestId } = render(
        <PremadeExerciseCard
          exercise={mockExercise}
          onPress={mockOnPress}
          onGeneratePress={mockOnGeneratePress}
        />
      )
      fireEvent.press(getByTestId('generate-ai-action-exercise-1'))
      expect(mockOnPress).not.toHaveBeenCalled()
    })
  })

  describe('rendering', () => {
    it('renders the card with correct testID', () => {
      const { getByTestId } = render(
        <PremadeExerciseCard
          exercise={mockExercise}
          onPress={mockOnPress}
        />
      )
      expect(getByTestId('premade-exercise-card-exercise-1')).toBeTruthy()
    })

    it('displays the exercise title', () => {
      const { getByTestId } = render(
        <PremadeExerciseCard
          exercise={mockExercise}
          onPress={mockOnPress}
        />
      )
      expect(getByTestId('premade-exercise-title-exercise-1')).toHaveTextContent(
        'Vocabulary Practice Set A'
      )
    })

    it('displays the formatted exercise type', () => {
      const { getByTestId } = render(
        <PremadeExerciseCard
          exercise={mockExercise}
          onPress={mockOnPress}
        />
      )
      expect(getByTestId('premade-exercise-type-exercise-1')).toHaveTextContent('Vocabulary')
    })

    it('formats snake_case exercise types correctly', () => {
      const fillInBlankExercise: PremadeExercise = {
        ...mockExercise,
        id: 'exercise-2',
        exercise_type: 'fill_in_blank',
      }
      const { getByTestId } = render(
        <PremadeExerciseCard
          exercise={fillInBlankExercise}
          onPress={mockOnPress}
        />
      )
      expect(getByTestId('premade-exercise-type-exercise-2')).toHaveTextContent('Fill In Blank')
    })

    it('displays difficulty when provided', () => {
      const { getByTestId } = render(
        <PremadeExerciseCard
          exercise={mockExercise}
          onPress={mockOnPress}
        />
      )
      expect(getByTestId('premade-exercise-difficulty-exercise-1')).toHaveTextContent('beginner')
    })

    it('does not display difficulty when null', () => {
      const exerciseNoDifficulty: PremadeExercise = {
        ...mockExercise,
        difficulty: null,
      }
      const { queryByTestId } = render(
        <PremadeExerciseCard
          exercise={exerciseNoDifficulty}
          onPress={mockOnPress}
        />
      )
      expect(queryByTestId('premade-exercise-difficulty-exercise-1')).toBeNull()
    })
  })

  describe('completion status (AC #6)', () => {
    it('shows no indicator when no progress', () => {
      const { queryByTestId } = render(
        <PremadeExerciseCard
          exercise={mockExercise}
          progress={null}
          onPress={mockOnPress}
        />
      )
      expect(queryByTestId('premade-exercise-mastered-exercise-1')).toBeNull()
      expect(queryByTestId('premade-exercise-progress-exercise-1')).toBeNull()
    })

    it('shows checkmark when mastered', () => {
      const progress: ExerciseTypeProgress = {
        bestScore: 90,
        attemptCount: 2,
        mastered: true,
      }
      const { getByTestId } = render(
        <PremadeExerciseCard
          exercise={mockExercise}
          progress={progress}
          onPress={mockOnPress}
        />
      )
      expect(getByTestId('premade-exercise-mastered-exercise-1')).toBeTruthy()
    })

    it('shows percentage when in progress (not mastered)', () => {
      const progress: ExerciseTypeProgress = {
        bestScore: 60,
        attemptCount: 1,
        mastered: false,
      }
      const { getByTestId } = render(
        <PremadeExerciseCard
          exercise={mockExercise}
          progress={progress}
          onPress={mockOnPress}
        />
      )
      expect(getByTestId('premade-exercise-progress-exercise-1')).toHaveTextContent('60%')
    })
  })

})
