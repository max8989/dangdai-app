/**
 * ExerciseTypeProgressList Component
 *
 * Displays per-exercise-type progress bars for a chapter on the CompletionScreen.
 * Always shows all 7 exercise types in canonical order.
 * Status logic:
 *   - mastered: best_score >= 80
 *   - in-progress: attempts_count > 0 && best_score < 80
 *   - new: attempts_count === 0
 *
 * The just-completed type is highlighted with a primary Theme wrapper
 * and a left border accent.
 *
 * Animation: progress bars use animation="slow" with enterStyle={{ scaleX: 0 }}
 * for the satisfying fill-from-left animation.
 *
 * Story 4.11: Quiz Results Screen — Task 3
 */

import { YStack, XStack, Text, Theme, styled } from 'tamagui'

import type { ExerciseType } from '../../types/quiz'
import { EXERCISE_TYPE_LABELS } from '../../types/quiz'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExerciseTypeProgressRow {
  exercise_type: string
  best_score: number
  attempts_count: number
  mastered_at: string | null
}

export interface ExerciseTypeProgressListProps {
  /** Exercise type progress data from exercise_type_progress table */
  progress: ExerciseTypeProgressRow[] | null | undefined
  /** The just-completed exercise type (highlighted with primary theme) */
  highlightType: ExerciseType
  /** testID for testing */
  testID?: string
}

// ─── Canonical exercise type order (Task 3.1) ────────────────────────────────

/** All 7 exercise types shown in canonical display order */
const EXERCISE_TYPE_ORDER: ExerciseType[] = [
  'vocabulary',
  'grammar',
  'fill_in_blank',
  'matching',
  'dialogue_completion',
  'sentence_construction',
  'reading_comprehension',
]

// ─── Styled components ────────────────────────────────────────────────────────

const ProgressBarTrack = styled(YStack, {
  height: 8,
  borderRadius: '$1',
  backgroundColor: '$borderColor',
  overflow: 'hidden',
  flex: 1,
})

const ProgressBarFill = styled(YStack, {
  animation: 'slow',
  height: 8,
  borderRadius: '$1',

  variants: {
    status: {
      mastered: { backgroundColor: '$success' },
      'in-progress': { backgroundColor: '$primary' },
      new: { backgroundColor: '$colorSubtle' },
    },
  } as const,

  defaultVariants: {
    status: 'new',
  },
})

// ─── Status helpers ───────────────────────────────────────────────────────────

type ExerciseStatus = 'mastered' | 'in-progress' | 'new'

function getStatus(row: ExerciseTypeProgressRow | undefined): ExerciseStatus {
  if (!row) return 'new'
  if (row.best_score >= 80) return 'mastered'
  if (row.attempts_count > 0) return 'in-progress'
  return 'new'
}

// ─── Single exercise type row ────────────────────────────────────────────────

interface ExerciseTypeRowProps {
  exerciseType: ExerciseType
  row: ExerciseTypeProgressRow | undefined
  isHighlighted: boolean
}

function ExerciseTypeRow({ exerciseType, row, isHighlighted }: ExerciseTypeRowProps) {
  const status = getStatus(row)
  const label = EXERCISE_TYPE_LABELS[exerciseType]
  const percent = row ? row.best_score : 0
  const widthPercent = `${Math.min(percent, 100)}%` as const

  const rowContent = (
    <XStack
      alignItems="center"
      gap="$2"
      paddingVertical="$2"
      paddingHorizontal="$3"
      borderLeftWidth={isHighlighted ? 3 : 0}
      borderLeftColor={isHighlighted ? '$primary' : undefined}
      testID={`exercise-type-row-${exerciseType}`}
    >
      {/* Label */}
      <Text
        fontSize="$3"
        fontWeight={isHighlighted ? '600' : '400'}
        color="$color"
        width={140}
        numberOfLines={1}
        testID={`exercise-type-label-${exerciseType}`}
      >
        {label}
      </Text>

      {/* Progress bar track */}
      <ProgressBarTrack>
        <ProgressBarFill
          status={status}
          width={status === 'new' ? 0 : widthPercent}
          enterStyle={{ scaleX: 0 }}
          // @ts-expect-error — transformOrigin is supported at runtime via Tamagui/RN
          style={{ transformOrigin: 'left' }}
          testID={`exercise-type-bar-${exerciseType}`}
        />
      </ProgressBarTrack>

      {/* Status indicator */}
      {status === 'mastered' ? (
        <Text
          fontSize="$3"
          color="$success"
          testID={`exercise-type-status-${exerciseType}`}
        >
          ✓
        </Text>
      ) : status === 'in-progress' ? (
        <Text
          fontSize="$3"
          color="$colorSubtle"
          testID={`exercise-type-status-${exerciseType}`}
        >
          {percent}%
        </Text>
      ) : (
        <Text
          fontSize="$3"
          color="$colorSubtle"
          testID={`exercise-type-status-${exerciseType}`}
        >
          New
        </Text>
      )}
    </XStack>
  )

  // Wrap highlighted row in primary theme for accent coloring (Task 3.3)
  if (isHighlighted) {
    return (
      <Theme name="primary">
        {rowContent}
      </Theme>
    )
  }

  return rowContent
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ExerciseTypeProgressList — shows all 7 exercise types with progress bars.
 * The just-completed type is highlighted with a primary theme and left border.
 */
export function ExerciseTypeProgressList({
  progress,
  highlightType,
  testID,
}: ExerciseTypeProgressListProps) {
  // Build a lookup map from exercise_type string → row data
  const progressMap = new Map<string, ExerciseTypeProgressRow>()
  if (progress) {
    progress.forEach((row) => {
      progressMap.set(row.exercise_type, row)
    })
  }

  return (
    <YStack gap="$1" testID={testID ?? 'exercise-type-progress-list'}>
      {EXERCISE_TYPE_ORDER.map((exerciseType) => (
        <ExerciseTypeRow
          key={exerciseType}
          exerciseType={exerciseType}
          row={progressMap.get(exerciseType)}
          isHighlighted={exerciseType === highlightType}
        />
      ))}
    </YStack>
  )
}
