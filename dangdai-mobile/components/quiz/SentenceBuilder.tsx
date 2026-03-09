/**
 * SentenceBuilder Component
 *
 * Renders a sentence construction exercise with:
 * - Answer area (SlotArea) at the top showing placed word tiles
 * - Word bank below showing available word tiles
 * - Drag-and-drop: drag tiles between word bank and answer area
 * - Tap-to-place: tapping an available tile moves it to the answer area (primary)
 * - Tap-to-return: tapping a placed tile returns it to the word bank
 * - Submit button — disabled until all tiles are placed
 * - Hybrid validation: local exact match first, LLM fallback for alternatives
 * - Per-tile feedback: correct tiles flash green, incorrect tiles flash orange
 * - Shows correct sentence when answer is incorrect
 * - Shows "Your answer is also valid!" when LLM confirms a valid alternative
 *
 * Drag-and-drop implementation:
 * Uses `react-native-gesture-handler` Gesture.Pan() + `react-native-reanimated`
 * useSharedValue/useAnimatedStyle for each tile. On drag release, hit-tests
 * against measured drop zone layouts to determine placement. Falls back to
 * snap-back animation if dropped outside valid zones.
 *
 * Tile ID strategy: "tile-N" where N is the index in scrambled_words[].
 * This handles duplicate words correctly (two "的" tiles get different IDs).
 *
 * Character display requirements (AC #1):
 * - Chinese characters: 72px minimum font size
 * - Tiles have minimum 48px touch targets
 *
 * Story 4.7: Sentence Construction Exercise
 */

import { useState, useRef, useCallback } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Spinner,
  Theme,
  AnimatePresence,
  styled,
  ScrollView,
} from 'tamagui'
import { StyleSheet, type LayoutRectangle } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated'
import { CheckCircle, XCircle } from '@tamagui/lucide-icons'

