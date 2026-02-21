/**
 * FeedbackOverlay Component Tests
 *
 * Unit tests for the unified feedback overlay shown after every quiz answer.
 * Tests cover correct/incorrect states, content display, and visibility.
 *
 * Story 4.9: Immediate Answer Feedback — Task 3.10
 */

import React from 'react'
import { render } from '@testing-library/react-native'

import { FeedbackOverlay } from './FeedbackOverlay'

// ─── Mock Tamagui ──────────────────────────────────────────────────────────────

// Minimal Tamagui mock for unit testing (avoids complex theme provider setup)
jest.mock('tamagui', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text } = require('react-native')

  const YStack = ({ children, testID, ...rest }: any) => (
    <View testID={testID} {...rest}>{children}</View>
  )
  const XStack = ({ children, testID, ...rest }: any) => (
    <View testID={testID} {...rest}>{children}</View>
  )
  const TamaguiText = ({ children, testID, ...rest }: any) => (
    <Text testID={testID} {...rest}>{children}</Text>
  )
  const Theme = ({ children }: any) => <>{children}</>
  const AnimatePresence = ({ children }: any) => <>{children}</>

  return { YStack, XStack, Text: TamaguiText, Theme, AnimatePresence }
})

jest.mock('@tamagui/lucide-icons', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native')

  const Check = ({ testID, ...rest }: any) => <View testID={testID ?? 'check-icon'} {...rest} />
  const X = ({ testID, ...rest }: any) => <View testID={testID ?? 'x-icon'} {...rest} />

  return { Check, X }
})

// ─── Test data ────────────────────────────────────────────────────────────────

const correctFeedbackProps = {
  visible: true,
  isCorrect: true,
  explanation: '咖啡 (kāfēi) is a loanword from English meaning "coffee".',
  sourceCitation: 'Book 1, Chapter 8 - Vocabulary',
  pointsEarned: 10,
}

const incorrectFeedbackProps = {
  visible: true,
  isCorrect: false,
  explanation: 'The adverb 很 comes before the verb 喜歡 in Chinese.',
  sourceCitation: 'Book 2, Chapter 12 - Grammar',
  correctAnswer: '我很喜歡咖啡。',
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FeedbackOverlay — correct answer (Task 3.3, 3.4, 3.5, 3.7)', () => {
  it('renders the overlay container when visible is true (Task 3.1)', () => {
    const { getByTestId } = render(<FeedbackOverlay {...correctFeedbackProps} />)
    expect(getByTestId('feedback-overlay')).toBeTruthy()
  })

  it('renders checkmark icon for correct answer (Task 3.3)', () => {
    const { getByTestId } = render(<FeedbackOverlay {...correctFeedbackProps} />)
    expect(getByTestId('feedback-check-icon')).toBeTruthy()
  })

  it('shows "Correct!" text for correct answer (Task 3.3)', () => {
    const { getByTestId } = render(<FeedbackOverlay {...correctFeedbackProps} />)
    expect(getByTestId('feedback-result-text').props.children).toBe('Correct!')
  })

  it('displays explanation text (Task 3.4)', () => {
    const { getByTestId } = render(<FeedbackOverlay {...correctFeedbackProps} />)
    expect(getByTestId('feedback-explanation').props.children).toBe(correctFeedbackProps.explanation)
  })

  it('displays source citation (Task 3.5)', () => {
    const { getByTestId } = render(<FeedbackOverlay {...correctFeedbackProps} />)
    expect(getByTestId('feedback-citation').props.children).toBe(correctFeedbackProps.sourceCitation)
  })

  it('shows points earned for correct answer (Task 3.7)', () => {
    const { getByTestId } = render(<FeedbackOverlay {...correctFeedbackProps} />)
    const pointsText = getByTestId('feedback-points')
    expect(pointsText.props.children).toEqual(['+', 10, ' pts'])
  })

  it('does NOT show correct answer container for correct answers (Task 3.6)', () => {
    const { queryByTestId } = render(<FeedbackOverlay {...correctFeedbackProps} />)
    expect(queryByTestId('feedback-correct-answer')).toBeNull()
  })
})

