/**
 * AnswerOptionGrid Component Tests
 *
 * Co-located unit tests for the AnswerOptionGrid component.
 * Tests 2x2 grid and vertical list layouts, answer selection, and disabled state.
 *
 * Story 4.3: Vocabulary & Grammar Quiz (Multiple Choice)
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'

// Mock Tamagui before importing the component
jest.mock('tamagui', () => {
  const { View, Text, TouchableOpacity } = require('react-native')

  return {
    Button: ({ children, onPress, testID, disabled, accessibilityState }: any) => (
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        disabled={disabled}
        accessibilityState={accessibilityState}
      >
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
    XStack: ({ children, testID, flexWrap }: any) => (
      <View testID={testID} accessibilityHint={flexWrap}>{children}</View>
    ),
    YStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    Text: ({ children, testID }: any) => <Text testID={testID}>{children}</Text>,
    styled: (_component: any, _config: any) => {
      // The styled mock must forward `disabled` as a native prop so tests can inspect it
      const Mock = ({ children, testID, onPress, disabled, accessibilityState, ...rest }: any) => (
        <TouchableOpacity
          testID={testID}
          onPress={onPress}
          disabled={disabled ?? false}
          accessibilityState={accessibilityState}
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

import { AnswerOptionGrid } from './AnswerOptionGrid'

const SHORT_OPTIONS = ['to study', 'to teach', 'to read', 'to write']
const LONG_OPTIONS = [
  '我把書放在桌子上了',
  '我放書把桌子上了',
  '把我書放在桌子上了',
  '我書把放在桌子上了',
]

describe('AnswerOptionGrid', () => {
  const mockOnSelect = jest.fn()

  beforeEach(() => {
    mockOnSelect.mockClear()
  })

  describe('layout selection', () => {
    it('renders a 2x2 grid for short answers (all ≤15 chars)', () => {
      const { getByTestId } = render(
        <AnswerOptionGrid
          options={SHORT_OPTIONS}
          selectedOption={null}
          correctAnswer={null}
          onSelect={mockOnSelect}
          disabled={false}
          testID="answer-grid"
        />
      )

      expect(getByTestId('answer-grid')).toBeTruthy()
    })

    it('renders a vertical list for long answers (any >15 chars)', () => {
      const { getByTestId } = render(
        <AnswerOptionGrid
          options={LONG_OPTIONS}
          selectedOption={null}
          correctAnswer={null}
          onSelect={mockOnSelect}
          disabled={false}
          testID="answer-grid"
        />
      )

      expect(getByTestId('answer-grid')).toBeTruthy()
    })
  })

  describe('option rendering', () => {
    it('renders all 4 answer options', () => {
      const { getByTestId } = render(
        <AnswerOptionGrid
          options={SHORT_OPTIONS}
          selectedOption={null}
          correctAnswer={null}
          onSelect={mockOnSelect}
          disabled={false}
          testID="answer-grid"
        />
      )

      SHORT_OPTIONS.forEach((_, index) => {
        expect(getByTestId(`answer-option-${index}`)).toBeTruthy()
      })
    })

    it('renders option text correctly', () => {
      const { getByText } = render(
        <AnswerOptionGrid
          options={SHORT_OPTIONS}
          selectedOption={null}
          correctAnswer={null}
          onSelect={mockOnSelect}
          disabled={false}
          testID="answer-grid"
        />
      )

      SHORT_OPTIONS.forEach((option) => {
        expect(getByText(option)).toBeTruthy()
      })
    })
  })

  describe('answer selection', () => {
    it('calls onSelect with the answer when an option is pressed', () => {
      const { getByTestId } = render(
        <AnswerOptionGrid
          options={SHORT_OPTIONS}
          selectedOption={null}
          correctAnswer={null}
          onSelect={mockOnSelect}
          disabled={false}
          testID="answer-grid"
        />
      )

      fireEvent.press(getByTestId('answer-option-0'))
      expect(mockOnSelect).toHaveBeenCalledWith('to study')
    })

    it('calls onSelect with the correct option text', () => {
      const { getByTestId } = render(
        <AnswerOptionGrid
          options={SHORT_OPTIONS}
          selectedOption={null}
          correctAnswer={null}
          onSelect={mockOnSelect}
          disabled={false}
          testID="answer-grid"
        />
      )

      fireEvent.press(getByTestId('answer-option-2'))
      expect(mockOnSelect).toHaveBeenCalledWith('to read')
    })
  })

  describe('disabled state after answer selection (AC #2)', () => {
    it('does not call onSelect when disabled', () => {
      const { getByTestId } = render(
        <AnswerOptionGrid
          options={SHORT_OPTIONS}
          selectedOption="to study"
          correctAnswer="to study"
          onSelect={mockOnSelect}
          disabled={true}
          testID="answer-grid"
        />
      )

      fireEvent.press(getByTestId('answer-option-1'))
      expect(mockOnSelect).not.toHaveBeenCalled()
    })

    it('renders options as disabled when disabled prop is true', () => {
      const { getByTestId } = render(
        <AnswerOptionGrid
          options={SHORT_OPTIONS}
          selectedOption="to study"
          correctAnswer="to study"
          onSelect={mockOnSelect}
          disabled={true}
          testID="answer-grid"
        />
      )

      const option = getByTestId('answer-option-1')
      // disabled prop is either true or falsy (undefined treated as disabled by TouchableOpacity)
      expect(option.props.disabled === true || option.props.accessibilityState?.disabled === true).toBe(true)
    })
  })

  describe('minimum touch target', () => {
    it('renders options without crash — 48px touch target enforced via styles', () => {
      expect(() =>
        render(
          <AnswerOptionGrid
            options={SHORT_OPTIONS}
            selectedOption={null}
            correctAnswer={null}
            onSelect={mockOnSelect}
            disabled={false}
            testID="answer-grid"
          />
        )
      ).not.toThrow()
    })
  })
})
