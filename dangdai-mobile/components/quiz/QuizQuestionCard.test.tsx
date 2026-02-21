/**
 * QuizQuestionCard Component Tests
 *
 * Co-located unit tests for the QuizQuestionCard component.
 * Tests display variants, feedback variants, and question content rendering.
 *
 * Story 4.3: Vocabulary & Grammar Quiz (Multiple Choice)
 */

import React from 'react'
import { render } from '@testing-library/react-native'

// Mock Tamagui before importing the component
jest.mock('tamagui', () => {
  const { View, Text } = require('react-native')

  const CardMock = ({ children, testID }: any) => (
    <View testID={testID}>{children}</View>
  )
  CardMock.Header = ({ children }: any) => <View>{children}</View>
  CardMock.Footer = ({ children }: any) => <View>{children}</View>

  return {
    Card: CardMock,
    YStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    XStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    Text: ({ children, testID, fontSize }: any) => (
      <Text testID={testID} accessibilityHint={fontSize ? String(fontSize) : undefined}>
        {children}
      </Text>
    ),
    styled: (_component: any, _config: any) => {
      // Return a functional component that wraps a View/Text
      const Mock = ({ children, testID, ...rest }: any) => (
        <View testID={testID} {...rest}>
          {children}
        </View>
      )
      return Mock
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    Theme: ({ children }: any) => <>{children}</>,
  }
})

import { QuizQuestionCard } from './QuizQuestionCard'

describe('QuizQuestionCard', () => {
  describe('display variant: character', () => {
    it('renders the question type label', () => {
      const { getByTestId } = render(
        <QuizQuestionCard
          questionTypeLabel="What does this mean?"
          primaryContent="學"
          display="character"
          feedback="none"
          testID="quiz-card"
        />
      )

      expect(getByTestId('question-type-label')).toBeTruthy()
    })

    it('renders the primary Chinese character content', () => {
      const { getByTestId } = render(
        <QuizQuestionCard
          questionTypeLabel="What does this mean?"
          primaryContent="學"
          display="character"
          feedback="none"
          testID="quiz-card"
        />
      )

      expect(getByTestId('primary-content')).toBeTruthy()
    })

    it('renders pinyin when provided', () => {
      const { getByTestId } = render(
        <QuizQuestionCard
          questionTypeLabel="What does this mean?"
          primaryContent="學"
          secondaryContent="xué"
          display="character"
          feedback="none"
          testID="quiz-card"
        />
      )

      expect(getByTestId('secondary-content')).toBeTruthy()
    })

    it('does not render secondary content section when not provided', () => {
      const { queryByTestId } = render(
        <QuizQuestionCard
          questionTypeLabel="What does this mean?"
          primaryContent="學"
          display="character"
          feedback="none"
          testID="quiz-card"
        />
      )

      expect(queryByTestId('secondary-content')).toBeNull()
    })
  })

  describe('display variant: pinyin', () => {
    it('renders with pinyin display variant', () => {
      const { getByTestId } = render(
        <QuizQuestionCard
          questionTypeLabel="What is the pinyin?"
          primaryContent="xué"
          display="pinyin"
          feedback="none"
          testID="quiz-card"
        />
      )

      expect(getByTestId('quiz-card')).toBeTruthy()
      expect(getByTestId('primary-content')).toBeTruthy()
    })
  })

  describe('display variant: meaning', () => {
    it('renders with meaning display variant', () => {
      const { getByTestId } = render(
        <QuizQuestionCard
          questionTypeLabel="Select the correct sentence"
          primaryContent="Which sentence is correct?"
          display="meaning"
          feedback="none"
          testID="quiz-card"
        />
      )

      expect(getByTestId('quiz-card')).toBeTruthy()
    })
  })

  describe('feedback variants', () => {
    it('renders with none feedback variant (default)', () => {
      const { getByTestId } = render(
        <QuizQuestionCard
          questionTypeLabel="What does this mean?"
          primaryContent="學"
          display="character"
          feedback="none"
          testID="quiz-card"
        />
      )

      expect(getByTestId('quiz-card')).toBeTruthy()
    })

    it('renders with correct feedback variant', () => {
      const { getByTestId } = render(
        <QuizQuestionCard
          questionTypeLabel="What does this mean?"
          primaryContent="學"
          display="character"
          feedback="correct"
          testID="quiz-card"
        />
      )

      expect(getByTestId('quiz-card')).toBeTruthy()
    })

    it('renders with incorrect feedback variant', () => {
      const { getByTestId } = render(
        <QuizQuestionCard
          questionTypeLabel="What does this mean?"
          primaryContent="學"
          display="character"
          feedback="incorrect"
          testID="quiz-card"
        />
      )

      expect(getByTestId('quiz-card')).toBeTruthy()
    })
  })

  describe('all 3 display variants render without crash', () => {
    const variants: Array<'character' | 'pinyin' | 'meaning'> = ['character', 'pinyin', 'meaning']

    variants.forEach((display) => {
      it(`renders display="${display}" without throwing`, () => {
        expect(() =>
          render(
            <QuizQuestionCard
              questionTypeLabel="Test label"
              primaryContent="Test content"
              display={display}
              feedback="none"
              testID={`quiz-card-${display}`}
            />
          )
        ).not.toThrow()
      })
    })
  })
})