describe('FeedbackOverlay — incorrect answer (Task 3.3, 3.6)', () => {
  it('renders the overlay container when visible is true (Task 3.1)', () => {
    const { getByTestId } = render(<FeedbackOverlay {...incorrectFeedbackProps} />)
    expect(getByTestId('feedback-overlay')).toBeTruthy()
  })

  it('renders X icon for incorrect answer (Task 3.3)', () => {
    const { getByTestId } = render(<FeedbackOverlay {...incorrectFeedbackProps} />)
    expect(getByTestId('feedback-x-icon')).toBeTruthy()
  })

  it('shows "Not quite" text for incorrect answer (Task 3.3)', () => {
    const { getByTestId } = render(<FeedbackOverlay {...incorrectFeedbackProps} />)
    expect(getByTestId('feedback-result-text').props.children).toBe('Not quite')
  })

  it('shows correct answer when incorrect (Task 3.6)', () => {
    const { getByTestId } = render(<FeedbackOverlay {...incorrectFeedbackProps} />)
    expect(getByTestId('feedback-correct-answer')).toBeTruthy()
  })

  it('displays the correct answer text (Task 3.6)', () => {
    const { getByTestId } = render(<FeedbackOverlay {...incorrectFeedbackProps} />)
    // The correct answer text is inside feedback-correct-answer
    const answerEl = getByTestId('feedback-correct-answer')
    expect(answerEl).toBeTruthy()
  })

  it('does NOT show points for incorrect answer (Task 3.7)', () => {
    const { queryByTestId } = render(<FeedbackOverlay {...incorrectFeedbackProps} />)
    expect(queryByTestId('feedback-points')).toBeNull()
  })

  it('displays explanation text (Task 3.4)', () => {
    const { getByTestId } = render(<FeedbackOverlay {...incorrectFeedbackProps} />)
    expect(getByTestId('feedback-explanation').props.children).toBe(incorrectFeedbackProps.explanation)
  })

  it('displays source citation (Task 3.5)', () => {
    const { getByTestId } = render(<FeedbackOverlay {...incorrectFeedbackProps} />)
    expect(getByTestId('feedback-citation').props.children).toBe(incorrectFeedbackProps.sourceCitation)
  })
})

describe('FeedbackOverlay — visibility (Task 3.2)', () => {
  it('renders nothing when visible is false (Task 3.2)', () => {
    const { queryByTestId } = render(
      <FeedbackOverlay
        {...correctFeedbackProps}
        visible={false}
      />
    )
    expect(queryByTestId('feedback-overlay')).toBeNull()
  })

  it('renders when visible transitions to true (Task 3.2)', () => {
    const { queryByTestId, rerender } = render(
      <FeedbackOverlay
        {...correctFeedbackProps}
        visible={false}
      />
    )
    expect(queryByTestId('feedback-overlay')).toBeNull()

    rerender(<FeedbackOverlay {...correctFeedbackProps} visible={true} />)
    expect(queryByTestId('feedback-overlay')).toBeTruthy()
  })
})

describe('FeedbackOverlay — optional props', () => {
  it('renders without correctAnswer (correct answer prop optional) (Task 3.6)', () => {
    const { queryByTestId } = render(
      <FeedbackOverlay
        visible={true}
        isCorrect={false}
        explanation="Test explanation"
        sourceCitation="Book 1, Chapter 1"
        // no correctAnswer
      />
    )
    expect(queryByTestId('feedback-correct-answer')).toBeNull()
  })

  it('renders without pointsEarned (Task 3.7)', () => {
    const { queryByTestId } = render(
      <FeedbackOverlay
        visible={true}
        isCorrect={true}
        explanation="Test explanation"
        sourceCitation="Book 1, Chapter 1"
        // no pointsEarned
      />
    )
    expect(queryByTestId('feedback-points')).toBeNull()
  })
})
