/**
 * MatchingExercise Component
 *
 * Two-column tap-to-pair matching exercise.
 * Users tap a left item to select it, then tap a right item to attempt a pair.
 * Correct pairs: highlighted with success theme + connection line animation.
 * Incorrect pairs: shake + error flash, selection resets after ~500ms.
 *
 * Layout:
 * ┌──────────────────────────────────┐
 * │  ┌────────┐    ┌────────┐        │
 * │  │   她   │    │  tā    │  ← matched (green, dimmed, non-interactive)
 * │  └────────┘    └────────┘        │
 * │       ─────────────              │  ← ConnectionLine
 * │  ┌────────┐    ┌────────┐        │
 * │  │  喜歡  │    │ kāfēi  │  ← left selected (primary border)
 * │  └────────┘    └────────┘        │
 * └──────────────────────────────────┘
 *
 * Story 4.5: Matching Exercise (Tap-to-Pair)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { YStack, XStack, Text, styled, Button, AnimatePresence } from 'tamagui'

import type { QuizQuestion, MatchingPair } from '../../types/quiz'
import { useQuizStore } from '../../stores/useQuizStore'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MatchingExerciseProps {
  /** The matching question data from the quiz payload */
  question: QuizQuestion
  /** Called when all pairs are matched */
  onComplete: (result: { score: number; incorrectAttempts: number }) => void
  /** testID for the container */
  testID?: string
}

type MatchItemState = 'default' | 'selected' | 'matched' | 'incorrect'

// ─── Styled Components ────────────────────────────────────────────────────────

/**
 * MatchItem — styled button for each item in the matching columns.
 * Uses Tamagui styled() with state and column variants.
 */
const MatchItem = styled(Button, {
  animation: 'quick',
  pressStyle: { scale: 0.98 },
  focusStyle: { borderColor: '$borderColorFocus' },
  minHeight: 48,
  borderWidth: 2,
  borderRadius: '$3',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  justifyContent: 'center',
  alignItems: 'center',

  variants: {
    state: {
      default: {
        borderColor: '$borderColor',
        backgroundColor: '$background',
      },
      selected: {
        borderColor: '$primary',
        backgroundColor: '$backgroundPress',
      },
      matched: {
        borderColor: '$success',
        backgroundColor: '$successBackground',
        opacity: 0.7,
      },
      incorrect: {
        borderColor: '$error',
        backgroundColor: '$errorBackground',
      },
    },
    column: {
      left: { alignItems: 'center' },
      right: { alignItems: 'center' },
    },
  } as const,

  defaultVariants: {
    state: 'default',
    column: 'left',
  },
})

/**
 * ConnectionLine — visual line between matched pairs.
 * Rendered as a simple horizontal bar between the two columns.
 */
