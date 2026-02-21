/**
 * WordBankSelector Component Tests
 *
 * Co-located unit tests for the WordBankSelector component.
 * Tests horizontal word bank rendering, word selection, used/feedback states.
 *
 * Story 4.4: Fill-in-the-Blank Exercise (Word Bank)
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'

// Mock Tamagui before importing the component
jest.mock('tamagui', () => {
  const { View, Text, TouchableOpacity, ScrollView } = require('react-native')

  return {
    Button: ({ children, onPress, testID, disabled, accessibilityState, ...rest }: any) => (
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        disabled={disabled}
        accessibilityState={accessibilityState}
        {...rest}
      >
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
    XStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    YStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    Text: ({ children, testID }: any) => <Text testID={testID}>{children}</Text>,
    ScrollView: ({ children, testID, horizontal }: any) => (
      <ScrollView testID={testID} horizontal={horizontal}>{children}</ScrollView>
    ),
    styled: (_component: any, _config: any) => {
      // Explicitly extract all known props to prevent ...rest overriding them.
      // Forward `state` as `accessibilityHint` so tests can assert visual state (M5 fix).
      const Mock = ({ children, testID, onPress, disabled, accessibilityState, opacity, state }: any) => (
        <TouchableOpacity
          testID={testID}
          onPress={onPress}
          disabled={disabled ?? false}
          accessibilityState={accessibilityState}
          accessibilityHint={state}
          style={{ opacity }}
        >
          <Text>{children}</Text>
        </TouchableOpacity>
      )
      return Mock
    },
    Theme: ({ children }: any) => <>{children}</>,
  }
})

import { WordBankSelector } from './WordBankSelector'

const MOCK_WORDS = ['想', '要', '超市', '商店', '會']

describe('WordBankSelector', () => {
  const mockOnWordSelect = jest.fn()

  beforeEach(() => {
    mockOnWordSelect.mockClear()
  })

  // AC #1: renders all word options with correct touch targets
  describe('rendering', () => {
    it('renders all word options', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedIndices={new Set()}
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      MOCK_WORDS.forEach((_, index) => {
        expect(getByTestId(`word-bank-item-${index}`)).toBeTruthy()
      })
    })

    it('renders each word text correctly', () => {
      const { getByText } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedIndices={new Set()}
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      MOCK_WORDS.forEach((word) => {
        expect(getByText(word)).toBeTruthy()
      })
    })

    it('renders the word bank container', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedIndices={new Set()}
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      expect(getByTestId('word-bank')).toBeTruthy()
    })
  })

  // AC #2: tapping a word calls onWordSelect with word value and index
  describe('word selection', () => {
    it('calls onWordSelect with the word and its index when tapped', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedIndices={new Set()}
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      fireEvent.press(getByTestId('word-bank-item-0'))
      expect(mockOnWordSelect).toHaveBeenCalledWith('想', 0)
    })

    it('calls onWordSelect with the correct word and index for each position', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedIndices={new Set()}
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      fireEvent.press(getByTestId('word-bank-item-2'))
      expect(mockOnWordSelect).toHaveBeenCalledWith('超市', 2)
    })

    it('correctly handles duplicate words — each index is independently selectable', () => {
      // Two identical words at index 0 and 1
      const { getByTestId } = render(
        <WordBankSelector
          words={['的', '的', '他']}
          usedIndices={new Set([0])} // index 0 is used
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      // Index 1 (same word '的') should still be available and tappable
      const secondDe = getByTestId('word-bank-item-1')
      expect(secondDe.props.disabled).toBeFalsy()
      fireEvent.press(secondDe)
      expect(mockOnWordSelect).toHaveBeenCalledWith('的', 1)
    })
  })

  // AC #2: used indices are visually marked (opacity 0.4) and not tappable
  describe('used words state', () => {
    it('does not call onWordSelect when a used index is tapped', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedIndices={new Set([0])} // index 0 ('想') is used
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      fireEvent.press(getByTestId('word-bank-item-0'))
      expect(mockOnWordSelect).not.toHaveBeenCalled()
    })

    it('renders used index item as disabled', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedIndices={new Set([0])} // index 0 used
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      const usedItem = getByTestId('word-bank-item-0')
      expect(
        usedItem.props.disabled === true ||
        usedItem.props.accessibilityState?.disabled === true
      ).toBe(true)
    })

    it('renders non-used index items as enabled', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedIndices={new Set([0])} // only index 0 used
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      const availableItem = getByTestId('word-bank-item-1')
      expect(availableItem.props.disabled).toBeFalsy()
    })

    it('only marks the specific index as used, not other items with the same word value', () => {
      // Duplicate words: '的' at index 0 and 1
      const { getByTestId } = render(
        <WordBankSelector
          words={['的', '的', '他']}
          usedIndices={new Set([0])} // only index 0 is used
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      // Index 0 is used → disabled (check either disabled prop or accessibilityState)
      const usedItem = getByTestId('word-bank-item-0')
      expect(
        usedItem.props.disabled === true ||
        usedItem.props.accessibilityState?.disabled === true
      ).toBe(true)
      // Index 1 has the same word '的' but is NOT used → still enabled
      expect(getByTestId('word-bank-item-1').props.disabled).toBeFalsy()
    })
  })

  // AC #3: correct/incorrect feedback states after validation (M5 fix — assert state, not just existence)
  describe('feedback states', () => {
    it('renders correct feedback state (correct) via accessibilityHint on word bank item', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedIndices={new Set([0])} // index 0 ('想') is used
          feedbackState={{ 0: 'correct' }}
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      // The styled mock passes `state` as accessibilityHint
      const item = getByTestId('word-bank-item-0')
      expect(item.props.accessibilityHint).toBe('correct')
    })

    it('renders incorrect feedback state via accessibilityHint on word bank item', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedIndices={new Set([2])} // index 2 ('超市') is used
          feedbackState={{ 2: 'incorrect' }}
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      const item = getByTestId('word-bank-item-2')
      expect(item.props.accessibilityHint).toBe('incorrect')
    })

    it('unused items show available state even when feedbackState is provided', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedIndices={new Set([0])} // only index 0 used
          feedbackState={{ 0: 'correct' }}
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      // Index 1 not used → should be 'available', not show feedback
      const availableItem = getByTestId('word-bank-item-1')
      expect(availableItem.props.accessibilityHint).toBe('available')
    })
  })

  // AC #1, #3: disabled prop disables all interaction
  describe('disabled state', () => {
    it('does not call onWordSelect when disabled', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedIndices={new Set()}
          onWordSelect={mockOnWordSelect}
          disabled={true}
          testID="word-bank"
        />
      )

      fireEvent.press(getByTestId('word-bank-item-0'))
      expect(mockOnWordSelect).not.toHaveBeenCalled()
    })

    it('renders all items as disabled when disabled prop is true', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedIndices={new Set()}
          onWordSelect={mockOnWordSelect}
          disabled={true}
          testID="word-bank"
        />
      )

      MOCK_WORDS.forEach((_, index) => {
        const item = getByTestId(`word-bank-item-${index}`)
        expect(
          item.props.disabled === true ||
          item.props.accessibilityState?.disabled === true
        ).toBe(true)
      })
    })
  })
})
