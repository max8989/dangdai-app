/**
 * DialogueCard Component
 *
 * Renders a dialogue completion exercise with:
 * - Conversation bubbles (A left-aligned, B right-aligned)
 * - One blank bubble for the user to fill
 * - Vertical list of answer options below the dialogue
 * - Hybrid validation (local exact match → LLM fallback)
 * - Slide-in animation for filled answer
 * - Inline loading spinner during LLM validation
 * - Success/error feedback with explanation text
 * - "Your answer is also valid!" for correct alternatives
 *
 * Chinese characters are displayed at font size $13 (72px) per AC #1.
 * Answer options have minimum 48px touch targets per AC #1.
 *
 * Story 4.6: Dialogue Completion Exercise
 */

import { useState } from 'react'
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

import { useAnswerValidation } from '../../hooks/useAnswerValidation'
import type { DialogueQuestion } from '../../types/quiz'
import type { ValidationResult } from '../../hooks/useAnswerValidation'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DialogueAnswerResult {
  correct: boolean
  selectedAnswer: string
  isAlternative: boolean
  explanation: string
  alternatives?: string[]
}

interface DialogueCardProps {
  /** The dialogue question data */
  question: DialogueQuestion
  /** Callback when answer is validated (carries full validation result) */
  onAnswerResult: (result: DialogueAnswerResult) => void
  /** Whether interaction is disabled (e.g., already answered) */
  disabled?: boolean
  /** testID for the root container */
  testID?: string
}

// ─── Styled Components ────────────────────────────────────────────────────────

/**
 * DialogueBubble — styled speech bubble for conversation display.
 * Speaker A = left-aligned ($surface bg), Speaker B = right-aligned ($primary bg).
 * hasBlank variant adds dashed border for the blank to fill.
 */
const DialogueBubble = styled(YStack, {
  animation: 'medium',
  padding: '$3',
  borderRadius: 12,
  maxWidth: '80%',

  variants: {
    speaker: {
      a: {
        alignSelf: 'flex-start',
        backgroundColor: '$surface',
        borderColor: '$borderColor',
        borderWidth: 1,
      },
      b: {
        alignSelf: 'flex-end',
        backgroundColor: '$primary',
        borderColor: '$primary',
        borderWidth: 1,
      },
    },
    hasBlank: {
      true: {
        borderStyle: 'dashed',
        borderColor: '$primary',
        borderWidth: 2,
      },
    },
  } as const,
})

/**
 * DialogueAnswerOption — styled button for answer selection below dialogue.
 * Vertical list layout (full-width — dialogue answers are full sentences).
 * Minimum 48px touch target per AC #1 accessibility requirement.
 */