const ConnectionLine = styled(YStack, {
  height: 2,
  backgroundColor: '$success',
  animation: 'quick',
  enterStyle: { opacity: 0, scaleX: 0 },
  opacity: 1,
  scaleX: 1,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validate a matching pair against the answer key.
 * Pure function — extracted for testability per anti-patterns guide.
 *
 * @param leftItem - The selected left column item
 * @param rightItem - The selected right column item
 * @param pairs - The answer key pairs from the quiz payload
 * @returns true if the pair is correct
 */
export function validateMatchingPair(
  leftItem: string,
  rightItem: string,
  pairs: MatchingPair[]
): boolean {
  return pairs.some((pair) => pair.left === leftItem && pair.right === rightItem)
}

/**
 * Calculate the final score.
 * Base: matchedPairs / totalPairs * 100 (%)
 * Penalty: -5% per incorrect attempt, minimum 0
 */
export function calculateMatchingScore(
  matchedCount: number,
  totalPairs: number,
  incorrectAttempts: number
): number {
  if (totalPairs === 0) return 0
  return Math.max(0, Math.round((matchedCount / totalPairs) * 100 - incorrectAttempts * 5))
}

/**
 * Detect if a string consists primarily of Chinese characters.
 * Used to apply 72px minimum font size for Chinese characters per AC#1.
 */
function isChineseText(text: string): boolean {
  // Unicode ranges for CJK Unified Ideographs and related blocks
  return /[\u4e00-\u9fff\u3400-\u4dbf\uff00-\uffef]/.test(text)
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * MatchingExercise renders a two-column tap-to-pair matching exercise.
 *
 * Internal state is component-local (ephemeral UI state), NOT in Zustand.
 * Score aggregate is passed to onComplete for the calling screen to handle.
 */
export function MatchingExercise({
  question,
  onComplete,
  testID = 'matching-exercise',
}: MatchingExerciseProps) {
  // ─── Component-local state (ephemeral UI interaction) ─────────────────────
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set())
  const [incorrectAttempts, setIncorrectAttempts] = useState(0)
  /**
   * Guard to ensure onComplete is called exactly once.
   * Prevents double-fire if incorrectAttempts state updates after all pairs match.
   */
  const hasCompletedRef = useRef(false)
  /**
   * incorrectFlash: tracks which left+right items are currently flashing error.
   * Cleared after ~500ms to animate back to default/selected state.
   */
  const [incorrectFlash, setIncorrectFlash] = useState<{ left: string; right: string } | null>(null)

  // ─── Store actions for session-level score tracking (Story 4.5 Task 4) ──────
  const addMatchedPairScore = useQuizStore((state) => state.addMatchedPairScore)
  const addIncorrectMatchingAttempt = useQuizStore((state) => state.addIncorrectMatchingAttempt)

  const pairs = question.pairs ?? []
  // Derive left/right columns from left_items/right_items if available,
  // otherwise fall back to extracting from pairs (for transformed data)
  const leftItems = question.left_items ?? pairs.map((p) => p.left)
  const rightItems = question.right_items ?? pairs.map((p) => p.right)
  const totalPairs = pairs.length

  // ─── Completion check (runs after every pair match) ───────────────────────
  // Guard with hasCompletedRef to ensure onComplete fires exactly once,
  // even if incorrectAttempts state updates after the last pair is matched.
  useEffect(() => {
    if (totalPairs > 0 && matchedPairs.size === totalPairs && !hasCompletedRef.current) {
      hasCompletedRef.current = true
      const score = calculateMatchingScore(matchedPairs.size, totalPairs, incorrectAttempts)
      onComplete({ score, incorrectAttempts })
    }
  }, [matchedPairs.size, totalPairs, incorrectAttempts, onComplete])

  // ─── Clear incorrect flash after 500ms ────────────────────────────────────
  useEffect(() => {
    if (incorrectFlash === null) return
    const timer = setTimeout(() => {
      setIncorrectFlash(null)
      setSelectedLeft(null)
    }, 500)
    return () => clearTimeout(timer)
  }, [incorrectFlash])

  // ─── Event handlers ───────────────────────────────────────────────────────

  const handleLeftTap = useCallback(
    (leftItem: string) => {
      // Ignore taps on matched items (they are disabled via prop, but guard defensively)
      if (matchedPairs.has(leftItem)) return
      // Ignore taps while incorrect flash is animating
      if (incorrectFlash !== null) return
      // Toggle selection: tapping the currently selected item deselects it
      setSelectedLeft((prev) => (prev === leftItem ? null : leftItem))
    },
    [matchedPairs, incorrectFlash]
  )

  const handleRightTap = useCallback(
    (rightItem: string) => {
      // No-op if no left item is selected
      if (selectedLeft === null) return
      // Ignore taps on already-matched right items
      const isRightAlreadyMatched = pairs.some(
        (pair) => pair.right === rightItem && matchedPairs.has(pair.left)
      )
      if (isRightAlreadyMatched) return
      // Ignore taps while incorrect flash is animating
      if (incorrectFlash !== null) return

      const isCorrect = validateMatchingPair(selectedLeft, rightItem, pairs)

      if (isCorrect) {
        // Correct: add to matched set, clear selection, update session score in store
        setMatchedPairs((prev) => {
          const next = new Set(prev)
          next.add(selectedLeft)
          return next
        })
        setSelectedLeft(null)
        addMatchedPairScore()
        // TODO: Story 4.9 — play "ding" sound here
      } else {
        // Incorrect: flash error state, reset selection after 500ms (handled by useEffect)
        setIncorrectAttempts((prev) => prev + 1)
        setIncorrectFlash({ left: selectedLeft, right: rightItem })
        addIncorrectMatchingAttempt()
        // TODO: Story 4.9 — play "bonk" sound here
      }
    },
    [selectedLeft, matchedPairs, pairs, incorrectFlash, addMatchedPairScore, addIncorrectMatchingAttempt]
  )

  // ─── State helpers ────────────────────────────────────────────────────────

  const getLeftItemState = useCallback(
    (leftItem: string): MatchItemState => {
      if (matchedPairs.has(leftItem)) return 'matched'
      if (incorrectFlash?.left === leftItem) return 'incorrect'
      if (selectedLeft === leftItem) return 'selected'
      return 'default'
    },
    [matchedPairs, incorrectFlash, selectedLeft]
  )

  const getRightItemState = useCallback(
    (rightItem: string): MatchItemState => {
      // Check if this right item is part of a matched pair
      const isMatched = pairs.some(
        (pair) => pair.right === rightItem && matchedPairs.has(pair.left)
      )
      if (isMatched) return 'matched'
      if (incorrectFlash?.right === rightItem) return 'incorrect'
      return 'default'
    },
    [pairs, matchedPairs, incorrectFlash]
  )

  const isRightMatched = useCallback(
    (rightItem: string): boolean => {
      return pairs.some((pair) => pair.right === rightItem && matchedPairs.has(pair.left))
    },
    [pairs, matchedPairs]
  )

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <YStack flex={1} testID={testID}>
      {/* Progress indicator: "X/Y paired" */}
      <XStack paddingBottom="$3" alignItems="center">
        <Text
          fontSize="$3"
          color="$colorSubtle"
          fontWeight="500"
          testID="matching-progress-text"
        >
          {matchedPairs.size}/{totalPairs} paired
        </Text>
      </XStack>

      {/* Matching rows */}
      <YStack flex={1} gap="$3">
        {leftItems.map((leftItem, index) => {
          const rightItem = rightItems[index] ?? ''
          const leftState = getLeftItemState(leftItem)
          const rightState = getRightItemState(rightItem)
          const isLeftMatchedItem = matchedPairs.has(leftItem)
          const isRightMatchedItem = isRightMatched(rightItem)

          return (
            <XStack
              key={`row-${index}`}
              gap="$2"
              alignItems="center"
              testID={`matching-row-${index}`}
            >
              {/* Left column item */}
              <MatchItem
                state={leftState}
                column="left"
                flex={1}
                disabled={isLeftMatchedItem || incorrectFlash !== null}
                onPress={() => handleLeftTap(leftItem)}
                testID={`left-item-${index}`}
                accessibilityLabel={leftItem}
                accessibilityState={{ disabled: isLeftMatchedItem }}
                // Shake effect: x offset on incorrect flash, springs back with 'quick' animation
                x={incorrectFlash?.left === leftItem ? 4 : 0}
              >
                <Text
                  fontSize={isChineseText(leftItem) ? 72 : 16}
                  color="$color"
                  testID={`left-item-text-${index}`}
                >
                  {leftItem}
                </Text>
              </MatchItem>

              {/* Connection line (shown for matched rows) */}
              <AnimatePresence>
                {isLeftMatchedItem ? (
                  <ConnectionLine
                    key={`line-${leftItem}`}
                    width={24}
                    flexShrink={0}
                    testID={`connection-line-${index}`}
                  />
                ) : (
                  <YStack width={24} flexShrink={0} testID={`spacer-${index}`} />
                )}
              </AnimatePresence>

              {/* Right column item */}
              <MatchItem
                state={rightState}
                column="right"
                flex={1}
                disabled={isRightMatchedItem || incorrectFlash !== null}
                onPress={() => handleRightTap(rightItem)}
                testID={`right-item-${index}`}
                accessibilityLabel={rightItem}
                accessibilityState={{ disabled: isRightMatchedItem }}
                // Shake effect: x offset on incorrect flash, springs back with 'quick' animation
                x={incorrectFlash?.right === rightItem ? -4 : 0}
              >
                <Text
                  fontSize={isChineseText(rightItem) ? 36 : 16}
                  color="$color"
                  testID={`right-item-text-${index}`}
                >
                  {rightItem}
                </Text>
              </MatchItem>
            </XStack>
          )
        })}
      </YStack>
    </YStack>
  )
}
