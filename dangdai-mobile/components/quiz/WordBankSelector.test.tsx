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
      const Mock = ({ children, testID, onPress, disabled, accessibilityState, opacity, ...rest }: any) => (
        <TouchableOpacity
          testID={testID}
          onPress={onPress}
          disabled={disabled ?? false}
          accessibilityState={accessibilityState}
          style={{ opacity }}
          {...rest}
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
          usedWords={new Set()}
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
          usedWords={new Set()}
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
          usedWords={new Set()}
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      expect(getByTestId('word-bank')).toBeTruthy()
    })
  })

  // AC #2: tapping a word calls onWordSelect
  describe('word selection', () => {
    it('calls onWordSelect with the word when tapped', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedWords={new Set()}
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      fireEvent.press(getByTestId('word-bank-item-0'))
      expect(mockOnWordSelect).toHaveBeenCalledWith('想')
    })

    it('calls onWordSelect with the correct word for each index', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedWords={new Set()}
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      fireEvent.press(getByTestId('word-bank-item-2'))
      expect(mockOnWordSelect).toHaveBeenCalledWith('超市')
    })
  })

  // AC #2: used words are visually marked (opacity 0.4) and not tappable
  describe('used words state', () => {
    it('does not call onWordSelect when a used word is tapped', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedWords={new Set(['想'])}
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      fireEvent.press(getByTestId('word-bank-item-0'))
      expect(mockOnWordSelect).not.toHaveBeenCalled()
    })

    it('renders used words as disabled', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedWords={new Set(['想'])}
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

    it('renders non-used words as enabled', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedWords={new Set(['想'])}
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      const availableItem = getByTestId('word-bank-item-1')
      expect(availableItem.props.disabled).toBeFalsy()
    })
  })

  // AC #3: correct/incorrect feedback states after validation
  describe('feedback states', () => {
    it('renders correct feedback state for a correct word', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedWords={new Set(['想'])}
          feedbackState={{ '想': 'correct' }}
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      // Word with correct feedback should still be rendered
      expect(getByTestId('word-bank-item-0')).toBeTruthy()
    })

    it('renders incorrect feedback state for an incorrect word', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedWords={new Set(['超市'])}
          feedbackState={{ '超市': 'incorrect' }}
          onWordSelect={mockOnWordSelect}
          testID="word-bank"
        />
      )

      // Word with incorrect feedback should still be rendered
      expect(getByTestId('word-bank-item-2')).toBeTruthy()
    })
  })

  // AC #1, #3: disabled prop disables all interaction
  describe('disabled state', () => {
    it('does not call onWordSelect when disabled', () => {
      const { getByTestId } = render(
        <WordBankSelector
          words={MOCK_WORDS}
          usedWords={new Set()}
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
          usedWords={new Set()}
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
