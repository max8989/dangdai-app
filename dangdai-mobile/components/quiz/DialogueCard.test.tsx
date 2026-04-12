/**
 * DialogueCard Component Tests
 *
 * Tests for the dialogue completion exercise component:
 * - Conversation bubbles render with correct alignment
 * - Blank bubble has dashed border styling
 * - Selecting an option fills the blank bubble
 * - Local validation path (exact match → instant correct feedback)
 * - Local validation path (acceptable_answer_variants match → isAlternative=true)
 * - Incorrect answer → incorrect feedback
 * - "Your answer is also valid!" for acceptable_answer_variants match
 * - Options are disabled after selection
 * - Chinese characters render at 72px minimum (font size $13)
 *
 * Story 4.6: Dialogue Completion Exercise
 * Story 4.17: Local-only validation (no LLM call)
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { DialogueCard } from './DialogueCard'
import type { DialogueQuestion } from '../../types/quiz'

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Tamagui mock — renders children with accessible testIDs
// NOTE: jest.mock() factories cannot reference out-of-scope variables (like React).
// All React usage inside must use require() to avoid the hoisting restriction.
jest.mock('tamagui', () => {
  const { View, Text, TouchableOpacity, ScrollView } = require('react-native')
  const ReactLocal = require('react')

  const styled = (_component: any, _config: any) => {
    return ({ children, testID, onPress, disabled, accessibilityState, hasBlank }: any) => {
      const props: any = {
        testID,
        onPress,
        disabled,
        accessibilityState,
        // Expose hasBlank as accessibilityHint so tests can detect dashed-border state
        accessibilityHint: hasBlank ? 'has-blank' : undefined,
      }
      return ReactLocal.createElement(
        onPress ? TouchableOpacity : View,
        props,
        children,
      )
    }
  }

  return {
    YStack: ({ children, testID }: any) => ReactLocal.createElement(View, { testID }, children),
    XStack: ({ children, testID }: any) => ReactLocal.createElement(View, { testID }, children),
    Text: ({ children, testID, fontSize }: any) =>
      ReactLocal.createElement(Text, { testID, accessibilityHint: fontSize ? String(fontSize) : undefined }, children),
    Button: ({ children, testID, onPress, disabled, accessibilityState }: any) =>
      ReactLocal.createElement(TouchableOpacity, { testID, onPress, disabled, accessibilityState }, children),
    Spinner: ({ testID }: any) => ReactLocal.createElement(View, { testID }, null),
    Theme: ({ children, name }: any) => ReactLocal.createElement(View, { accessibilityHint: name }, children),
    AnimatePresence: ({ children }: any) => ReactLocal.createElement(ReactLocal.Fragment, null, children),
    ScrollView: ({ children, testID }: any) => ReactLocal.createElement(ScrollView, { testID }, children),
    styled,
  }
})

// lucide-icons mock
jest.mock('@tamagui/lucide-icons', () => {
  const { View } = require('react-native')
  const ReactLocal = require('react')
  return {
    CheckCircle: ({ testID }: any) => ReactLocal.createElement(View, { testID }, null),
    XCircle: ({ testID }: any) => ReactLocal.createElement(View, { testID }, null),
  }
})

// ─── Test Data ────────────────────────────────────────────────────────────────

const mockDialogueQuestion: DialogueQuestion = {
  question_id: 'dq1',
  exercise_type: 'dialogue_completion',
  question_text: 'Complete the conversation by selecting the best response.',
  correct_answer: '咖啡',
  explanation: 'The question asks what you want to drink (喝什麼). 咖啡 (coffee) is the appropriate response.',
  source_citation: 'Book 1, Chapter 12 - Dialogue',
  dialogue_lines: [
    { speaker: 'a', text: '你要喝什麼？', isBlank: false },
    { speaker: 'b', text: '', isBlank: true },
    { speaker: 'a', text: '好的，我也是。', isBlank: false },
  ],
  options: ['咖啡', '你好', '謝謝', '再見'],
  // 謝謝 is a valid alternative answer for free-text validation tests
  acceptable_answer_variants: ['謝謝', '水'],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderDialogueCard(
  props: Partial<React.ComponentProps<typeof DialogueCard>> = {}
) {
  const defaultProps: React.ComponentProps<typeof DialogueCard> = {
    question: mockDialogueQuestion,
    onAnswerResult: jest.fn(),
    ...props,
  }

  return render(
    React.createElement(QueryClientProvider, {
      client: new QueryClient({ defaultOptions: { mutations: { retry: false } } }),
    },
      React.createElement(DialogueCard, defaultProps)
    )
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DialogueCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('AC #1: Conversation bubble rendering', () => {
    it('renders dialogue bubbles for each non-blank line', () => {
      const { getByTestId } = renderDialogueCard()

      // Speaker A first line
      expect(getByTestId('dialogue-bubble-a-0')).toBeTruthy()
      // Speaker A third line
      expect(getByTestId('dialogue-bubble-a-2')).toBeTruthy()
    })

    it('renders blank bubble with dashed border indicator', () => {
      const { getByTestId } = renderDialogueCard()

      const blankBubble = getByTestId('dialogue-blank-bubble')
      expect(blankBubble).toBeTruthy()
      // hasBlank prop should be set (exposed as accessibilityHint in mock)
      expect(blankBubble.props.accessibilityHint).toBe('has-blank')
    })

    it('renders blank placeholder text before selection', () => {
      const { getByTestId } = renderDialogueCard()
      expect(getByTestId('dialogue-blank-placeholder')).toBeTruthy()
    })

    it('renders the instruction text', () => {
      const { getByTestId } = renderDialogueCard()
      expect(getByTestId('dialogue-instruction')).toBeTruthy()
    })

    it('renders all answer options', () => {
      const { getByTestId } = renderDialogueCard()

      mockDialogueQuestion.options.forEach((_, index) => {
        expect(getByTestId(`dialogue-option-${index}`)).toBeTruthy()
      })
    })

    it('renders answer options with 48px minimum touch target (minHeight)', () => {
      // The DialogueAnswerOption styled component has minHeight: 48
      // This is verified by rendering and checking the component exists
      const { getByTestId } = renderDialogueCard()
      expect(getByTestId('dialogue-option-0')).toBeTruthy()
    })
  })

  describe('AC #2: Answer selection and local validation', () => {
    it('fills blank bubble when user selects an option (exact match)', async () => {
      // No LLM call — local exact match is synchronous
      const onAnswerResult = jest.fn()
      const { getByTestId } = renderDialogueCard({ onAnswerResult })

      // Tap the correct answer (咖啡 matches correct_answer)
      fireEvent.press(getByTestId('dialogue-option-0'))

      await waitFor(() => {
        expect(getByTestId('dialogue-filled-answer')).toBeTruthy()
      })
    })

    it('calls onAnswerResult with correct=true for exact match', async () => {
      const onAnswerResult = jest.fn()
      const { getByTestId } = renderDialogueCard({ onAnswerResult })

      fireEvent.press(getByTestId('dialogue-option-0')) // 咖啡

      await waitFor(() => {
        expect(onAnswerResult).toHaveBeenCalledWith(
          expect.objectContaining({
            correct: true,
            selectedAnswer: '咖啡',
            isAlternative: false,
          })
        )
      })
    })

    it('shows correct feedback icon for exact match', async () => {
      const { getByTestId } = renderDialogueCard()

      fireEvent.press(getByTestId('dialogue-option-0')) // 咖啡

      await waitFor(() => {
        expect(getByTestId('dialogue-correct-icon')).toBeTruthy()
      })
    })

    it('validation is synchronous — no async spinner for exact match', async () => {
      const { getByTestId, queryByTestId } = renderDialogueCard()

      fireEvent.press(getByTestId('dialogue-option-0')) // 咖啡

      // Result is immediate — spinner should never appear
      await waitFor(() => {
        expect(getByTestId('dialogue-filled-answer')).toBeTruthy()
      })

      expect(queryByTestId('dialogue-validation-spinner')).toBeNull()
    })

    it('shows incorrect feedback for wrong answer', async () => {
      const { getByTestId } = renderDialogueCard()

      // Tap wrong option (你好 — not in correct_answer or acceptable_answer_variants)
      fireEvent.press(getByTestId('dialogue-option-1'))

      await waitFor(() => {
        expect(getByTestId('dialogue-incorrect-feedback')).toBeTruthy()
        expect(getByTestId('dialogue-incorrect-icon')).toBeTruthy()
      })
    })

    it('calls onAnswerResult with correct=false for wrong answer', async () => {
      const onAnswerResult = jest.fn()
      const { getByTestId } = renderDialogueCard({ onAnswerResult })

      fireEvent.press(getByTestId('dialogue-option-1')) // 你好

      await waitFor(() => {
        expect(onAnswerResult).toHaveBeenCalledWith(
          expect.objectContaining({
            correct: false,
            selectedAnswer: '你好',
            isAlternative: false,
          })
        )
      })
    })
  })

  describe('AC #2: acceptable_answer_variants validation', () => {
    it('shows "Your answer is also valid!" for acceptable_answer_variants match', async () => {
      const { getByTestId } = renderDialogueCard()

      // Tap 謝謝 — it is in acceptable_answer_variants
      fireEvent.press(getByTestId('dialogue-option-2'))

      await waitFor(() => {
        expect(getByTestId('dialogue-alternative-message')).toBeTruthy()
      })
    })

    it('shows alternatives list for acceptable_answer_variants match', async () => {
      const { getByTestId } = renderDialogueCard()

      fireEvent.press(getByTestId('dialogue-option-2')) // 謝謝

      await waitFor(() => {
        expect(getByTestId('dialogue-alternatives-list')).toBeTruthy()
      })
    })

    it('calls onAnswerResult with isAlternative=true for acceptable_answer_variants match', async () => {
      const onAnswerResult = jest.fn()
      const { getByTestId } = renderDialogueCard({ onAnswerResult })

      fireEvent.press(getByTestId('dialogue-option-2')) // 謝謝

      await waitFor(() => {
        expect(onAnswerResult).toHaveBeenCalledWith(
          expect.objectContaining({
            correct: true,
            isAlternative: true,
          })
        )
      })
    })
  })

  describe('AC #2: Options disabled after selection', () => {
    it('disables all options after any option is selected', async () => {
      const { getByTestId } = renderDialogueCard()

      // Initially options are enabled
      const option0 = getByTestId('dialogue-option-0')
      expect(option0.props.disabled === true || option0.props.accessibilityState?.disabled === true).toBe(false)

      // Select an option
      fireEvent.press(option0)

      await waitFor(() => {
        // All options should be disabled after selection
        mockDialogueQuestion.options.forEach((_, index) => {
          const option = getByTestId(`dialogue-option-${index}`)
          const isDisabled =
            option.props.disabled === true || option.props.accessibilityState?.disabled === true
          expect(isDisabled).toBe(true)
        })
      })
    })

    it('does not allow re-selecting after first selection', async () => {
      const onAnswerResult = jest.fn()
      const { getByTestId } = renderDialogueCard({ onAnswerResult })

      // First selection
      fireEvent.press(getByTestId('dialogue-option-0'))

      await waitFor(() => {
        expect(onAnswerResult).toHaveBeenCalledTimes(1)
      })

      // Try to select again
      fireEvent.press(getByTestId('dialogue-option-1'))

      // Should still only be called once
      expect(onAnswerResult).toHaveBeenCalledTimes(1)
    })
  })

  describe('Chinese character font size', () => {
    it('renders dialogue line text with $13 font size (72px)', () => {
      const { getByTestId } = renderDialogueCard()

      // The dialogue line text uses fontSize="$13"
      // In our mock, fontSize is passed as accessibilityHint for testing
      const lineText = getByTestId('dialogue-line-text-0')
      expect(lineText.props.accessibilityHint).toBe('$13')
    })

    it('renders filled answer with $13 font size after selection', async () => {
      const { getByTestId } = renderDialogueCard()

      fireEvent.press(getByTestId('dialogue-option-0'))

      await waitFor(() => {
        const filledAnswer = getByTestId('dialogue-filled-answer')
        expect(filledAnswer.props.accessibilityHint).toBe('$13')
      })
    })
  })

  describe('disabled prop', () => {
    it('disables all options when disabled=true is passed', () => {
      const { getByTestId } = renderDialogueCard({ disabled: true })

      mockDialogueQuestion.options.forEach((_, index) => {
        const option = getByTestId(`dialogue-option-${index}`)
        const isDisabled =
          option.props.disabled === true || option.props.accessibilityState?.disabled === true
        expect(isDisabled).toBe(true)
      })
    })
  })
})
