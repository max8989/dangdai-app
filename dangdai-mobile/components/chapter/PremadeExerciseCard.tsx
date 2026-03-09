/**
 * PremadeExerciseCard Component
 *
 * Displays a single premade workbook exercise card in the Workbook Exercises section.
 * Shows: exercise title, exercise type badge, and completion status.
 *
 * Completion status is derived from exercise_type_progress data:
 * - No progress → no indicator
 * - Mastered (≥80%) → checkmark
 * - In progress → percentage
 *
 * Story 3.5: Exercise Type Selection Screen — Task 3
 */

import React from 'react'
import { Card, XStack, YStack, Text } from 'tamagui'
import { Check, BookOpen } from '@tamagui/lucide-icons'

import type { PremadeExercise } from '../../hooks/usePremadeExercises'
import type { ExerciseTypeProgress } from './ExerciseTypeCard'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PremadeExerciseCardProps {
  /** The premade exercise metadata */
  exercise: PremadeExercise
  /** Progress for this exercise type (from exercise_type_progress), or null */
  progress?: ExerciseTypeProgress | null
  /** Called when the card is pressed */
  onPress: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats an exercise_type string into a human-readable label.
 * e.g., 'fill_in_blank' → 'Fill in Blank'
 */
function formatExerciseType(exerciseType: string): string {
  return exerciseType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Premade workbook exercise card.
 * Tapping navigates to the premade exercise screen (placeholder for Epic 11).
 */
export function PremadeExerciseCard({ exercise, progress, onPress }: PremadeExerciseCardProps) {
  const { id, title, exercise_type, difficulty } = exercise
  const displayTitle = title ?? 'Untitled Exercise'

  return (
    <Card
      elevate
      bordered
      padding="$3"
      borderRadius="$3"
      pressStyle={{ scale: 0.98 }}
      animation="quick"
      onPress={onPress}
      testID={`premade-exercise-card-${id}`}
      accessibilityRole="button"
      accessibilityLabel={`${displayTitle}, ${formatExerciseType(exercise_type)} exercise`}
    >
      <XStack alignItems="center" gap="$3">
        {/* Icon */}
        <YStack
          width={40}
          height={40}
          borderRadius="$3"
          backgroundColor="$backgroundHover"
          justifyContent="center"
          alignItems="center"
        >
          <BookOpen size={20} color="$colorSubtle" />
        </YStack>

        {/* Content */}
        <YStack flex={1} gap="$1">
          {/* Title */}
          <Text
            fontSize="$4"
            fontWeight="500"
            numberOfLines={2}
            testID={`premade-exercise-title-${id}`}
          >
            {displayTitle}
          </Text>

          {/* Type badge row */}
          <XStack gap="$2" alignItems="center">
            <Text
              fontSize="$2"
              color="$colorSubtle"
              backgroundColor="$backgroundHover"
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius="$2"
              testID={`premade-exercise-type-${id}`}
            >
              {formatExerciseType(exercise_type)}
            </Text>

            {/* Difficulty badge (if available) */}
            {difficulty ? (
              <Text
                fontSize="$2"
                color="$colorSubtle"
                testID={`premade-exercise-difficulty-${id}`}
              >
                {difficulty}
              </Text>
            ) : null}
          </XStack>
        </YStack>

        {/* Completion status indicator */}
        {progress?.mastered ? (
          <Check
            size={20}
            color="$green10"
            testID={`premade-exercise-mastered-${id}`}
          />
        ) : progress && progress.bestScore > 0 ? (
          <Text
            fontSize="$3"
            color="$blue10"
            testID={`premade-exercise-progress-${id}`}
          >
            {Math.round(progress.bestScore)}%
          </Text>
        ) : null}
      </XStack>
    </Card>
  )
}