const DialogueAnswerOption = styled(Button, {
  animation: 'quick',
  pressStyle: { scale: 0.98 },
  focusStyle: { borderColor: '$borderColorFocus' },
  minHeight: 48,
  borderWidth: 1,
  borderRadius: '$3',
  justifyContent: 'flex-start',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  width: '100%',

  variants: {
    state: {
      default: { borderColor: '$borderColor', backgroundColor: '$surface' },
      selected: { borderColor: '$primary', backgroundColor: '$backgroundPress' },
      correct: { borderColor: '$success', backgroundColor: '$successBackground' },
      incorrect: { borderColor: '$error', backgroundColor: '$errorBackground' },
      disabled: { opacity: 0.5, borderColor: '$borderColor', backgroundColor: '$surface' },
    },
  } as const,

  defaultVariants: {
    state: 'default',
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

type OptionState = 'default' | 'selected' | 'correct' | 'incorrect' | 'disabled'

function getOptionState(
  option: string,
  selectedAnswer: string | null,
  validationResult: ValidationResult | null,
): OptionState {
  if (selectedAnswer === null) return 'default'

  if (option === selectedAnswer) {
    if (validationResult === null) return 'selected' // Validating
    return validationResult.isCorrect ? 'correct' : 'incorrect'
  }

  // Non-selected options after selection — all disabled regardless of correctness.
  // The correct answer is surfaced in the explanation text block, not in the options.
  return 'disabled'
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * DialogueCard renders a dialogue completion exercise.
 * Manages its own selection and validation state internally,
 * then reports the final result to the parent via onAnswerResult.
 */
export function DialogueCard({
  question,
  onAnswerResult,
  disabled = false,
  testID = 'dialogue-card',
}: DialogueCardProps) {
  const { validate, isValidating } = useAnswerValidation()

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  const hasSelected = selectedAnswer !== null

  const handleOptionPress = async (option: string) => {
    if (hasSelected || disabled) return

    setSelectedAnswer(option)

    const result = await validate({
      userAnswer: option,
      correctAnswer: question.correct_answer,
      questionText: question.question_text,
      exerciseType: question.exercise_type,
      preGeneratedExplanation: question.explanation,
    })

    setValidationResult(result)

    onAnswerResult({
      correct: result.isCorrect,
      selectedAnswer: option,
      isAlternative: result.isAlternative,
      explanation: result.explanation,
      alternatives: result.alternatives,
    })
  }

  return (
    <YStack testID={testID} gap="$4" flex={1}>
      {/* Dialogue bubbles */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack gap="$3" paddingBottom="$2">
          {question.dialogue_lines.map((line, index) => {
            const isBlankLine = line.isBlank

            if (isBlankLine) {
              // Render the blank bubble (with fill animation and validation state)
              const showFeedback = validationResult !== null && selectedAnswer !== null

              return (
                <Theme
                  key={`line-${index}`}
                  name={
                    showFeedback
                      ? validationResult.isCorrect
                        ? 'success'
                        : 'error'
                      : undefined
                  }
                >
                  <DialogueBubble
                    speaker={line.speaker}
                    hasBlank={!hasSelected}
                    animation="medium"
                    enterStyle={{ opacity: 0, y: 5 + index * 3 }}
                    testID="dialogue-blank-bubble"
                  >
                    <XStack
                      alignItems="center"
                      gap="$2"
                      minHeight={48}
                      minWidth={80}
                      justifyContent="space-between"
                    >
                      <AnimatePresence>
                        {selectedAnswer ? (
                          <Text
                            key="filled-answer"
                            animation="medium"
                            enterStyle={{ opacity: 0, x: 20 }}
                            fontSize="$13"
                            color={showFeedback ? (validationResult.isCorrect ? '$success' : '$error') : '$color'}
                            flex={1}
                            testID="dialogue-filled-answer"
                          >
                            {selectedAnswer}
                          </Text>
                        ) : (
                          <Text
                            key="blank-placeholder"
                            fontSize="$4"
                            color="$primary"
                            opacity={0.6}
                            testID="dialogue-blank-placeholder"
                          >
                            ___
                          </Text>
                        )}
                      </AnimatePresence>

                      {/* Validation indicator */}
                      {isValidating && (
                        <Spinner size="small" color="$primary" testID="dialogue-validation-spinner" />
                      )}
                      {showFeedback && validationResult.isCorrect && (
                        <CheckCircle size={20} color="$success" testID="dialogue-correct-icon" />
                      )}
                      {showFeedback && !validationResult.isCorrect && (
                        <XCircle size={20} color="$error" testID="dialogue-incorrect-icon" />
                      )}
                    </XStack>
                  </DialogueBubble>
                </Theme>
              )
            }

            // Regular (non-blank) dialogue line
            return (
              <DialogueBubble
                key={`line-${index}`}
                speaker={line.speaker}
                animation="medium"
                enterStyle={{ opacity: 0, y: 5 + index * 3 }}
                testID={`dialogue-bubble-${line.speaker}-${index}`}
              >
                <Text
                  fontSize="$13"
                  color="$color"
                  testID={`dialogue-line-text-${index}`}
                >
                  {line.text}
                </Text>
              </DialogueBubble>
            )
          })}
        </YStack>
      </ScrollView>

      {/* Feedback section (shown after validation) */}
      <AnimatePresence>
        {validationResult !== null && (
          <YStack
            key="feedback"
            animation="medium"
            enterStyle={{ opacity: 0, y: 8 }}
            gap="$2"
            testID="dialogue-feedback"
          >
            {validationResult.isAlternative && (
              <Theme name="success">
                <YStack
                  backgroundColor="$successBackground"
                  borderRadius="$3"
                  padding="$3"
                  testID="dialogue-alternative-message"
                >
                  <Text fontSize="$4" fontWeight="600" color="$success">
                    Your answer is also valid!
                  </Text>
                  {validationResult.alternatives && validationResult.alternatives.length > 0 && (
                    <Text fontSize="$3" color="$color" marginTop="$1" testID="dialogue-alternatives-list">
                      Other valid answers: {validationResult.alternatives.join(', ')}
                    </Text>
                  )}
                </YStack>
              </Theme>
            )}

            {!validationResult.isCorrect && (
              <Theme name="error">
                <YStack
                  backgroundColor="$errorBackground"
                  borderRadius="$3"
                  padding="$3"
                  testID="dialogue-incorrect-feedback"
                >
                  <Text fontSize="$3" fontWeight="600" color="$error">
                    Correct answer: {question.correct_answer}
                  </Text>
                </YStack>
              </Theme>
            )}

            <Text
              fontSize="$3"
              color="$colorSubtle"
              testID="dialogue-explanation"
            >
              {validationResult.explanation}
            </Text>
          </YStack>
        )}
      </AnimatePresence>

      {/* Answer options — vertical list */}
      <YStack gap="$2" testID="dialogue-answer-options">
        <Text
          fontSize="$3"
          color="$colorSubtle"
          fontWeight="500"
          testID="dialogue-instruction"
        >
          Select the best response:
        </Text>

        {question.options.map((option, index) => {
          const optionState = getOptionState(option, selectedAnswer, validationResult)
          const isDisabled = hasSelected || disabled

          return (
            <DialogueAnswerOption
              key={option}
              state={optionState}
              onPress={() => { void handleOptionPress(option) }}
              disabled={isDisabled}
              accessibilityState={{ disabled: isDisabled }}
              testID={`dialogue-option-${index}`}
            >
              <Text
                fontSize="$4"
                color="$color"
                numberOfLines={3}
                testID={`dialogue-option-text-${index}`}
              >
                {option}
              </Text>
            </DialogueAnswerOption>
          )
        })}
      </YStack>
    </YStack>
  )
}
