/**
 * Tests for TextInputAnswer component.
 * Story 4.12: Text Input Answer Type
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import { TextInputAnswer } from './TextInputAnswer'
import config from '../../tamagui.config'

// Wrapper component for Tamagui provider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TamaguiProvider config={config}>{children}</TamaguiProvider>
)

describe('TextInputAnswer', () => {
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders input with placeholder text', () => {
    const { getByPlaceholderText } = render(
      <TextInputAnswer
        placeholder="Type the pinyin..."
        correctAnswer="xué"
        questionType="pinyin"
        onSubmit={mockOnSubmit}
      />,
      { wrapper }
    )

    expect(getByPlaceholderText('Type the pinyin...')).toBeTruthy()
  })

  it('renders submit button disabled when input is empty', () => {
    const { getByText } = render(
      <TextInputAnswer
        placeholder="Type the pinyin..."
        correctAnswer="xué"
        questionType="pinyin"
        onSubmit={mockOnSubmit}
      />,
      { wrapper }
    )

    const submitButton = getByText('Submit')
    // Press should do nothing when input is empty
    fireEvent.press(submitButton)
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('enables submit button when input has text', () => {
    const { getByPlaceholderText, getByText } = render(
      <TextInputAnswer
        placeholder="Type the pinyin..."
        correctAnswer="xué"
        questionType="pinyin"
        onSubmit={mockOnSubmit}
      />,
      { wrapper }
    )

    const input = getByPlaceholderText('Type the pinyin...')
    fireEvent.changeText(input, 'xue2')

    const submitButton = getByText('Submit')
    // Press should trigger onSubmit when input has text
    fireEvent.press(submitButton)
    expect(mockOnSubmit).toHaveBeenCalled()
  })

  it('calls onSubmit with user answer and isCorrect on button press', () => {
    const { getByPlaceholderText, getByText } = render(
      <TextInputAnswer
        placeholder="Type the pinyin..."
        correctAnswer="xué"
        questionType="pinyin"
        onSubmit={mockOnSubmit}
      />,
      { wrapper }
    )

    const input = getByPlaceholderText('Type the pinyin...')
    fireEvent.changeText(input, 'xue2')

    const submitButton = getByText('Submit')
    fireEvent.press(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith('xue2', true)
  })

  it('calls onSubmit on Enter key (onSubmitEditing)', () => {
    const { getByPlaceholderText } = render(
      <TextInputAnswer
        placeholder="Type the pinyin..."
        correctAnswer="xué"
        questionType="pinyin"
        onSubmit={mockOnSubmit}
      />,
      { wrapper }
    )

    const input = getByPlaceholderText('Type the pinyin...')
    fireEvent.changeText(input, 'xue2')
    fireEvent(input, 'submitEditing')

    expect(mockOnSubmit).toHaveBeenCalledWith('xue2', true)
  })

  it('makes input read-only after submission', () => {
    const { getByPlaceholderText, getByText, getByDisplayValue } = render(
      <TextInputAnswer
        placeholder="Type the pinyin..."
        correctAnswer="xué"
        questionType="pinyin"
        onSubmit={mockOnSubmit}
      />,
      { wrapper }
    )

    const input = getByPlaceholderText('Type the pinyin...')
    fireEvent.changeText(input, 'xue2')

    const submitButton = getByText('Submit')
    fireEvent.press(submitButton)

    // After submission, find the input again and check it's not editable
    const submittedInput = getByDisplayValue('xue2')
    expect(submittedInput.props.editable).toBe(false)
  })

  it('shows correct answer when feedback is incorrect', () => {
    const { getByPlaceholderText, getByText } = render(
      <TextInputAnswer
        placeholder="Type the pinyin..."
        correctAnswer="xué"
        questionType="pinyin"
        onSubmit={mockOnSubmit}
      />,
      { wrapper }
    )

    const input = getByPlaceholderText('Type the pinyin...')
    fireEvent.changeText(input, 'xue1') // Wrong tone

    const submitButton = getByText('Submit')
    fireEvent.press(submitButton)

    // Should show correct answer
    expect(getByText('Correct answer:')).toBeTruthy()
    expect(getByText('xué')).toBeTruthy()
  })

  it('does NOT show correct answer when feedback is correct', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <TextInputAnswer
        placeholder="Type the pinyin..."
        correctAnswer="xué"
        questionType="pinyin"
        onSubmit={mockOnSubmit}
      />,
      { wrapper }
    )

    const input = getByPlaceholderText('Type the pinyin...')
    fireEvent.changeText(input, 'xue2') // Correct

    const submitButton = getByText('Submit')
    fireEvent.press(submitButton)

    // Should NOT show "Correct answer:" text
    expect(queryByText('Correct answer:')).toBeNull()
  })

  it('does NOT clear user input after submission', () => {
    const { getByPlaceholderText, getByText, getByDisplayValue } = render(
      <TextInputAnswer
        placeholder="Type the pinyin..."
        correctAnswer="xué"
        questionType="pinyin"
        onSubmit={mockOnSubmit}
      />,
      { wrapper }
    )

    const input = getByPlaceholderText('Type the pinyin...')
    fireEvent.changeText(input, 'xue1')

    const submitButton = getByText('Submit')
    fireEvent.press(submitButton)

    // Input value should still be 'xue1' - find the input again after re-render
    const submittedInput = getByDisplayValue('xue1')
    expect(submittedInput).toBeTruthy()
  })

  it('has autoCapitalize="none"', () => {
    const { getByPlaceholderText } = render(
      <TextInputAnswer
        placeholder="Type the pinyin..."
        correctAnswer="xué"
        questionType="pinyin"
        onSubmit={mockOnSubmit}
      />,
      { wrapper }
    )

    const input = getByPlaceholderText('Type the pinyin...')
    expect(input.props.autoCapitalize).toBe('none')
  })

  it('has autoCorrect={false}', () => {
    const { getByPlaceholderText } = render(
      <TextInputAnswer
        placeholder="Type the pinyin..."
        correctAnswer="xué"
        questionType="pinyin"
        onSubmit={mockOnSubmit}
      />,
      { wrapper }
    )

    const input = getByPlaceholderText('Type the pinyin...')
    expect(input.props.autoCorrect).toBe(false)
  })

  it('validates meaning type answers correctly', () => {
    const { getByPlaceholderText, getByText } = render(
      <TextInputAnswer
        placeholder="Type the meaning..."
        correctAnswer="to study"
        questionType="meaning"
        onSubmit={mockOnSubmit}
      />,
      { wrapper }
    )

    const input = getByPlaceholderText('Type the meaning...')
    fireEvent.changeText(input, 'To Study') // Case-insensitive match

    const submitButton = getByText('Submit')
    fireEvent.press(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith('To Study', true)
  })

  it('does not submit when disabled prop is true', () => {
    const { getByPlaceholderText, getByText } = render(
      <TextInputAnswer
        placeholder="Type the pinyin..."
        correctAnswer="xué"
        questionType="pinyin"
        onSubmit={mockOnSubmit}
        disabled={true}
      />,
      { wrapper }
    )

    const input = getByPlaceholderText('Type the pinyin...')
    expect(input.props.editable).toBe(false)

    // Try to submit - should not work
    fireEvent.changeText(input, 'xue2') // This won't actually change because editable=false
    const submitButton = getByText('Submit')
    fireEvent.press(submitButton)
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })
})
