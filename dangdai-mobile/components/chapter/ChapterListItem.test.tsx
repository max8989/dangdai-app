/**
 * ChapterListItem Component Tests
 *
 * Co-located unit tests for the ChapterListItem component per architecture spec.
 * Tests rendering, accessibility, and interaction behavior.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'

import type { Chapter } from '../../types/chapter'

// Mock Tamagui components before importing ChapterListItem
jest.mock('tamagui', () => {
  const { View, Text, TouchableOpacity } = require('react-native')

  return {
    Card: ({
      children,
      onPress,
      testID,
      accessibilityRole,
      accessibilityLabel,
    }: any) => (
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
      >
        <View>{children}</View>
      </TouchableOpacity>
    ),
    XStack: ({ children }: any) => <View>{children}</View>,
    YStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    Text: ({ children, testID }: any) => <Text testID={testID}>{children}</Text>,
    Circle: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
  }
})

// Mock lucide icons
jest.mock('@tamagui/lucide-icons', () => ({
  ChevronRight: () => null,
}))

// Import after mocks are set up
import { ChapterListItem } from './ChapterListItem'

const mockChapter: Chapter = {
  id: 105,
  bookId: 1,
  chapterNumber: 5,
  titleEnglish: 'Dates',
  titleChinese: '日期',
}

const mockFirstChapter: Chapter = {
  id: 101,
  bookId: 1,
  chapterNumber: 1,
  titleEnglish: 'Greetings',
  titleChinese: '问候',
}

const mockBook3Chapter: Chapter = {
  id: 301,
  bookId: 3,
  chapterNumber: 1,
  titleEnglish: 'Education',
  titleChinese: '教育',
}

describe('ChapterListItem', () => {
  const mockOnPress = jest.fn()

  beforeEach(() => {
    mockOnPress.mockClear()
  })

  describe('rendering', () => {
    it('renders chapter number badge', () => {
      const { getByTestId } = render(
        <ChapterListItem chapter={mockChapter} onPress={mockOnPress} />
      )

      expect(getByTestId('chapter-number-badge-105')).toBeTruthy()
    })

    it('displays chapter number in badge', () => {
      const { getByTestId } = render(
        <ChapterListItem chapter={mockChapter} onPress={mockOnPress} />
      )

      expect(getByTestId('chapter-number-text-105')).toHaveTextContent('5')
    })

    it('renders English title', () => {
      const { getByTestId } = render(
        <ChapterListItem chapter={mockChapter} onPress={mockOnPress} />
      )

      expect(getByTestId('chapter-title-english-105')).toHaveTextContent('Dates')
    })

    it('renders Chinese title', () => {
      const { getByTestId } = render(
        <ChapterListItem chapter={mockChapter} onPress={mockOnPress} />
      )

      expect(getByTestId('chapter-title-chinese-105')).toHaveTextContent('日期')
    })

    it('renders card with correct testID', () => {
      const { getByTestId } = render(
        <ChapterListItem chapter={mockChapter} onPress={mockOnPress} />
      )

      expect(getByTestId('chapter-list-item-105')).toBeTruthy()
    })
  })

  describe('interaction', () => {
    it('calls onPress when card is tapped', () => {
      const { getByTestId } = render(
        <ChapterListItem chapter={mockChapter} onPress={mockOnPress} />
      )

      fireEvent.press(getByTestId('chapter-list-item-105'))
      expect(mockOnPress).toHaveBeenCalledTimes(1)
    })

    it('does not trigger extra onPress events', () => {
      const { getByTestId } = render(
        <ChapterListItem chapter={mockChapter} onPress={mockOnPress} />
      )

      fireEvent.press(getByTestId('chapter-list-item-105'))
      fireEvent.press(getByTestId('chapter-list-item-105'))
      expect(mockOnPress).toHaveBeenCalledTimes(2)
    })
  })

  describe('accessibility', () => {
    it('has button role for accessibility', () => {
      const { getByTestId } = render(
        <ChapterListItem chapter={mockChapter} onPress={mockOnPress} />
      )

      const card = getByTestId('chapter-list-item-105')
      expect(card.props.accessibilityRole).toBe('button')
    })

    it('has descriptive accessibility label', () => {
      const { getByTestId } = render(
        <ChapterListItem chapter={mockChapter} onPress={mockOnPress} />
      )

      const card = getByTestId('chapter-list-item-105')
      expect(card.props.accessibilityLabel).toBe('Chapter 5: Dates')
    })

    it('includes Chinese title in accessibility for bilingual context', () => {
      const { getByTestId } = render(
        <ChapterListItem chapter={mockFirstChapter} onPress={mockOnPress} />
      )

      const card = getByTestId('chapter-list-item-101')
      expect(card.props.accessibilityLabel).toBe('Chapter 1: Greetings')
    })
  })

  describe('different chapters', () => {
    it('renders first chapter correctly', () => {
      const { getByTestId } = render(
        <ChapterListItem chapter={mockFirstChapter} onPress={mockOnPress} />
      )

      expect(getByTestId('chapter-number-text-101')).toHaveTextContent('1')
      expect(getByTestId('chapter-title-english-101')).toHaveTextContent('Greetings')
      expect(getByTestId('chapter-title-chinese-101')).toHaveTextContent('问候')
    })

    it('renders chapter from different book correctly', () => {
      const { getByTestId } = render(
        <ChapterListItem chapter={mockBook3Chapter} onPress={mockOnPress} />
      )

      expect(getByTestId('chapter-number-text-301')).toHaveTextContent('1')
      expect(getByTestId('chapter-title-english-301')).toHaveTextContent('Education')
      expect(getByTestId('chapter-title-chinese-301')).toHaveTextContent('教育')
    })
  })
})
