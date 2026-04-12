/**
 * PremadeExerciseCard Component
 *
 * Displays a single exercise card with dual actions:
 * - "Premade" — loads pre-generated exercise instantly
 * - "Generate with AI" — triggers on-the-fly AI generation (~15-20s)
 *
 * Story 3.5: Exercise Type Selection Screen — Task 3
 * Story 4.17: Dual-action Premade + Generate with AI
 */

import React from 'react'
import { Card, XStack, YStack, Text, Button } from 'tamagui'
import { Check, BookOpen, Sparkles } from '@tamagui/lucide-icons'

import type { PremadeExercise } from '../../hooks/usePremadeExercises'
import type { ExerciseTypeProgress } from './ExerciseTypeCard'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PremadeExerciseCardProps {
  /** The premade exercise metadata */
  exercise: PremadeExercise
  /** Progress for this exercise type (from exercise_type_progress), or null */
  progress?: ExerciseTypeProgress | null
  /** Called when "Premade" button is pressed */
  onPress: () => void
  /** Called when "Generate with AI" button is pressed (Story 4.17) */
  onGeneratePress?: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatExerciseType(exerciseType: string): string {
  return exerciseType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PremadeExerciseCard({
  exercise,
  progress,
  onPress,
  onGeneratePress,
}: PremadeExerciseCardProps) {
  const { id, title, exercise_type, difficulty } = exercise
  const displayTitle = title ?? 'Untitled Exercise'

  return (
    <Card
      elevate
      bordered
      padding="$3"
      borderRadius="$3"
      testID={`premade-exercise-card-${id}`}
      accessibilityLabel={`${displayTitle}, ${formatExerciseType(exercise_type)} exercise`}
    >
      <YStack gap="$3">
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
            <Text
              fontSize="$4"
              fontWeight="500"
              numberOfLines={2}
              testID={`premade-exercise-title-${id}`}
            >
              {displayTitle}
            </Text>

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

        {/* Dual-action buttons (Story 4.17) */}
        <XStack gap="$2">
          <Button
            flex={1}
            size="$3"
            theme="active"
            onPress={onPress}
            testID={`premade-action-${id}`}
            accessibilityRole="button"
            accessibilityLabel="Premade exercise"
          >
            Premade
          </Button>

          {onGeneratePress ? (
            <Button
              flex={1}
              size="$3"
              chromeless
              bordered
              icon={<Sparkles size={14} />}
              onPress={onGeneratePress}
              testID={`generate-ai-action-${id}`}
              accessibilityRole="button"
              accessibilityLabel="Generate with AI, approximately 15 to 20 seconds"
            >
              Generate with AI
            </Button>
          ) : null}
        </XStack>
      </YStack>
    </Card>
  )
}
