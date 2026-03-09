/**
 * ExerciseTypeCard Component
 *
 * Displays a single AI exercise type card in the 2-column grid.
 * Shows: exercise type icon, label, and progress indicator.
 *
 * Progress indicator logic:
 * - "New"     — no exercise_type_progress record exists
 * - "XX%"     — best_score exists but < 80%
 * - Checkmark — best_score >= 80% (mastered)
 *
 * The "Mixed" card uses <Theme name="primary"> for distinct styling.
 *
 * Story 3.5: Exercise Type Selection Screen — Task 2
 */

import React from 'react'
import { Card, Text, YStack, XStack, Theme } from 'tamagui'
import { Check } from '@tamagui/lucide-icons'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExerciseTypeProgress {
  bestScore: number
  attemptCount: number
  mastered: boolean
}

export interface ExerciseTypeCardProps {
  /** Exercise type identifier (e.g., 'vocabulary', 'mixed') */
  type: string
  /** Display label (e.g., 'Vocabulary', 'Mixed') */
  label: string
  /** Icon element from @tamagui/lucide-icons */
  icon: React.ReactNode
  /** Optional subtitle shown below the label (used for Mixed card) */
  subtitle?: string
  /** Progress data for this exercise type, or null/undefined if not started */
  progress?: ExerciseTypeProgress | null
  /** Called when the card is pressed */
  onPress: () => void
  /** Whether this is the Mixed card (applies primary theme) */
  isMixed?: boolean
}

// ─── Progress Indicator ───────────────────────────────────────────────────────

/**
 * Renders the progress indicator for an exercise type card.
 * - No progress → "New" label
 * - < 80% → percentage text
 * - ≥ 80% → checkmark icon
 */
function ProgressIndicator({ progress }: { progress?: ExerciseTypeProgress | null }) {
  if (!progress) {
    return (
      <Text
        fontSize="$2"
        color="$colorSubtle"
        testID="progress-new"
      >
        New
      </Text>
    )
  }

  if (progress.mastered) {
    return (
      <Check
        size={16}
        color="$green10"
        testID="progress-mastered"
      />
    )
  }

  return (
    <Text
      fontSize="$2"
      color="$blue10"
      testID="progress-percentage"
    >
      {Math.round(progress.bestScore)}%
    </Text>
  )
}

// ─── Card Inner Content ───────────────────────────────────────────────────────

function CardContent({
  icon,
  label,
  subtitle,
  progress,
}: Pick<ExerciseTypeCardProps, 'icon' | 'label' | 'subtitle' | 'progress'>) {
  return (
    <YStack gap="$2" flex={1}>
      {/* Icon row with progress indicator */}
      <XStack justifyContent="space-between" alignItems="flex-start">
        <YStack
          width={36}
          height={36}
          borderRadius="$3"
          backgroundColor="$backgroundHover"
          justifyContent="center"
          alignItems="center"
          testID="exercise-type-icon-container"
        >
          {icon}
        </YStack>
        <ProgressIndicator progress={progress} />
      </XStack>

      {/* Label */}
      <Text
        fontSize="$4"
        fontWeight="600"
        numberOfLines={1}
        testID="exercise-type-label"
      >
        {label}
      </Text>

      {/* Optional subtitle (Mixed card) */}
      {subtitle ? (
        <Text
          fontSize="$2"
          color="$colorSubtle"
          numberOfLines={2}
          testID="exercise-type-subtitle"
        >
          {subtitle}
        </Text>
      ) : null}
    </YStack>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Exercise type card for the AI-Generated Exercises grid.
 * Mixed card is wrapped in <Theme name="primary"> for distinct styling.
 */
export function ExerciseTypeCard({
  type,
  label,
  icon,
  subtitle,
  progress,
  onPress,
  isMixed = false,
}: ExerciseTypeCardProps) {
  const card = (
    <Card
      elevate
      bordered
      padding="$3"
      borderRadius="$4"
      pressStyle={{ scale: 0.98 }}
      animation="quick"
      onPress={onPress}
      minHeight={80}
      flex={1}
      testID={`exercise-type-card-${type}`}
      accessibilityRole="button"
      accessibilityLabel={`${label} exercise type`}
    >
      <CardContent
        icon={icon}
        label={label}
        subtitle={subtitle}
        progress={progress}
      />
    </Card>
  )

  if (isMixed) {
    return <Theme name="primary">{card}</Theme>
  }

  return card
}
