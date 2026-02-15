/**
 * Quiz Loading Screen Tests
 *
 * Unit tests for the Quiz Loading placeholder screen.
 * Validates rendering with quiz type and chapter info from route params.
 *
 * Story 3.4: Open Chapter Navigation (No Gates)
 */

import React from 'react'
import { render } from '@testing-library/react-native'

// Mock expo-router
const mockUseLocalSearchParams = jest.fn()
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  Stack: {
    Screen: () => null,
  },
}))

// Mock Tamagui components
jest.mock('tamagui', () => {
  const { View, Text, ActivityIndicator } = require('react-native')

  return {
    YStack: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
      <View testID={testID}>{children}</View>
    ),
    Text: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
      <Text testID={testID}>{children}</Text>
    ),
    Spinner: ({ testID }: { testID?: string }) => <ActivityIndicator testID={testID} />,
  }
})

// Import after mocks
import QuizLoadingScreen from './loading'

describe('QuizLoadingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders the loading screen container', () => {
      mockUseLocalSearchParams.mockReturnValue({
        chapterId: '101',
        bookId: '1',
        quizType: 'vocabulary',
      })

      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('quiz-loading-screen')).toBeTruthy()
    })

    it('shows loading spinner', () => {
      mockUseLocalSearchParams.mockReturnValue({
        chapterId: '101',
        bookId: '1',
        quizType: 'vocabulary',
      })

      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('loading-spinner')).toBeTruthy()
    })
  })

  describe('quiz type display', () => {
    it('displays vocabulary quiz type in loading text', () => {
      mockUseLocalSearchParams.mockReturnValue({
        chapterId: '101',
        bookId: '1',
        quizType: 'vocabulary',
      })

      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('loading-text')).toHaveTextContent('Preparing vocabulary quiz...')
    })

    it('displays grammar quiz type in loading text', () => {
      mockUseLocalSearchParams.mockReturnValue({
        chapterId: '210',
        bookId: '2',
        quizType: 'grammar',
      })

      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('loading-text')).toHaveTextContent('Preparing grammar quiz...')
    })
  })

  describe('chapter info display', () => {
    it('displays chapter and book info', () => {
      mockUseLocalSearchParams.mockReturnValue({
        chapterId: '105',
        bookId: '1',
        quizType: 'vocabulary',
      })

      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('chapter-info')).toHaveTextContent('Chapter 105 (Book 1)')
    })

    it('displays different chapter and book info', () => {
      mockUseLocalSearchParams.mockReturnValue({
        chapterId: '315',
        bookId: '3',
        quizType: 'grammar',
      })

      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('chapter-info')).toHaveTextContent('Chapter 315 (Book 3)')
    })
  })

  describe('placeholder notice', () => {
    it('shows Epic 4 placeholder notice', () => {
      mockUseLocalSearchParams.mockReturnValue({
        chapterId: '101',
        bookId: '1',
        quizType: 'vocabulary',
      })

      const { getByTestId } = render(<QuizLoadingScreen />)
      expect(getByTestId('placeholder-notice')).toHaveTextContent(
        'Quiz generation will be implemented in Epic 4'
      )
    })
  })

  describe('edge cases', () => {
    it('handles undefined params gracefully', () => {
      mockUseLocalSearchParams.mockReturnValue({})

      const { getByTestId } = render(<QuizLoadingScreen />)
      // Should still render without crashing
      expect(getByTestId('quiz-loading-screen')).toBeTruthy()
    })
  })
})
