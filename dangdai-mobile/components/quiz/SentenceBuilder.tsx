/**
 * SentenceBuilder Component
 *
 * Renders a sentence construction exercise with:
 * - Answer area (SlotArea) at the top showing placed word tiles
 * - Word bank below showing available word tiles
 * - Tap-to-place: tapping an available tile moves it to the answer area
 * - Tap-to-return: tapping a placed tile returns it to the word bank
 * - Submit button — disabled until all tiles are placed
 * - Hybrid validation: local exact match first, LLM fallback for alternatives
 * - Per-tile feedback: correct tiles flash green, incorrect tiles flash orange
 * - Shows correct sentence when answer is incorrect
 * - Shows "Your answer is also valid!" when LLM confirms a valid alternative
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

import { useState, useEffect, useRef } from 'react'
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

// ─── Styled Components ────────────────────────────────────────────────────────

const WordTile = styled(Button, {
  animation: 'medium',
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

// ─── Component ────────────────────────────────────────────────────────────────

/** Feedback display delay before auto-advancing (1.5s per spec — longer than MCQ 1s) */
const FEEDBACK_DELAY_MS = 1500

export function SentenceBuilder({
  questionText,
  scrambledWords,
  correctOrder,
  correctAnswer,
  explanation,
  sourceCitation,
  onAnswer,
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

  // ─── Feedback timeout ref ─────────────────────────────────────────────────

  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        clearTimeout(feedbackTimeoutRef.current)
      }
    }
  }, [])

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

  const handleTileTap = (tileId: string) => {
    if (isSubmitted) return
    placeTile(tileId)
  }

  const handlePlacedTileTap = (tileId: string) => {
    if (isSubmitted) return
    removeTile(tileId)
  }

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

    // Auto-advance after feedback delay
    feedbackTimeoutRef.current = setTimeout(() => {
      feedbackTimeoutRef.current = null
      onAnswer(result.isCorrect)
    }, FEEDBACK_DELAY_MS)
  }

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

        {/* Answer area (SlotArea) */}
        <YStack gap="$1">
          <Text fontSize="$2" color="$colorSubtle" textTransform="uppercase" letterSpacing={1}>
            Your Answer
          </Text>
          <SlotArea testID="slot-area">
            {placedTileIds.length === 0 ? (
              <Text color="$colorSubtle" fontSize="$3">
                Tap words below to place them here
              </Text>
            ) : null}
            <AnimatePresence>
              {isSubmitted
                ? // After submit: show tiles with feedback state
                  placedTileIds.map((tileId, index) => {
                    const word = scrambledWords[parseInt(tileId.replace('tile-', ''), 10)] ?? ''
                    const state = tileFeedback[index] ?? 'placed'
                    return (
                      <Theme
                        key={tileId}
                        name={state === 'correct' ? 'success' : state === 'incorrect' ? 'error' : undefined}
                      >
                        <WordTile
                          state={state}
                          animation="quick"
                          disabled
                          testID={`placed-tile-${tileId}-${state}`}
                        >
                          <Text fontSize={getTileFontSize(word)}>{word}</Text>
                        </WordTile>
                      </Theme>
                    )
                  })
                : // Before submit: interactive placed tiles
                  placedTileIds.map((tileId) => {
                    const word = scrambledWords[parseInt(tileId.replace('tile-', ''), 10)] ?? ''
                    return (
                      <WordTile
                        key={tileId}
                        state="placed"
                        animation="medium"
                        enterStyle={{ scale: 0.8, opacity: 0 }}
                        focusStyle={{ borderColor: '$borderColorFocus' }}
                        onPress={() => handlePlacedTileTap(tileId)}
                        testID={`placed-tile-${tileId}`}
                      >
                        <Text fontSize={getTileFontSize(word)}>{word}</Text>
                      </WordTile>
                    )
                  })}
            </AnimatePresence>
          </SlotArea>
        </YStack>

        {/* Word bank */}
        {!isSubmitted ? (
          <YStack gap="$1">
            <Text fontSize="$2" color="$colorSubtle" textTransform="uppercase" letterSpacing={1}>
              Word Bank
            </Text>
            <XStack flexWrap="wrap" gap="$2" testID="word-bank">
              <AnimatePresence>
                {availableTileIds.map((tileId) => {
                  const word = scrambledWords[parseInt(tileId.replace('tile-', ''), 10)] ?? ''
                  return (
                    <WordTile
                      key={tileId}
                      state="available"
                      animation="medium"
                      enterStyle={{ scale: 0.8, opacity: 0 }}
                      focusStyle={{ borderColor: '$borderColorFocus' }}
                      onPress={() => handleTileTap(tileId)}
                      testID={`available-tile-${tileId}`}
                    >
                      <Text fontSize={getTileFontSize(word)}>{word}</Text>
                    </WordTile>
                  )
                })}
              </AnimatePresence>
            </XStack>
          </YStack>
        ) : null}

        {/* Submit button */}
        {!isSubmitted ? (
          <Button
            animation="quick"
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
