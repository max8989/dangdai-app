/**
 * ReadingPassageCard Component
 *
 * Scrollable passage with pinyin toggle and comprehension questions.
 * The passage stays mounted across all sub-questions.
 * Each sub-question is validated locally against the answer key.
 *
 * Story 4.8: Reading Comprehension Exercise
 */

import { useState, useEffect } from 'react'
import {
  styled,
  Card,
  YStack,
  XStack,
  Text,
  Button,
  Separator,
  ScrollView,
  AnimatePresence,
} from 'tamagui'
import type { ComprehensionSubQuestion } from '../../types/quiz'
import { AnswerOptionGrid } from './AnswerOptionGrid'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReadingPassageCardProps {
  /** The Chinese passage text */
  passage: string
  /** Optional pinyin for the passage (shown when pinyin toggle is active) */
  passagePinyin?: string
  /** Array of comprehension sub-questions for this passage */
  comprehensionQuestions: ComprehensionSubQuestion[]
  /** Index of the currently active sub-question (0-based) */
  currentSubQuestionIndex: number
  /** Callback when a sub-question is answered */
  onAnswer: (isCorrect: boolean, selectedAnswer: string) => void
  /** Whether interaction is disabled (e.g., during feedback delay) */
  disabled?: boolean
  /** testID for the container */
  testID?: string
}

// ─── Styled Components ────────────────────────────────────────────────────────

/**
 * PassageContainer — scrollable card for Chinese reading passages.
 * Size variants control maxHeight for different passage lengths.
 */
const PassageContainer = styled(Card, {
  animation: 'medium',
  enterStyle: { opacity: 0 },
  padding: '$4',
  maxHeight: 300,

  variants: {
    size: {
      short: { maxHeight: 200 },
      medium: { maxHeight: 300 },
      long: { maxHeight: 400 },
    },
  } as const,

  defaultVariants: {
    size: 'medium',
  },
})

/**
 * PinyinToggle — small button to show/hide pinyin above passage text.
 */
const PinyinToggle = styled(Button, {
  animation: 'quick',
  pressStyle: { scale: 0.95 },
  size: '$2',
  borderRadius: '$2',
  borderWidth: 1,
  borderColor: '$borderColor',
  backgroundColor: '$surface',
  minHeight: 48, // 48px touch target

  variants: {
    active: {
      true: {
        backgroundColor: '$backgroundPress',
        borderColor: '$primary',
      },
    },
  } as const,
})

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ReadingPassageCard renders a scrollable Chinese passage with pinyin toggle
 * and comprehension questions below. The passage stays visible across all
 * sub-questions (does not unmount).
 */
export function ReadingPassageCard({
  passage,
  passagePinyin,
  comprehensionQuestions,
  currentSubQuestionIndex,
  onAnswer,
  disabled = false,
  testID = 'reading-passage-card',
}: ReadingPassageCardProps) {
  const [showPinyin, setShowPinyin] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null)

  const currentQuestion = comprehensionQuestions[currentSubQuestionIndex]

  // Reset selection when sub-question changes
  useEffect(() => {
    setSelectedOption(null)
    setCorrectAnswer(null)
  }, [currentSubQuestionIndex])

  const handleAnswerSelect = (answer: string) => {
    if (disabled || selectedOption !== null) return

    const isCorrect = answer === currentQuestion.correct_answer
    setSelectedOption(answer)
    setCorrectAnswer(currentQuestion.correct_answer)

    // Feedback delay (~1s) before calling onAnswer callback
    setTimeout(() => {
      onAnswer(isCorrect, answer)
    }, 1000)
  }

  return (
    <YStack testID={testID} gap="$3">
      {/* Passage header */}
      <Text fontSize={16} color="$colorSubtle">
        Read the following passage:
      </Text>

      {/* Scrollable passage container */}
      <PassageContainer size="medium">
        <ScrollView showsVerticalScrollIndicator>
          {showPinyin && passagePinyin && (
            <Text fontSize={14} color="$colorSubtle" marginBottom="$2">
              {passagePinyin}
            </Text>
          )}
          <Text fontSize={20} lineHeight={32} color="$color">
            {passage}
          </Text>
        </ScrollView>

        {/* Pinyin toggle button — bottom-right of passage card */}
        {passagePinyin && (
          <XStack justifyContent="flex-end" marginTop="$2">
            <PinyinToggle
              active={showPinyin}
              onPress={() => setShowPinyin(!showPinyin)}
              testID="pinyin-toggle"
            >
              <Text fontSize={14}>拼音</Text>
            </PinyinToggle>
          </XStack>
        )}
      </PassageContainer>

      <Separator />

      {/* Sub-question progress */}
      <Text fontSize={14} color="$colorSubtle" textAlign="center">
        Question {currentSubQuestionIndex + 1}/{comprehensionQuestions.length}
      </Text>

      {/* Current comprehension question — AnimatePresence for transitions */}
      <AnimatePresence>
        <YStack
          key={currentSubQuestionIndex}
          animation="medium"
          enterStyle={{ opacity: 0, x: 20 }}
          exitStyle={{ opacity: 0, x: -20 }}
          gap="$3"
        >
          {/* Question text */}
          <Text fontSize={18} fontWeight="600" color="$color">
            {currentQuestion.question}
          </Text>

          {/* Answer options — REUSE AnswerOptionGrid from Story 4.3 */}
          <AnswerOptionGrid
            options={currentQuestion.options}
            selectedOption={selectedOption}
            correctAnswer={correctAnswer}
            onSelect={handleAnswerSelect}
            disabled={disabled || selectedOption !== null}
            testID="comprehension-answer-grid"
          />
        </YStack>
      </AnimatePresence>
    </YStack>
  )
}
