/**
 * ReadingPassageCard Component
 *
 * Scrollable passage with pinyin toggle and comprehension questions.
 * The passage stays mounted across all sub-questions.
 * Each sub-question is validated locally against the answer key.
 *
 * Story 4.8: Reading Comprehension Exercise
 */

import { useState, useEffect, useRef } from 'react'
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
  /** Feedback delay in milliseconds before calling onAnswer (default: 1000) */
  feedbackDelayMs?: number
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
  minHeight: 200, // Prevent layout shift while passage renders

  variants: {
    size: {
      short: { maxHeight: 200, minHeight: 150 },
      medium: { maxHeight: 300, minHeight: 200 },
      long: { maxHeight: 400, minHeight: 250 },
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
  feedbackDelayMs = 1000,
  testID = 'reading-passage-card',
}: ReadingPassageCardProps) {
  const [showPinyin, setShowPinyin] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Bounds check and error handling
  if (comprehensionQuestions.length === 0) {
    return (
      <YStack testID={testID}>
        <Text color="$error">No comprehension questions available.</Text>
      </YStack>
    )
  }

  if (currentSubQuestionIndex < 0 || currentSubQuestionIndex >= comprehensionQuestions.length) {
    return (
      <YStack testID={testID}>
        <Text color="$error">Invalid question index.</Text>
      </YStack>
    )
  }

  const currentQuestion = comprehensionQuestions[currentSubQuestionIndex]

  // Reset selection when sub-question changes
  useEffect(() => {
    setSelectedOption(null)
    setCorrectAnswer(null)
  }, [currentSubQuestionIndex])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleAnswerSelect = (answer: string) => {
    if (disabled || selectedOption !== null) return

    const isCorrect = answer === currentQuestion.correct_answer
    setSelectedOption(answer)
    setCorrectAnswer(currentQuestion.correct_answer)

    // Feedback delay before calling onAnswer callback (with cleanup)
    timeoutRef.current = setTimeout(() => {
      onAnswer(isCorrect, answer)
      timeoutRef.current = null
    }, feedbackDelayMs)
  }

  return (
    <YStack testID={testID} gap="$3">
      {/* Passage header */}
      <Text fontSize={16} color="$colorSubtle">
        Read the following passage:
      </Text>

      {/* Scrollable passage container */}
      <PassageContainer size="medium">
        <ScrollView 
          showsVerticalScrollIndicator
          accessibilityLabel="Reading passage"
          accessibilityRole="text"
        >
          {showPinyin && passagePinyin && passagePinyin.trim() && (
            <Text 
              fontSize={14} 
              color="$colorSubtle" 
              marginBottom="$2"
              accessibilityLabel="Pinyin pronunciation guide"
            >
              {passagePinyin}
            </Text>
          )}
          <Text 
            fontSize={20} 
            lineHeight={32} 
            color="$color"
            accessibilityLabel="Chinese passage text"
          >
            {passage}
          </Text>
        </ScrollView>

        {/* Pinyin toggle button — bottom-right of passage card */}
        {passagePinyin && passagePinyin.trim() && (
          <XStack justifyContent="flex-end" marginTop="$2">
            <PinyinToggle
              active={showPinyin}
              onPress={() => setShowPinyin(!showPinyin)}
              accessibilityLabel={showPinyin ? 'Hide pinyin' : 'Show pinyin'}
              accessibilityRole="button"
              accessibilityState={{ selected: showPinyin }}
              testID="pinyin-toggle"
            >
              <Text fontSize={14}>拼音</Text>
            </PinyinToggle>
          </XStack>
        )}
      </PassageContainer>

      <Separator />

      {/* Sub-question progress */}
      <Text 
        fontSize={14} 
        color="$colorSubtle" 
        textAlign="center"
        accessibilityLabel={`Question ${currentSubQuestionIndex + 1} of ${comprehensionQuestions.length}`}
        accessibilityRole="text"
      >
        Question {currentSubQuestionIndex + 1}/{comprehensionQuestions.length}
      </Text>

      {/* Current comprehension question — AnimatePresence for transitions */}
      {/* Only animate the question text to reduce re-renders */}
      <YStack gap="$3">
        <AnimatePresence>
          <Text 
            key={`question-${currentSubQuestionIndex}`}
            fontSize={18} 
            fontWeight="600" 
            color="$color"
            animation="quick"
            enterStyle={{ opacity: 0, x: 20 }}
            exitStyle={{ opacity: 0, x: -20 }}
          >
            {currentQuestion.question}
          </Text>
        </AnimatePresence>

        {/* Answer options — REUSE AnswerOptionGrid from Story 4.3 */}
        {/* Keep outside AnimatePresence to avoid unnecessary unmount/remount */}
        <AnswerOptionGrid
          key={`options-${currentSubQuestionIndex}`}
          options={currentQuestion.options}
          selectedOption={selectedOption}
          correctAnswer={correctAnswer}
          onSelect={handleAnswerSelect}
          disabled={disabled || selectedOption !== null}
          testID="comprehension-answer-grid"
        />
      </YStack>
    </YStack>
  )
}
