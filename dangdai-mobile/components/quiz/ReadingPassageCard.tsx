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
        <Text color="red">No comprehension questions available.</Text>
      </YStack>
    )
  }

  if (currentSubQuestionIndex < 0 || currentSubQuestionIndex >= comprehensionQuestions.length) {
    return (
      <YStack testID={testID}>
        <Text color="red">Invalid question index.</Text>
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
      <YStack padding="$4" maxHeight={300} minHeight={200} borderRadius="$3" borderWidth={1} borderColor="$borderColor">
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
            <Button
              size="$2"
              borderRadius="$2"
              chromeless
              bordered
              onPress={() => setShowPinyin(!showPinyin)}
              testID="pinyin-toggle"
            >
              <Text fontSize={14}>拼音</Text>
            </Button>
          </XStack>
        )}
      </YStack>

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
