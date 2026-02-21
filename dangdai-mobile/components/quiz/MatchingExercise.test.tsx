/**
 * MatchingExercise Component Tests
 *
 * Co-located unit tests for the MatchingExercise component.
 * Tests two-column rendering, tap-to-pair interaction, correct/incorrect pair
 * feedback, matched state non-interactivity, progress indicator, and completion.
 *
 * Story 4.5: Matching Exercise (Tap-to-Pair)
 */

import React from 'react'
import { render, fireEvent, act } from '@testing-library/react-native'

// Mock useQuizStore — MatchingExercise now calls addMatchedPairScore / addIncorrectMatchingAttempt
jest.mock('../../stores/useQuizStore', () => ({
  useQuizStore: (selector: (state: any) => any) =>
    selector({
      addMatchedPairScore: jest.fn(),
      addIncorrectMatchingAttempt: jest.fn(),
    }),
}))

// Mock Tamagui before importing the component
jest.mock('tamagui', () => {
  const { View, Text, TouchableOpacity } = require('react-native')

  return {
    Button: ({ children, onPress, testID, disabled, accessibilityState, accessibilityLabel, ...rest }: any) => (
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        disabled={disabled}
        accessibilityState={accessibilityState}
        accessibilityLabel={accessibilityLabel}
      >
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
    XStack: ({ children, testID, ...rest }: any) => <View testID={testID}>{children}</View>,
    YStack: ({ children, testID, ...rest }: any) => <View testID={testID}>{children}</View>,
    Text: ({ children, testID, fontSize }: any) => (
      <Text testID={testID} accessibilityHint={fontSize ? String(fontSize) : undefined}>
        {children}
      </Text>
    ),
    styled: (_component: any, _config: any) => {
      // Forward state as accessibilityHint so tests can assert visual state.
      // Forward x as a prop for shake animation assertions.
      // disabled is forwarded as both the disabled prop AND in accessibilityState.
      const Mock = ({
        children,
        testID,
        onPress,
        disabled,
        accessibilityState,
        accessibilityLabel,
        state,
        x,
      }: any) => {
        const isDisabled = disabled === true
        return (
          <TouchableOpacity
            testID={testID}
            onPress={!isDisabled ? onPress : undefined}
            disabled={isDisabled}
            accessibilityState={{ ...(accessibilityState ?? {}), disabled: isDisabled }}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={state}
            accessibilityValue={{ text: String(x ?? 0) }}
          >
            <Text>{children}</Text>
          </TouchableOpacity>
        )
      }
      return Mock
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    Theme: ({ children }: any) => <>{children}</>,
  }
})

import { MatchingExercise, validateMatchingPair, calculateMatchingScore } from './MatchingExercise'
import type { QuizQuestion } from '../../types/quiz'

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockMatchingQuestion: QuizQuestion = {
  question_id: 'match-1',
  exercise_type: 'matching',
  question_text: 'Match the characters with their pinyin',
  correct_answer: '',
  explanation: 'Practice character-pinyin recognition from Chapter 12 vocabulary.',
  source_citation: 'Book 2, Chapter 12 - Vocabulary',
  pairs: [
    { left: '她', right: 'tā' },
    { left: '喜歡', right: 'xǐhuān' },
    { left: '咖啡', right: 'kāfēi' },
    { left: '吃', right: 'chī' },
    { left: '學生', right: 'xuéshēng' },
    { left: '老師', right: 'lǎoshī' },
  ],
  left_items: ['她', '咖啡', '喜歡', '吃', '學生', '老師'],
  right_items: ['kāfēi', 'tā', 'chī', 'xǐhuān', 'lǎoshī', 'xuéshēng'],
}

// Single-pair question for edge case tests
const mockSinglePairQuestion: QuizQuestion = {
  question_id: 'match-single',
  exercise_type: 'matching',
  question_text: 'Match the pair',
  correct_answer: '',
  explanation: 'Single pair test',
  source_citation: 'Test',
  pairs: [{ left: '她', right: 'tā' }],
  left_items: ['她'],
  right_items: ['tā'],
}

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Find the left item at the given index using testID pattern.
 * left_items are rendered in order: left-item-0, left-item-1, etc.
 */
function getLeftItem(getByTestId: ReturnType<typeof render>['getByTestId'], index: number) {
  return getByTestId(`left-item-${index}`)
}

function getRightItem(getByTestId: ReturnType<typeof render>['getByTestId'], index: number) {
  return getByTestId(`right-item-${index}`)
}

// ─── Pure function unit tests ─────────────────────────────────────────────────

describe('validateMatchingPair (pure function)', () => {
  const pairs = mockMatchingQuestion.pairs!

  it('returns true for a correct pair', () => {
    expect(validateMatchingPair('她', 'tā', pairs)).toBe(true)
  })

  it('returns false for an incorrect pair', () => {
    expect(validateMatchingPair('她', 'kāfēi', pairs)).toBe(false)
  })

  it('returns false when left item does not exist', () => {
    expect(validateMatchingPair('unknown', 'tā', pairs)).toBe(false)
  })

  it('returns false when right item does not exist', () => {
    expect(validateMatchingPair('她', 'unknown', pairs)).toBe(false)
  })

  it('returns false for empty pairs array', () => {
    expect(validateMatchingPair('她', 'tā', [])).toBe(false)
  })
})

describe('calculateMatchingScore (pure function)', () => {
  it('returns 100 for 6/6 with 0 incorrect', () => {
    expect(calculateMatchingScore(6, 6, 0)).toBe(100)
  })

  it('applies -5% penalty per incorrect attempt', () => {
    expect(calculateMatchingScore(6, 6, 2)).toBe(90)
  })

  it('never goes below 0', () => {
    expect(calculateMatchingScore(6, 6, 30)).toBe(0)
  })

  it('handles totalPairs of 0 (no division by zero)', () => {
    expect(calculateMatchingScore(0, 0, 0)).toBe(0)
  })

  it('returns 50 for 3/6 correct with 0 incorrect', () => {
    expect(calculateMatchingScore(3, 6, 0)).toBe(50)
  })
})

// ─── Component tests ──────────────────────────────────────────────────────────

describe('MatchingExercise', () => {
  let mockOnComplete: jest.Mock

  beforeEach(() => {
    mockOnComplete = jest.fn()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  // 3.2: Test: renders two columns with correct number of items
  describe('rendering', () => {
    it('renders the matching exercise container', () => {
      const { getByTestId } = render(
        <MatchingExercise
          question={mockMatchingQuestion}
          onComplete={mockOnComplete}
          testID="matching-exercise"
        />
      )
      expect(getByTestId('matching-exercise')).toBeTruthy()
    })

    it('renders 6 left items and 6 right items', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      for (let i = 0; i < 6; i++) {
        expect(getByTestId(`left-item-${i}`)).toBeTruthy()
        expect(getByTestId(`right-item-${i}`)).toBeTruthy()
      }
    })

    // 3.9: Test: Chinese characters render at 72px minimum (AC #1)
    it('renders Chinese characters at 72px minimum font size', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      // left_items[0] = '她' — Chinese character → must render at 72px (AC #1)
      // The mock Text component forwards fontSize via accessibilityHint
      const leftText0 = getByTestId('left-item-text-0')
      expect(leftText0.props.accessibilityHint).toBe('72')
    })

    it('renders non-Chinese text at 16px (right column pinyin)', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      // right_items[0] = 'kāfēi' — Latin pinyin → 16px
      const rightText0 = getByTestId('right-item-text-0')
      expect(rightText0.props.accessibilityHint).toBe('16')
    })

    // 3.10: Test: progress indicator shows correct "X/Y paired" count
    it('shows progress indicator "0/6 paired" initially', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      const progressText = getByTestId('matching-progress-text')
      // children is an array like [0, "/", 6, " paired"] — check array elements
      const children = progressText.props.children
      const flat = Array.isArray(children) ? children : [children]
      expect(flat).toContain(0)  // matched count
      expect(flat).toContain(6)  // total pairs
    })

    it('renders all 6 rows', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      for (let i = 0; i < 6; i++) {
        expect(getByTestId(`matching-row-${i}`)).toBeTruthy()
      }
    })
  })

  // 3.3: Test: tapping left item highlights it (selected state)
  describe('left item selection', () => {
    it('tapping a left item sets it to selected state', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      const leftItem = getLeftItem(getByTestId, 0) // '她'
      fireEvent.press(leftItem)

      // After tap, item should be in 'selected' state (accessibilityHint = 'selected')
      expect(leftItem.props.accessibilityHint).toBe('selected')
    })

    it('tapping another left item switches selection', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      const leftItem0 = getLeftItem(getByTestId, 0)
      const leftItem1 = getLeftItem(getByTestId, 1)

      fireEvent.press(leftItem0) // select '她'
      fireEvent.press(leftItem1) // switch to '咖啡'

      expect(leftItem0.props.accessibilityHint).toBe('default')
      expect(leftItem1.props.accessibilityHint).toBe('selected')
    })

    it('tapping right column without selecting left first is a no-op', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      const rightItem = getRightItem(getByTestId, 0) // 'kāfēi' (maps to row 0)
      fireEvent.press(rightItem) // should be no-op

      // No completion callback should fire
      expect(mockOnComplete).not.toHaveBeenCalled()
    })
  })

  // 3.4 + 3.5: Test: correct pair transitions to matched state
  describe('correct pair matching', () => {
    it('correct pair: both items transition to matched state', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      // left_items[0] = '她', right_items[1] = 'tā' (the correct pair is 她↔tā)
      const leftItem = getLeftItem(getByTestId, 0) // '她'
      fireEvent.press(leftItem)

      // right_items = ['kāfēi', 'tā', 'chī', 'xǐhuān', 'lǎoshī', 'xuéshēng']
      // 'tā' is at right index 1
      const rightItemWithTa = getByTestId('right-item-1') // 'tā'
      fireEvent.press(rightItemWithTa)

      // Both should now be in 'matched' state
      expect(leftItem.props.accessibilityHint).toBe('matched')
      expect(rightItemWithTa.props.accessibilityHint).toBe('matched')
    })

    it('correct pair: progress updates to "1/6 paired"', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      // Match '她' ↔ 'tā'
      const leftItem = getLeftItem(getByTestId, 0) // '她'
      fireEvent.press(leftItem)
      const rightItem = getByTestId('right-item-1') // 'tā'
      fireEvent.press(rightItem)

      const progressText = getByTestId('matching-progress-text')
      const flat = Array.isArray(progressText.props.children)
        ? progressText.props.children
        : [progressText.props.children]
      expect(flat).toContain(1)  // 1 matched
      expect(flat).toContain(6)  // total pairs
    })

    // 3.8: Test: matched items are non-interactive
    it('matched items are disabled (non-interactive)', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      // Match '她' ↔ 'tā'
      fireEvent.press(getByTestId('left-item-0')) // '她'
      fireEvent.press(getByTestId('right-item-1')) // 'tā'

      // Re-query after state change to get updated props
      const leftItemAfter = getByTestId('left-item-0')
      const rightItemAfter = getByTestId('right-item-1')

      // Matched items should be disabled
      const leftDisabled = leftItemAfter.props.disabled === true ||
        leftItemAfter.props.accessibilityState?.disabled === true
      const rightDisabled = rightItemAfter.props.disabled === true ||
        rightItemAfter.props.accessibilityState?.disabled === true

      expect(leftDisabled).toBe(true)
      expect(rightDisabled).toBe(true)
    })

    it('connection line appears after correct match', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      // Match '她' ↔ 'tā'
      const leftItem = getLeftItem(getByTestId, 0)
      fireEvent.press(leftItem)
      const rightItem = getByTestId('right-item-1')
      fireEvent.press(rightItem)

      // Connection line should now exist for row 0
      expect(getByTestId('connection-line-0')).toBeTruthy()
    })
  })

  // 3.6: Test: incorrect pair resets selection
  describe('incorrect pair', () => {
    it('incorrect pair: both items flash error state', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      // left_items[0] = '她', right_items[0] = 'kāfēi' → INCORRECT pair
      const leftItem = getLeftItem(getByTestId, 0) // '她'
      fireEvent.press(leftItem)
      const rightItem = getByTestId('right-item-0') // 'kāfēi'
      fireEvent.press(rightItem)

      // Both should be in 'incorrect' state during flash
      expect(leftItem.props.accessibilityHint).toBe('incorrect')
      expect(rightItem.props.accessibilityHint).toBe('incorrect')
    })

    it('incorrect pair: selection resets after 500ms', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      const leftItem = getLeftItem(getByTestId, 0) // '她'
      fireEvent.press(leftItem)
      const rightItem = getByTestId('right-item-0') // 'kāfēi' — incorrect
      fireEvent.press(rightItem)

      // Items are in error state
      expect(leftItem.props.accessibilityHint).toBe('incorrect')

      // Advance timer 500ms
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // Selection is reset — left item returns to default state
      expect(leftItem.props.accessibilityHint).toBe('default')
    })

    it('incorrect pair does NOT add to matched pairs', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      const leftItem = getLeftItem(getByTestId, 0) // '她'
      fireEvent.press(leftItem)
      const rightItem = getByTestId('right-item-0') // 'kāfēi' — incorrect
      fireEvent.press(rightItem)

      // Progress should still be 0/6
      const progressText = getByTestId('matching-progress-text')
      const flat = Array.isArray(progressText.props.children)
        ? progressText.props.children
        : [progressText.props.children]
      expect(flat).toContain(0)  // still 0 matched
    })

    it('incorrect pair does NOT call onComplete', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      const leftItem = getLeftItem(getByTestId, 0) // '她'
      fireEvent.press(leftItem)
      const rightItem = getByTestId('right-item-0') // 'kāfēi' — incorrect
      fireEvent.press(rightItem)

      expect(mockOnComplete).not.toHaveBeenCalled()
    })
  })

  // 3.7: Test: all pairs matched triggers completion callback with score
  describe('completion', () => {
    /**
     * Match all 6 pairs in the mock question:
     * left_items:  ['她', '咖啡', '喜歡', '吃', '學生', '老師']
     * right_items: ['kāfēi', 'tā', 'chī', 'xǐhuān', 'lǎoshī', 'xuéshēng']
     * pairs: 她↔tā, 喜歡↔xǐhuān, 咖啡↔kāfēi, 吃↔chī, 學生↔xuéshēng, 老師↔lǎoshī
     */
    function matchAllPairs(getByTestId: ReturnType<typeof render>['getByTestId']) {
      // Match 她 (left[0]) ↔ tā (right[1])
      fireEvent.press(getByTestId('left-item-0'))
      fireEvent.press(getByTestId('right-item-1'))

      // Match 咖啡 (left[1]) ↔ kāfēi (right[0])
      fireEvent.press(getByTestId('left-item-1'))
      fireEvent.press(getByTestId('right-item-0'))

      // Match 喜歡 (left[2]) ↔ xǐhuān (right[3])
      fireEvent.press(getByTestId('left-item-2'))
      fireEvent.press(getByTestId('right-item-3'))

      // Match 吃 (left[3]) ↔ chī (right[2])
      fireEvent.press(getByTestId('left-item-3'))
      fireEvent.press(getByTestId('right-item-2'))

      // Match 學生 (left[4]) ↔ xuéshēng (right[5])
      fireEvent.press(getByTestId('left-item-4'))
      fireEvent.press(getByTestId('right-item-5'))

      // Match 老師 (left[5]) ↔ lǎoshī (right[4])
      fireEvent.press(getByTestId('left-item-5'))
      fireEvent.press(getByTestId('right-item-4'))
    }

    it('calls onComplete when all pairs are matched', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      matchAllPairs(getByTestId)

      expect(mockOnComplete).toHaveBeenCalledTimes(1)
    })

    it('calls onComplete with score=100 when all correct, 0 incorrect attempts', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      matchAllPairs(getByTestId)

      expect(mockOnComplete).toHaveBeenCalledWith({
        score: 100,
        incorrectAttempts: 0,
      })
    })

    it('score is reduced by incorrect attempts', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      // Make 2 incorrect attempts on 她 first
      fireEvent.press(getByTestId('left-item-0')) // select 她
      fireEvent.press(getByTestId('right-item-0')) // kāfēi — wrong
      act(() => { jest.advanceTimersByTime(500) }) // reset

      fireEvent.press(getByTestId('left-item-0')) // select 她 again
      fireEvent.press(getByTestId('right-item-2')) // chī — wrong
      act(() => { jest.advanceTimersByTime(500) }) // reset

      // Now match correctly
      matchAllPairs(getByTestId)

      // Should have been called once with a reduced score
      expect(mockOnComplete).toHaveBeenCalledTimes(1)
      const callArgs = mockOnComplete.mock.calls[0][0]
      expect(callArgs.incorrectAttempts).toBe(2)
      expect(callArgs.score).toBe(90) // 100 - 2*5
    })

    it('onComplete is called only once even if state updates fire multiple times', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      matchAllPairs(getByTestId)

      // onComplete fires from useEffect watching matchedPairs.size === totalPairs
      expect(mockOnComplete.mock.calls.length).toBe(1)
    })
  })

  // 3.8: Test: matched items are non-interactive (cannot be re-tapped)
  describe('matched items non-interactive', () => {
    it('matched left item does not change state when tapped again', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockMatchingQuestion} onComplete={mockOnComplete} />
      )

      // Match 她 ↔ tā
      const leftItem = getLeftItem(getByTestId, 0)
      fireEvent.press(leftItem)
      fireEvent.press(getByTestId('right-item-1')) // tā

      // Verify matched
      expect(leftItem.props.accessibilityHint).toBe('matched')

      // Tap the matched item — should remain matched (disabled=true prevents this)
      fireEvent.press(leftItem)
      expect(leftItem.props.accessibilityHint).toBe('matched')
    })
  })

  // Edge case: single pair exercise
  describe('single pair exercise', () => {
    it('completes immediately after matching the only pair', () => {
      const { getByTestId } = render(
        <MatchingExercise question={mockSinglePairQuestion} onComplete={mockOnComplete} />
      )

      fireEvent.press(getByTestId('left-item-0')) // 她
      fireEvent.press(getByTestId('right-item-0')) // tā

      expect(mockOnComplete).toHaveBeenCalledWith({ score: 100, incorrectAttempts: 0 })
    })
  })
})
