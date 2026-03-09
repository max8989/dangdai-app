/**
 * ExitConfirmationModal Component Tests
 *
 * Unit tests for the exit confirmation modal shown when user tries to leave an active quiz.
 *
 * Story 4.10b: Quiz Pause/Resume — Task 6.8
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'

import { ExitConfirmationModal } from './ExitConfirmationModal'

// ─── Mock Tamagui ──────────────────────────────────────────────────────────────

jest.mock('tamagui', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text, TouchableOpacity } = require('react-native')

  const YStack = ({ children, testID, ...rest }: any) => (
    <View testID={testID} {...rest}>{children}</View>
  )
  const XStack = ({ children, testID, ...rest }: any) => (
    <View testID={testID} {...rest}>{children}</View>
  )
  const TamaguiText = ({ children, testID, ...rest }: any) => (
    <Text testID={testID} {...rest}>{children}</Text>
  )
  const AnimatePresence = ({ children }: any) => <>{children}</>
  // Use View with explicit disabled prop so tests can check .props.disabled
  const Button = ({ children, testID, onPress, disabled }: any) => (
    <View testID={testID} onTouchEnd={!disabled ? onPress : undefined} disabled={disabled} accessible accessibilityState={{ disabled: !!disabled }}>
      <Text>{children}</Text>
    </View>
  )
  const Unspaced = ({ children }: any) => <>{children}</>

  // Dialog mock — renders children when open=true
  const Dialog = ({ children, open, onOpenChange }: any) => {
    if (!open) return null
    return <View>{children}</View>
  }
  Dialog.Portal = ({ children }: any) => <View>{children}</View>
  Dialog.Overlay = ({ testID, ...rest }: any) => <View testID={testID} {...rest} />
  Dialog.Content = ({ children, testID, ...rest }: any) => (
    <View testID={testID} {...rest}>{children}</View>
  )
  Dialog.Title = ({ children }: any) => <View>{children}</View>
  Dialog.Description = ({ children }: any) => <View>{children}</View>
  Dialog.Close = ({ children }: any) => <>{children}</>

  return {
    YStack,
    XStack,
    Text: TamaguiText,
    Button,
    AnimatePresence,
    Dialog,
    Unspaced,
  }
})

jest.mock('@tamagui/lucide-icons', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native')

  const Pause = ({ testID, ...rest }: any) => <View testID={testID ?? 'pause-icon'} {...rest} />
  const X = ({ testID, ...rest }: any) => <View testID={testID ?? 'x-icon'} {...rest} />
  const BookOpen = ({ testID, ...rest }: any) => <View testID={testID ?? 'book-icon'} {...rest} />

  return { Pause, X, BookOpen }
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ExitConfirmationModal — Story 4.10b (Task 6)', () => {
  const defaultProps = {
    open: true,
    onStay: jest.fn(),
    onPause: jest.fn(),
    onCancel: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering (Task 6.2, 6.3)', () => {
    it('renders the modal when open is true', () => {
      const { getByTestId } = render(<ExitConfirmationModal {...defaultProps} />)
      expect(getByTestId('exit-confirmation-modal')).toBeTruthy()
    })

    it('does not render when open is false', () => {
      const { queryByTestId } = render(
        <ExitConfirmationModal {...defaultProps} open={false} />
      )
      expect(queryByTestId('exit-confirmation-modal')).toBeNull()
    })

    it('renders the Pause Quiz button', () => {
      const { getByTestId } = render(<ExitConfirmationModal {...defaultProps} />)
      expect(getByTestId('pause-quiz-button')).toBeTruthy()
    })

    it('renders the Cancel Quiz button', () => {
      const { getByTestId } = render(<ExitConfirmationModal {...defaultProps} />)
      expect(getByTestId('cancel-quiz-button')).toBeTruthy()
    })

    it('renders the Stay button', () => {
      const { getByTestId } = render(<ExitConfirmationModal {...defaultProps} />)
      expect(getByTestId('stay-button')).toBeTruthy()
    })
  })

  describe('button callbacks (Task 6.4)', () => {
    it('calls onPause when Pause Quiz button is pressed', () => {
      const onPause = jest.fn()
      const { getByTestId } = render(
        <ExitConfirmationModal {...defaultProps} onPause={onPause} />
      )
      fireEvent.press(getByTestId('pause-quiz-button'))
      expect(onPause).toHaveBeenCalledTimes(1)
    })

    it('calls onCancel when Cancel Quiz button is pressed', () => {
      const onCancel = jest.fn()
      const { getByTestId } = render(
        <ExitConfirmationModal {...defaultProps} onCancel={onCancel} />
      )
      fireEvent.press(getByTestId('cancel-quiz-button'))
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('calls onStay when Stay button is pressed', () => {
      const onStay = jest.fn()
      const { getByTestId } = render(
        <ExitConfirmationModal {...defaultProps} onStay={onStay} />
      )
      fireEvent.press(getByTestId('stay-button'))
      expect(onStay).toHaveBeenCalledTimes(1)
    })
  })

  describe('loading state (isPausing prop)', () => {
    it('shows "Saving..." text when isPausing is true', () => {
      const { getByText } = render(
        <ExitConfirmationModal {...defaultProps} isPausing={true} />
      )
      expect(getByText('Saving...')).toBeTruthy()
    })

    it('shows "Pause Quiz" text when isPausing is false', () => {
      const { getByText } = render(
        <ExitConfirmationModal {...defaultProps} isPausing={false} />
      )
      expect(getByText('Pause Quiz')).toBeTruthy()
    })

    it('disables buttons when isPausing is true', () => {
      const { getByTestId } = render(
        <ExitConfirmationModal {...defaultProps} isPausing={true} />
      )
      expect(getByTestId('pause-quiz-button').props.disabled).toBe(true)
      expect(getByTestId('cancel-quiz-button').props.disabled).toBe(true)
      expect(getByTestId('stay-button').props.disabled).toBe(true)
    })
  })
})
