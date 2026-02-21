/**
 * QuizProgress Component Tests
 *
 * Co-located unit tests for the QuizProgress component.
 * Tests correct position display and progress bar rendering.
 *
 * Story 4.3: Vocabulary & Grammar Quiz (Multiple Choice)
 */

import React from 'react'
import { render } from '@testing-library/react-native'

// Mock Tamagui before importing the component
jest.mock('tamagui', () => {
  const { View, Text } = require('react-native')

  return {
    YStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    XStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    Text: ({ children, testID }: any) => <Text testID={testID}>{children}</Text>,
  }
})

import { QuizProgress } from './QuizProgress'

describe('QuizProgress', () => {
  describe('position display', () => {
    it('shows correct current question and total (AC #1)', () => {
      const { getByTestId } = render(
        <QuizProgress currentQuestion={3} totalQuestions={10} testID="quiz-progress" />
      )

      expect(getByTestId('progress-text')).toHaveTextContent('3/10')
    })

    it('shows position 1/10 for the first question', () => {
      const { getByTestId } = render(
        <QuizProgress currentQuestion={1} totalQuestions={10} testID="quiz-progress" />
      )

      expect(getByTestId('progress-text')).toHaveTextContent('1/10')
    })

    it('shows position 10/10 for the last question', () => {
      const { getByTestId } = render(
        <QuizProgress currentQuestion={10} totalQuestions={10} testID="quiz-progress" />
      )

      expect(getByTestId('progress-text')).toHaveTextContent('10/10')
    })

    it('shows position 1/1 for a single question quiz', () => {
      const { getByTestId } = render(
        <QuizProgress currentQuestion={1} totalQuestions={1} testID="quiz-progress" />
      )

      expect(getByTestId('progress-text')).toHaveTextContent('1/1')
    })
  })

  describe('progress bar', () => {
    it('renders the progress bar container', () => {
      const { getByTestId } = render(
        <QuizProgress currentQuestion={5} totalQuestions={10} testID="quiz-progress" />
      )

      expect(getByTestId('progress-bar-container')).toBeTruthy()
    })

    it('renders the progress bar fill', () => {
      const { getByTestId } = render(
        <QuizProgress currentQuestion={5} totalQuestions={10} testID="quiz-progress" />
      )

      expect(getByTestId('progress-bar-fill')).toBeTruthy()
    })
  })

  describe('container', () => {
    it('renders the outer container with testID', () => {
      const { getByTestId } = render(
        <QuizProgress currentQuestion={3} totalQuestions={10} testID="quiz-progress" />
      )

      expect(getByTestId('quiz-progress')).toBeTruthy()
    })
  })
})
