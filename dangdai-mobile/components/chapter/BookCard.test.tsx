/**
 * BookCard Component Tests
 *
 * Co-located unit tests for the BookCard component per architecture spec.
 * Tests rendering, accessibility, and interaction behavior.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'

import type { Book, BookProgress } from '../../types/chapter'

// Mock Tamagui components before importing BookCard
jest.mock('tamagui', () => {
  const { View, Text, TouchableOpacity } = require('react-native')

  // Create Progress mock with Indicator property
  const ProgressMock = ({ children, testID, value }: any) => (
    <View testID={testID} accessibilityValue={{ now: value }}>
      {children}
    </View>
  )
  ProgressMock.Indicator = () => null

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
    Progress: ProgressMock,
  }
})

// Mock lucide icons
jest.mock('@tamagui/lucide-icons', () => ({
  ChevronRight: () => null,
}))

// Import after mocks are set up
import { BookCard } from './BookCard'

const mockBook: Book = {
  id: 1,
  title: 'Book 1',
  titleChinese: '當代中文課程 第一冊',
  chapterCount: 15,
  coverColor: '$blue9',
}

const mockProgress: BookProgress = {
  bookId: 1,
  chaptersCompleted: 5,
  totalChapters: 15,
}

const mockEmptyProgress: BookProgress = {
  bookId: 1,
  chaptersCompleted: 0,
  totalChapters: 15,
}

const mockFullProgress: BookProgress = {
  bookId: 1,
  chaptersCompleted: 15,
  totalChapters: 15,
}

describe('BookCard', () => {
  const mockOnPress = jest.fn()

  beforeEach(() => {
    mockOnPress.mockClear()
  })

  describe('rendering', () => {
    it('renders book title correctly', () => {
      const { getByTestId } = render(
        <BookCard book={mockBook} progress={mockProgress} onPress={mockOnPress} />
      )

      expect(getByTestId('book-title-1')).toHaveTextContent('Book 1')
    })

    it('renders Chinese title correctly', () => {
      const { getByTestId } = render(
        <BookCard book={mockBook} progress={mockProgress} onPress={mockOnPress} />
      )

      expect(getByTestId('book-title-chinese-1')).toHaveTextContent('當代中文課程 第一冊')
    })

    it('renders book number on cover', () => {
      const { getByTestId } = render(
        <BookCard book={mockBook} progress={mockProgress} onPress={mockOnPress} />
      )

      const cover = getByTestId('book-cover-1')
      expect(cover).toBeTruthy()
    })

    it('renders progress text with correct format', () => {
      const { getByTestId } = render(
        <BookCard book={mockBook} progress={mockProgress} onPress={mockOnPress} />
      )

      expect(getByTestId('book-progress-text-1')).toHaveTextContent('5/15')
    })
  })

  describe('progress states', () => {
    it('displays 0/X for empty progress', () => {
      const { getByTestId } = render(
        <BookCard book={mockBook} progress={mockEmptyProgress} onPress={mockOnPress} />
      )

      expect(getByTestId('book-progress-text-1')).toHaveTextContent('0/15')
    })

    it('displays X/X for completed book', () => {
      const { getByTestId } = render(
        <BookCard book={mockBook} progress={mockFullProgress} onPress={mockOnPress} />
      )

      expect(getByTestId('book-progress-text-1')).toHaveTextContent('15/15')
    })

    it('renders progress bar', () => {
      const { getByTestId } = render(
        <BookCard book={mockBook} progress={mockProgress} onPress={mockOnPress} />
      )

      expect(getByTestId('book-progress-bar-1')).toBeTruthy()
    })
  })

  describe('interaction', () => {
    it('calls onPress when card is tapped', () => {
      const { getByTestId } = render(
        <BookCard book={mockBook} progress={mockProgress} onPress={mockOnPress} />
      )

      fireEvent.press(getByTestId('book-card-1'))
      expect(mockOnPress).toHaveBeenCalledTimes(1)
    })
  })

  describe('accessibility', () => {
    it('has button role for accessibility', () => {
      const { getByTestId } = render(
        <BookCard book={mockBook} progress={mockProgress} onPress={mockOnPress} />
      )

      const card = getByTestId('book-card-1')
      expect(card.props.accessibilityRole).toBe('button')
    })

    it('has descriptive accessibility label', () => {
      const { getByTestId } = render(
        <BookCard book={mockBook} progress={mockProgress} onPress={mockOnPress} />
      )

      const card = getByTestId('book-card-1')
      expect(card.props.accessibilityLabel).toBe(
        'Book 1, 5 of 15 chapters completed'
      )
    })
  })

  describe('edge cases', () => {
    it('handles zero total chapters without division by zero', () => {
      const zeroChaptersProgress: BookProgress = {
        bookId: 1,
        chaptersCompleted: 0,
        totalChapters: 0,
      }

      // Should not throw
      expect(() =>
        render(
          <BookCard book={mockBook} progress={zeroChaptersProgress} onPress={mockOnPress} />
        )
      ).not.toThrow()
    })
  })
})
