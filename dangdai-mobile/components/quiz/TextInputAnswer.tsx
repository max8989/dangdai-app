/**
 * TextInputAnswer Component
 * Story 4.12: Text Input Answer Type
 *
 * Text input component for typed quiz answers (pinyin or meaning).
 * Features:
 * - Tamagui Input with focus styling
 * - Submit button (disabled when empty)
 * - Enter key submission
 * - Keyboard dismissal on submit
 * - Read-only state after submission
 * - Correct answer reveal (incorrect only)
 * - Theme-based feedback (success/error border colors)
 */

import { useState, useCallback } from 'react'
import { Keyboard } from 'react-native'
import { YStack, XStack, Input, Button, Text, Theme, AnimatePresence } from 'tamagui'
import { Send } from '@tamagui/lucide-icons'
import { validateTextAnswer } from '../../lib/quizValidation'

export interface TextInputAnswerProps {
  /** Placeholder text (e.g., "Type the pinyin...", "Type the meaning...") */
  placeholder: string
  /** The correct answer for display after incorrect submission */
  correctAnswer: string
  /** Whether this is a pinyin question (affects normalization) */
  questionType: 'pinyin' | 'meaning'
  /** Called when user submits their answer */
  onSubmit: (userAnswer: string, isCorrect: boolean) => void
  /** Whether the component is in feedback state (after submission) */
  disabled?: boolean
}

export function TextInputAnswer({
  placeholder,
  correctAnswer,
  questionType,
  onSubmit,
  disabled = false,
}: TextInputAnswerProps) {
  const [userInput, setUserInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const handleSubmit = useCallback(() => {
    if (!userInput.trim() || submitted || disabled) return

    // Dismiss keyboard FIRST for smooth UX
    Keyboard.dismiss()

    // Validate the answer
    const correct = validateTextAnswer(userInput, correctAnswer, questionType)
    setSubmitted(true)
    setIsCorrect(correct)

    // Notify parent
    onSubmit(userInput, correct)
  }, [userInput, correctAnswer, questionType, onSubmit, submitted, disabled])

  const inputEditable = !submitted && !disabled

  return (
    <YStack gap="$3">
      {/* Text Input */}
      {submitted ? (
        <Theme name={isCorrect ? 'success' : 'error'}>
          <Input
            animation="quick"
            size="$5"
            minHeight={48}
            borderWidth={2}
            borderColor="$borderColor"
            placeholder={placeholder}
            placeholderTextColor="$placeholderColor"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            editable={false}
            value={userInput}
          />
        </Theme>
      ) : (
        <Input
          animation="quick"
          size="$5"
          minHeight={48}
          borderWidth={1}
          borderColor="$borderColor"
          focusStyle={{ borderColor: '$borderColorFocus', borderWidth: 2 }}
          placeholder={placeholder}
          placeholderTextColor="$placeholderColor"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          editable={inputEditable}
          value={userInput}
          onChangeText={setUserInput}
        />
      )}

      {/* Submit Button */}
      <XStack>
        <Button
          theme="primary"
          animation="quick"
          pressStyle={{ scale: 0.98 }}
          disabled={!userInput.trim() || submitted || disabled}
          opacity={!userInput.trim() || submitted || disabled ? 0.5 : 1}
          onPress={handleSubmit}
          icon={<Send size={18} />}
        >
          Submit
        </Button>
      </XStack>

      {/* Correct Answer Reveal (incorrect only) */}
      <AnimatePresence>
        {submitted && !isCorrect && (
          <YStack
            key="correct-answer"
            animation="medium"
            enterStyle={{ opacity: 0, y: -10 }}
            opacity={1}
            y={0}
            paddingTop="$2"
          >
            <Text color="$colorSubtle" fontSize="$3">
              Correct answer:
            </Text>
            <Text fontWeight="600" fontSize="$5" color="$success">
              {correctAnswer}
            </Text>
          </YStack>
        )}
      </AnimatePresence>
    </YStack>
  )
}
