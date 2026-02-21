/**
 * FillInBlankSentence Component Tests
 *
 * Co-located unit tests for the FillInBlankSentence component.
 * Tests sentence parsing, blank rendering, word filling, and feedback states.
 *
 * Story 4.4: Fill-in-the-Blank Exercise (Word Bank)
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'

// Mock Tamagui before importing the component
jest.mock('tamagui', () => {
  const { View, Text, TouchableOpacity } = require('react-native')

  return {
    Button: ({ children, onPress, testID, disabled, accessibilityState, ...rest }: any) => (
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        disabled={disabled}
        accessibilityState={accessibilityState}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    ),
    XStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    YStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    Text: ({ children, testID, ...rest }: any) => (
      <Text testID={testID} {...rest}>
        {children}
      </Text>
    ),
    styled: (_component: any, _config: any) => {
      const Mock = ({ children, testID, onPress, disabled, accessibilityState, state, ...rest }: any) => (
        <TouchableOpacity
          testID={testID}
          onPress={onPress}
          disabled={disabled ?? false}
          accessibilityState={accessibilityState}
          accessibilityHint={state}
          {...rest}
        >
          {children}
        </TouchableOpacity>
      )
      return Mock
    },
    Theme: ({ children, name }: any) => <View accessibilityLabel={name}>{children}</View>,
    AnimatePresence: ({ children }: any) => <>{children}</>,
  }
})

import { FillInBlankSentence } from './FillInBlankSentence'

// Sentence with 2 blanks: "我___去___買東西。"
const SENTENCE_2_BLANKS = '我___去___買東西。'
// Sentence with 1 blank: "我很___吃中國菜。"
const SENTENCE_1_BLANK = '我很___吃中國菜。'

describe('FillInBlankSentence', () => {
  const mockOnBlankTap = jest.fn()

  beforeEach(() => {
    mockOnBlankTap.mockClear()
  })

  // AC #1: Parses sentence and renders correct number of blanks
  describe('sentence parsing', () => {
    it('renders the correct number of blank slots for 2 blanks', () => {
      const { getByTestId } = render(
        <FillInBlankSentence
          sentenceWithBlanks={SENTENCE_2_BLANKS}
          filledBlanks={{}}
          onBlankTap={mockOnBlankTap}
          testID="fill-sentence"
        />
      )

      expect(getByTestId('blank-slot-0')).toBeTruthy()
      expect(getByTestId('blank-slot-1')).toBeTruthy()
    })

    it('renders the correct number of blank slots for 1 blank', () => {
      const { getByTestId } = render(
        <FillInBlankSentence
          sentenceWithBlanks={SENTENCE_1_BLANK}
          filledBlanks={{}}
          onBlankTap={mockOnBlankTap}
          testID="fill-sentence"
        />
      )

      expect(getByTestId('blank-slot-0')).toBeTruthy()
    })

    it('renders text segments between blanks', () => {
      const { getByText } = render(
        <FillInBlankSentence
          sentenceWithBlanks={SENTENCE_2_BLANKS}
          filledBlanks={{}}
          onBlankTap={mockOnBlankTap}
          testID="fill-sentence"
        />
      )

      // Should render the text segment "我" before the first blank
      expect(getByText('我')).toBeTruthy()
    })

    it('renders the container', () => {
      const { getByTestId } = render(
        <FillInBlankSentence
          sentenceWithBlanks={SENTENCE_2_BLANKS}
          filledBlanks={{}}
          onBlankTap={mockOnBlankTap}
          testID="fill-sentence"
        />
      )

      expect(getByTestId('fill-sentence')).toBeTruthy()
    })
  })

  // AC #1: empty blanks show dashed border (empty state)
  describe('empty blank slots', () => {
    it('renders blank slots in empty state when not filled', () => {
      const { getByTestId } = render(
        <FillInBlankSentence
          sentenceWithBlanks={SENTENCE_2_BLANKS}
          filledBlanks={{}}
          onBlankTap={mockOnBlankTap}
          testID="fill-sentence"
        />
      )

      const blankSlot = getByTestId('blank-slot-0')
      // Empty slots have 'empty' state
      expect(blankSlot.props.accessibilityHint).toBe('empty')
    })
  })

  // AC #2: filling a blank displays the word
  describe('filled blank slots', () => {
    it('displays the filled word in the blank slot', () => {
      const { getByText } = render(
        <FillInBlankSentence
          sentenceWithBlanks={SENTENCE_2_BLANKS}
          filledBlanks={{ 0: '想' }}
          onBlankTap={mockOnBlankTap}
          testID="fill-sentence"
        />
      )

      expect(getByText('想')).toBeTruthy()
    })

    it('renders filled blank in filled state', () => {
      const { getByTestId } = render(
        <FillInBlankSentence
          sentenceWithBlanks={SENTENCE_2_BLANKS}
          filledBlanks={{ 0: '想' }}
          onBlankTap={mockOnBlankTap}
          testID="fill-sentence"
        />
      )

      const blankSlot = getByTestId('blank-slot-0')
      expect(blankSlot.props.accessibilityHint).toBe('filled')
    })

    it('calls onBlankTap with the blank index when a filled blank is tapped', () => {
      const { getByTestId } = render(
        <FillInBlankSentence
          sentenceWithBlanks={SENTENCE_2_BLANKS}
          filledBlanks={{ 0: '想' }}
          onBlankTap={mockOnBlankTap}
          testID="fill-sentence"
        />
      )

      fireEvent.press(getByTestId('blank-slot-0'))
      expect(mockOnBlankTap).toHaveBeenCalledWith(0)
    })

    it('does not call onBlankTap when an empty blank is tapped', () => {
      const { getByTestId } = render(
        <FillInBlankSentence
          sentenceWithBlanks={SENTENCE_2_BLANKS}
          filledBlanks={{}}
          onBlankTap={mockOnBlankTap}
          testID="fill-sentence"
        />
      )

      fireEvent.press(getByTestId('blank-slot-0'))
      expect(mockOnBlankTap).not.toHaveBeenCalled()
    })
  })

  // AC #3: per-blank feedback after validation
  describe('validation feedback', () => {
    it('renders correct blank in correct state', () => {
      const { getByTestId } = render(
        <FillInBlankSentence
          sentenceWithBlanks={SENTENCE_2_BLANKS}
          filledBlanks={{ 0: '想' }}
          blankFeedback={{ 0: 'correct' }}
          onBlankTap={mockOnBlankTap}
          testID="fill-sentence"
        />
      )

      const blankSlot = getByTestId('blank-slot-0')
      expect(blankSlot.props.accessibilityHint).toBe('correct')
    })

    it('renders incorrect blank in incorrect state', () => {
      const { getByTestId } = render(
        <FillInBlankSentence
          sentenceWithBlanks={SENTENCE_2_BLANKS}
          filledBlanks={{ 0: '要' }}
          blankFeedback={{ 0: 'incorrect' }}
          onBlankTap={mockOnBlankTap}
          testID="fill-sentence"
        />
      )

      const blankSlot = getByTestId('blank-slot-0')
      expect(blankSlot.props.accessibilityHint).toBe('incorrect')
    })

    it('shows incorrect state for a blank missing from blankFeedback when feedback is present (M2 fix)', () => {
      // blankFeedback provided for index 0 only; index 1 is filled but has no feedback key
      const { getByTestId } = render(
        <FillInBlankSentence
          sentenceWithBlanks={SENTENCE_2_BLANKS}
          filledBlanks={{ 0: '想', 1: '要' }}
          blankFeedback={{ 0: 'correct' }} // index 1 deliberately missing
          onBlankTap={mockOnBlankTap}
          testID="fill-sentence"
        />
      )

      // Index 1 has a word but no feedback key — should show 'incorrect' not 'filled'
      const blankSlot = getByTestId('blank-slot-1')
      expect(blankSlot.props.accessibilityHint).toBe('incorrect')
    })

    it('does not call onBlankTap when disabled', () => {
      const { getByTestId } = render(
        <FillInBlankSentence
          sentenceWithBlanks={SENTENCE_2_BLANKS}
          filledBlanks={{ 0: '想' }}
          onBlankTap={mockOnBlankTap}
          disabled={true}
          testID="fill-sentence"
        />
      )

      fireEvent.press(getByTestId('blank-slot-0'))
      expect(mockOnBlankTap).not.toHaveBeenCalled()
    })
  })
})