import { useQuizStore } from '../../stores/useQuizStore'
import { useAnswerValidation } from '../../hooks/useAnswerValidation'
import type { ValidationResult } from '../../hooks/useAnswerValidation'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SentenceBuilderProps {
  /** "Arrange the words into a correct sentence" */
  questionText: string
  /** Scrambled word tiles e.g. ["咖啡", "我", "喜歡", "很", "。"] */
  scrambledWords: string[]
  /** The correct word order e.g. ["我", "很", "喜歡", "咖啡", "。"] */
  correctOrder: string[]
  /** Joined correct answer string e.g. "我很喜歡咖啡。" */
  correctAnswer: string
  /** Pre-generated explanation from quiz payload */
  explanation: string
  /** Source citation e.g. "Book 2, Chapter 12" */
  sourceCitation: string
  /** Callback when answer is evaluated */
  onAnswer: (isCorrect: boolean) => void
  /** Whether interaction is disabled (e.g., during FeedbackOverlay display) */
  disabled?: boolean
  /** testID for the root container */
  testID?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute per-tile correct/incorrect feedback based on position.
 *
 * Expects placedWords.length === correctOrder.length (enforced by allTilesPlaced
 * guard before submit). Logs a warning in dev if lengths differ — indicates a
 * backend data inconsistency between scrambled_words and correct_order (M2 fix).
 */
function computeTileFeedback(
  placedWords: string[],
  correctOrder: string[],
): Array<'correct' | 'incorrect'> {
  if (__DEV__ && placedWords.length !== correctOrder.length) {
    console.warn(
      `[SentenceBuilder] computeTileFeedback: placedWords.length (${placedWords.length}) ` +
        `!== correctOrder.length (${correctOrder.length}). ` +
        'Check that scrambled_words and correct_order have matching lengths in the backend response.',
    )
  }
  return placedWords.map((word, index) => {
    if (index < correctOrder.length && word === correctOrder[index]) {
      return 'correct'
    }
    return 'incorrect'
  })
}

/**
 * Determine font size for a tile based on word length.
 * Short words (1-2 chars): 24px; longer words: scale down to min 16px.
 */
function getTileFontSize(word: string): number {
  const len = word.length
  if (len <= 2) return 24
  if (len <= 4) return 20
  return 16
}

/**
 * Check if a point (absolute coordinates) falls within a layout rectangle.
 */
function isPointInLayout(
  x: number,
  y: number,
  layout: LayoutRectangle | null,
): boolean {
  if (!layout) return false
  return (
    x >= layout.x &&
    x <= layout.x + layout.width &&
    y >= layout.y &&
    y <= layout.y + layout.height
  )
}

// ─── Styled Components ────────────────────────────────────────────────────────

// WordTile no longer uses the `animation` prop to avoid Reanimated trying to
// animate Tamagui theme-token colors (e.g. "$surface") which are objects at
// runtime, not color strings. This was the root cause of:
//   [ReanimatedError: [Reanimated] Invalid color value: [object Object]]
const WordTile = styled(Button, {
  pressStyle: { scale: 0.95 },
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  borderRadius: 8,
  minHeight: 48,
  borderWidth: 1,

  variants: {
    state: {
      available: { backgroundColor: '$surface', borderColor: '$borderColor' },
      placed: { backgroundColor: '$backgroundPress', borderColor: '$primary' },
      correct: { backgroundColor: '$successBackground', borderColor: '$success' },
      incorrect: { backgroundColor: '$errorBackground', borderColor: '$error' },
    },
  } as const,
})

const SlotArea = styled(XStack, {
  minHeight: 64,
  borderWidth: 1,
  borderStyle: 'dashed',
  borderColor: '$borderColor',
  borderRadius: 8,
  padding: '$2',
  flexWrap: 'wrap',
  gap: '$2',
  alignItems: 'center',
})

// ─── DraggableTile ────────────────────────────────────────────────────────────

/**
 * A tile wrapper that adds pan gesture (drag) capability.
 *
 * Each DraggableTile tracks its own drag offset via shared values.
 * On release, it calls onDragEnd with the tile's absolute position so
 * the parent can hit-test against drop zone layouts.
 *
 * The tile also supports tap-to-place as a fallback (onPress on the inner
 * WordTile). Tap and drag are handled by Gesture.Race — the pan gesture
 * requires a minimum distance to activate, allowing taps to pass through.
 */
interface DraggableTileProps {
  tileId: string
  word: string
  tileState: 'available' | 'placed'
  onTap: (tileId: string) => void
  onDragEnd: (tileId: string, absoluteX: number, absoluteY: number) => void
  testID: string
  accessibilityLabel: string
  accessibilityHint: string
}

function DraggableTile({
  tileId,
  word,
  tileState,
  onTap,
  onDragEnd,
  testID,
  accessibilityLabel,
  accessibilityHint,
}: DraggableTileProps) {
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const isDragging = useSharedValue(false)

  const panGesture = Gesture.Pan()
    .minDistance(10)
    .onStart(() => {
      isDragging.value = true
    })
    .onChange((event) => {
      translateX.value = event.translationX
      translateY.value = event.translationY
    })
    .onFinalize((event) => {
      if (isDragging.value) {
        isDragging.value = false
        // Pass the absolute position of the touch to the parent for hit-testing
        runOnJS(onDragEnd)(tileId, event.absoluteX, event.absoluteY)
      }
      // Animate back to origin — if the parent decides to move the tile,
      // the component will unmount/remount in the new zone anyway
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 })
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 })
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    zIndex: isDragging.value ? 999 : 0,
    opacity: isDragging.value ? 0.85 : 1,
  }))

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[rnStyles.draggableTile, animatedStyle]}>
        <WordTile
          state={tileState}
          enterStyle={{ scale: 0.8, opacity: 0 }}
          onPress={() => onTap(tileId)}
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
        >
          <Text fontSize={getTileFontSize(word)}>{word}</Text>
        </WordTile>
      </Animated.View>
    </GestureDetector>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SentenceBuilder({
  questionText,
  scrambledWords,
  correctOrder,
  correctAnswer,
  explanation,
  sourceCitation,
  onAnswer,
  disabled = false,
  testID,
}: SentenceBuilderProps) {
  // ─── Store state ─────────────────────────────────────────────────────────

  const placedTileIds = useQuizStore((state) => state.placedTileIds)
  const placeTile = useQuizStore((state) => state.placeTile)
  const removeTile = useQuizStore((state) => state.removeTile)

  // ─── Validation hook ──────────────────────────────────────────────────────

  const { validate, isValidating } = useAnswerValidation()

  // ─── Local state ──────────────────────────────────────────────────────────

  const [isSubmitted, setIsSubmitted] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [tileFeedback, setTileFeedback] = useState<Array<'correct' | 'incorrect'>>([])

  // ─── Submission guard ref (M1 fix: prevents double-submit on slow devices) ──
  // React state batching means isSubmitted may not be synchronously true by the
  // time a second tap fires. A ref is set synchronously before any async work.

  const isSubmittingRef = useRef(false)

  // ─── Drop zone layout refs ─────────────────────────────────────────────────
  // Store absolute page coordinates of answer area and word bank for hit-testing
  // on drag end. Updated via onLayout + measure().

  const answerAreaRef = useRef<LayoutRectangle | null>(null)
  const wordBankRef = useRef<LayoutRectangle | null>(null)

  // ─── Derived state ────────────────────────────────────────────────────────

  const allTileIds = scrambledWords.map((_, i) => `tile-${i}`)
  const availableTileIds = allTileIds.filter((id) => !placedTileIds.includes(id))
  const allTilesPlaced = placedTileIds.length === scrambledWords.length

  const placedWords = placedTileIds.map((id) => {
    const index = parseInt(id.replace('tile-', ''), 10)
    return scrambledWords[index] ?? ''
  })

  const constructedSentence = placedWords.join('')

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleTileTap = useCallback(
    (tileId: string) => {
      if (isSubmitted || disabled) return
      placeTile(tileId)
    },
    [isSubmitted, disabled, placeTile],
  )

  const handlePlacedTileTap = useCallback(
    (tileId: string) => {
      if (isSubmitted || disabled) return
      removeTile(tileId)
    },
    [isSubmitted, disabled, removeTile],
  )

  // Handle drag end for tiles in the word bank (available tiles).
  // If dropped over the answer area, place the tile; otherwise snap back.
  const handleAvailableDragEnd = useCallback(
    (tileId: string, absoluteX: number, absoluteY: number) => {
      if (isSubmitted || disabled) return
      if (isPointInLayout(absoluteX, absoluteY, answerAreaRef.current)) {
        const current = useQuizStore.getState().placedTileIds
        if (!current.includes(tileId)) {
          placeTile(tileId)
        }
      }
      // else: snap-back animation is handled by DraggableTile.onFinalize
    },
    [isSubmitted, disabled, placeTile],
  )

  // Handle drag end for tiles in the answer area (placed tiles).
  // If dropped over the word bank, remove the tile; otherwise snap back.
  const handlePlacedDragEnd = useCallback(
    (tileId: string, absoluteX: number, absoluteY: number) => {
      if (isSubmitted || disabled) return
      if (isPointInLayout(absoluteX, absoluteY, wordBankRef.current)) {
        const current = useQuizStore.getState().placedTileIds
        if (current.includes(tileId)) {
          removeTile(tileId)
        }
      }
      // else: snap-back animation is handled by DraggableTile.onFinalize
    },
    [isSubmitted, disabled, removeTile],
  )

  const handleSubmit = async () => {
    // Guard with both ref (synchronous) and state (for render) to prevent
    // double-submit on slow devices where React batching delays state updates.
    if (!allTilesPlaced || isSubmitted || isSubmittingRef.current) return
    isSubmittingRef.current = true

    setIsSubmitted(true)

    // Pass raw strings — useAnswerValidation normalizes internally (H2 fix).
    const result = await validate({
      userAnswer: constructedSentence,
      correctAnswer,
      questionText,
      exerciseType: 'sentence_construction',
      preGeneratedExplanation: explanation,
    })

    setValidationResult(result)

    // Compute per-tile feedback
    if (result.isAlternative) {
      // LLM confirmed valid alternative — all tiles green
      setTileFeedback(placedWords.map(() => 'correct'))
    } else {
      setTileFeedback(computeTileFeedback(placedWords, correctOrder))
    }

    // Notify play.tsx immediately — auto-advance is handled by play.tsx's
    // unified FeedbackOverlay timer (1s), not by SentenceBuilder itself.
    onAnswer(result.isCorrect)
  }

  // ─── Layout measurement callbacks ──────────────────────────────────────────
  // We use onLayout to get approximate positions, then refine with measure()
  // for absolute coordinates. This handles scroll offsets and nested layouts.

  const answerAreaViewRef = useRef<Animated.View>(null)
  const wordBankViewRef = useRef<Animated.View>(null)

  const measureAnswerArea = useCallback(() => {
    answerAreaViewRef.current?.measureInWindow((x, y, width, height) => {
      answerAreaRef.current = { x, y, width, height }
    })
  }, [])

  const measureWordBank = useCallback(() => {
    wordBankViewRef.current?.measureInWindow((x, y, width, height) => {
      wordBankRef.current = { x, y, width, height }
    })
  }, [])

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ScrollView testID={testID}>
      <YStack gap="$4" paddingBottom="$6">
        {/* Question text */}
        <Text
          fontSize="$4"
          color="$colorSubtle"
          fontWeight="500"
          testID="sentence-builder-question"
        >
          {questionText}
        </Text>

        {!isSubmitted ? (
          // ─── Interactive mode: drag-and-drop + tap-to-place ─────────────
          <>
            {/* Answer area (SlotArea) — drop zone for available tiles */}
            <YStack gap="$1">
              <Text fontSize="$2" color="$colorSubtle" textTransform="uppercase" letterSpacing={1}>
                Your Answer
              </Text>
              <Animated.View
                ref={answerAreaViewRef}
                onLayout={measureAnswerArea}
              >
                <SlotArea testID="slot-area" accessibilityRole="list" accessibilityLabel="Answer area">
                  {placedTileIds.length === 0 ? (
                    <Text color="$colorSubtle" fontSize="$3">
                      Tap or drag words below to place them here
                    </Text>
                  ) : null}
                  {placedTileIds.map((tileId) => {
                    const word = scrambledWords[parseInt(tileId.replace('tile-', ''), 10)] ?? ''
                    return (
                      <DraggableTile
                        key={`placed-${tileId}`}
                        tileId={tileId}
                        word={word}
                        tileState="placed"
                        onTap={handlePlacedTileTap}
                        onDragEnd={handlePlacedDragEnd}
                        testID={`placed-tile-${tileId}`}
                        accessibilityLabel={word}
                        accessibilityHint="Tap to return to word bank, or drag"
                      />
                    )
                  })}
                </SlotArea>
              </Animated.View>
            </YStack>

            {/* Word bank — drop zone for returning tiles */}
            <YStack gap="$1">
              <Text fontSize="$2" color="$colorSubtle" textTransform="uppercase" letterSpacing={1}>
                Word Bank
              </Text>
              <Animated.View
                ref={wordBankViewRef}
                onLayout={measureWordBank}
              >
                <XStack flexWrap="wrap" gap="$2" testID="word-bank" minHeight={48} accessibilityRole="list" accessibilityLabel="Word bank">
                  {availableTileIds.map((tileId) => {
                    const word = scrambledWords[parseInt(tileId.replace('tile-', ''), 10)] ?? ''
                    return (
                      <DraggableTile
                        key={`available-${tileId}`}
                        tileId={tileId}
                        word={word}
                        tileState="available"
                        onTap={handleTileTap}
                        onDragEnd={handleAvailableDragEnd}
                        testID={`available-tile-${tileId}`}
                        accessibilityLabel={word}
                        accessibilityHint="Tap to place in answer area, or drag"
                      />
                    )
                  })}
                </XStack>
              </Animated.View>
            </YStack>
          </>
        ) : (
          // ─── Submitted mode: static feedback tiles ───────────────────
          <YStack gap="$1">
            <Text fontSize="$2" color="$colorSubtle" textTransform="uppercase" letterSpacing={1}>
              Your Answer
            </Text>
            <SlotArea testID="slot-area">
              <AnimatePresence>
                {placedTileIds.map((tileId, index) => {
                  const word = scrambledWords[parseInt(tileId.replace('tile-', ''), 10)] ?? ''
                  const state = tileFeedback[index] ?? 'placed'
                  return (
                    <Theme
                      key={tileId}
                      name={state === 'correct' ? 'success' : state === 'incorrect' ? 'error' : undefined}
                    >
                      <WordTile
                        state={state}
                        disabled
                        testID={`placed-tile-${tileId}-${state}`}
                      >
                        <Text fontSize={getTileFontSize(word)}>{word}</Text>
                      </WordTile>
                    </Theme>
                  )
                })}
              </AnimatePresence>
            </SlotArea>
          </YStack>
        )}

        {/* Submit button */}
        {!isSubmitted ? (
          <Button
            pressStyle={{ scale: 0.98 }}
            disabled={!allTilesPlaced}
            opacity={allTilesPlaced ? 1 : 0.5}
            onPress={handleSubmit}
            testID="submit-button"
          >
            {isValidating ? (
              <Spinner size="small" color="$color" />
            ) : (
              <Text fontWeight="600">Submit</Text>
            )}
          </Button>
        ) : null}

        {/* Loading indicator during LLM validation */}
        {isSubmitted && isValidating ? (
          <XStack justifyContent="center" alignItems="center" gap="$2" testID="validating-indicator">
            <Spinner size="small" color="$primary" />
            <Text color="$colorSubtle" fontSize="$3">
              Checking your answer...
            </Text>
          </XStack>
        ) : null}

        {/* Feedback section (shown after validation completes) */}
        {isSubmitted && validationResult !== null ? (
          <AnimatePresence>
            <YStack
              key="feedback"
              animation="medium"
              enterStyle={{ opacity: 0, y: 8 }}
              gap="$3"
              testID="feedback-section"
            >
              {validationResult.isAlternative ? (
                // LLM confirmed valid alternative ordering
                <Theme name="success">
                  <YStack
                    backgroundColor="$successBackground"
                    borderRadius={8}
                    padding="$3"
                    gap="$2"
                    testID="alternative-valid-message"
                  >
                    <XStack alignItems="center" gap="$2">
                      <CheckCircle size={20} color="$success" />
                      <Text fontSize="$4" fontWeight="600" color="$success">
                        Your answer is also valid!
                      </Text>
                    </XStack>
                    {validationResult.alternatives && validationResult.alternatives.length > 0 ? (
                      <YStack gap="$1">
                        <Text fontSize="$3" color="$color">
                          Other valid orderings:
                        </Text>
                        {validationResult.alternatives.map((alt) => (
                          <Text key={alt} fontSize="$3" color="$color">
                            • {alt}
                          </Text>
                        ))}
                      </YStack>
                    ) : null}
                  </YStack>
                </Theme>
              ) : validationResult.isCorrect ? (
                // Exact local match — correct
                <Theme name="success">
                  <XStack
                    alignItems="center"
                    gap="$2"
                    backgroundColor="$successBackground"
                    borderRadius={8}
                    padding="$3"
                    testID="correct-feedback"
                  >
                    <CheckCircle size={20} color="$success" />
                    <Text fontSize="$4" fontWeight="600" color="$success">
                      Correct!
                    </Text>
                  </XStack>
                </Theme>
              ) : (
                // Incorrect — show correct sentence
                <Theme name="error">
                  <YStack
                    backgroundColor="$errorBackground"
                    borderRadius={8}
                    padding="$3"
                    gap="$2"
                    testID="incorrect-feedback"
                  >
                    <XStack alignItems="center" gap="$2">
                      <XCircle size={20} color="$error" />
                      <Text fontSize="$4" fontWeight="600" color="$error">
                        Not quite
                      </Text>
                    </XStack>
                    <YStack gap="$1">
                      <Text fontSize="$3" color="$color" fontWeight="500">
                        Correct sentence:
                      </Text>
                      <Text fontSize="$4" color="$color" testID="correct-sentence">
                        {correctAnswer}
                      </Text>
                    </YStack>
                  </YStack>
                </Theme>
              )}

              {/* Explanation */}
              <YStack
                backgroundColor="$backgroundHover"
                borderRadius={8}
                padding="$3"
                gap="$1"
                testID="explanation-section"
              >
                <Text fontSize="$2" color="$colorSubtle" textTransform="uppercase" letterSpacing={1}>
                  Explanation
                </Text>
                <Text fontSize="$3" color="$color">
                  {validationResult.explanation}
                </Text>
                {sourceCitation ? (
                  <Text
                    fontSize="$2"
                    color="$colorSubtle"
                    fontStyle="italic"
                    testID="source-citation"
                  >
                    {sourceCitation}
                  </Text>
                ) : null}
              </YStack>
            </YStack>
          </AnimatePresence>
        ) : null}
      </YStack>
    </ScrollView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const rnStyles = StyleSheet.create({
  draggableTile: {
    // Let the tile content define sizing; keep z-index layer intact
  },
})
