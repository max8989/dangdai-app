/**
 * Books Screen Tests
 *
 * Unit tests for the Books screen (Story 3.6: Expand Book Selection to Books 1-4).
 * Validates that all 4 books are rendered, lesson counts are correct,
 * and navigation works for all books.
 *
 * AC #1: Screen displays Books 1, 2, 3, and 4
 * AC #2: Books 1-2 show 15 lessons, Books 3-4 show 12 lessons
 * AC #3: Books 3-4 use distinct cover colors (orange, purple)
 * AC #4: Navigation to chapter list works for all 4 books
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'

// Mock expo-router
const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock Tamagui components
jest.mock('tamagui', () => {
  const { View, Text, ScrollView: RNScrollView } = require('react-native')

  return {
    YStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    Text: ({ children, testID }: any) => <Text testID={testID}>{children}</Text>,
    ScrollView: ({ children, testID }: any) => (
      <RNScrollView testID={testID}>{children}</RNScrollView>
    ),
  }
})

// Mock BookCard component
jest.mock('../../components/chapter/BookCard', () => ({
  BookCard: ({ book, progress, onPress }: any) => {
    const { TouchableOpacity, Text, View } = require('react-native')
    return (
      <TouchableOpacity
        testID={`book-card-${book.id}`}
        onPress={onPress}
        accessibilityLabel={`${book.title}`}
      >
        <View>
          <Text testID={`book-title-${book.id}`}>{book.title}</Text>
          <Text testID={`book-chapter-count-${book.id}`}>
            {book.chapterCount} lessons
          </Text>
          <Text testID={`book-progress-${book.id}`}>
            {progress.chaptersCompleted}/{progress.totalChapters}
          </Text>
        </View>
      </TouchableOpacity>
    )
  },
}))

// Mock BookCardSkeleton component
jest.mock('../../components/chapter/BookCardSkeleton', () => ({
  BookCardSkeleton: ({ count }: any) => {
    const { View } = require('react-native')
    return <View testID="book-card-skeleton" />
  },
}))

// Mock useBooks hook
const mockUseBooks = jest.fn()
jest.mock('../../hooks/useBooks', () => ({
  useBooks: () => mockUseBooks(),
}))

// Use real BOOKS constant (not mocked) to test actual data
// This ensures the test validates the real constants/books.ts data

// Import after mocks
import BooksScreen from './books'

describe('BooksScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: loaded state with no progress
    mockUseBooks.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    })
  })

  describe('AC #1: Renders all 4 book cards', () => {
    it('renders 4 book cards when loaded', () => {
      const { getByTestId } = render(<BooksScreen />)

      expect(getByTestId('book-card-1')).toBeTruthy()
      expect(getByTestId('book-card-2')).toBeTruthy()
      expect(getByTestId('book-card-3')).toBeTruthy()
      expect(getByTestId('book-card-4')).toBeTruthy()
    })

    it('renders the Books header', () => {
      const { getByTestId } = render(<BooksScreen />)

      expect(getByTestId('books-header')).toBeTruthy()
    })

    it('renders books in a scrollable list', () => {
      const { getByTestId } = render(<BooksScreen />)

      expect(getByTestId('books-list')).toBeTruthy()
    })

    it('renders Book 1 with correct title', () => {
      const { getByTestId } = render(<BooksScreen />)

      expect(getByTestId('book-title-1')).toHaveTextContent('Book 1')
    })

    it('renders Book 2 with correct title', () => {
      const { getByTestId } = render(<BooksScreen />)

      expect(getByTestId('book-title-2')).toHaveTextContent('Book 2')
    })

    it('renders Book 3 with correct title', () => {
      const { getByTestId } = render(<BooksScreen />)

      expect(getByTestId('book-title-3')).toHaveTextContent('Book 3')
    })

    it('renders Book 4 with correct title', () => {
      const { getByTestId } = render(<BooksScreen />)

      expect(getByTestId('book-title-4')).toHaveTextContent('Book 4')
    })
  })

  describe('AC #2: Correct lesson counts per book', () => {
    it('shows 15 lessons for Book 1', () => {
      const { getByTestId } = render(<BooksScreen />)

      expect(getByTestId('book-chapter-count-1')).toHaveTextContent('15 lessons')
    })

    it('shows 15 lessons for Book 2', () => {
      const { getByTestId } = render(<BooksScreen />)

      expect(getByTestId('book-chapter-count-2')).toHaveTextContent('15 lessons')
    })

    it('shows 12 lessons for Book 3', () => {
      const { getByTestId } = render(<BooksScreen />)

      expect(getByTestId('book-chapter-count-3')).toHaveTextContent('12 lessons')
    })

    it('shows 12 lessons for Book 4', () => {
      const { getByTestId } = render(<BooksScreen />)

      expect(getByTestId('book-chapter-count-4')).toHaveTextContent('12 lessons')
    })
  })

  describe('AC #4: Navigation works for all 4 books', () => {
    it('navigates to chapter list for Book 1 when tapped', () => {
      const { getByTestId } = render(<BooksScreen />)

      fireEvent.press(getByTestId('book-card-1'))

      expect(mockPush).toHaveBeenCalledWith('/chapter/1')
    })

    it('navigates to chapter list for Book 2 when tapped', () => {
      const { getByTestId } = render(<BooksScreen />)

      fireEvent.press(getByTestId('book-card-2'))

      expect(mockPush).toHaveBeenCalledWith('/chapter/2')
    })

    it('navigates to chapter list for Book 3 when tapped', () => {
      const { getByTestId } = render(<BooksScreen />)

      fireEvent.press(getByTestId('book-card-3'))

      expect(mockPush).toHaveBeenCalledWith('/chapter/3')
    })

    it('navigates to chapter list for Book 4 when tapped', () => {
      const { getByTestId } = render(<BooksScreen />)

      fireEvent.press(getByTestId('book-card-4'))

      expect(mockPush).toHaveBeenCalledWith('/chapter/4')
    })
  })

  describe('Progress display', () => {
    it('shows 0/15 progress for Book 1 when no progress data', () => {
      const { getByTestId } = render(<BooksScreen />)

      expect(getByTestId('book-progress-1')).toHaveTextContent('0/15')
    })

    it('shows 0/15 progress for Book 2 when no progress data', () => {
      const { getByTestId } = render(<BooksScreen />)

      expect(getByTestId('book-progress-2')).toHaveTextContent('0/15')
    })

    it('shows 0/12 progress for Book 3 when no progress data', () => {
      const { getByTestId } = render(<BooksScreen />)

      expect(getByTestId('book-progress-3')).toHaveTextContent('0/12')
    })

    it('shows 0/12 progress for Book 4 when no progress data', () => {
      const { getByTestId } = render(<BooksScreen />)

      expect(getByTestId('book-progress-4')).toHaveTextContent('0/12')
    })

    it('shows actual progress when data is available', () => {
      mockUseBooks.mockReturnValue({
        data: {
          1: { bookId: 1, chaptersCompleted: 5, totalChapters: 15 },
          2: { bookId: 2, chaptersCompleted: 3, totalChapters: 15 },
          3: { bookId: 3, chaptersCompleted: 2, totalChapters: 12 },
          4: { bookId: 4, chaptersCompleted: 0, totalChapters: 12 },
        },
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<BooksScreen />)

      expect(getByTestId('book-progress-1')).toHaveTextContent('5/15')
      expect(getByTestId('book-progress-2')).toHaveTextContent('3/15')
      expect(getByTestId('book-progress-3')).toHaveTextContent('2/12')
      expect(getByTestId('book-progress-4')).toHaveTextContent('0/12')
    })
  })

  describe('Loading state', () => {
    it('shows skeleton loading state when data is loading', () => {
      mockUseBooks.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      })

      const { getByTestId, queryByTestId } = render(<BooksScreen />)

      expect(getByTestId('books-list-loading')).toBeTruthy()
      expect(queryByTestId('book-card-1')).toBeNull()
      expect(queryByTestId('book-card-2')).toBeNull()
      expect(queryByTestId('book-card-3')).toBeNull()
      expect(queryByTestId('book-card-4')).toBeNull()
    })

    it('shows all 4 book cards when loading completes', () => {
      mockUseBooks.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<BooksScreen />)

      expect(getByTestId('book-card-1')).toBeTruthy()
      expect(getByTestId('book-card-2')).toBeTruthy()
      expect(getByTestId('book-card-3')).toBeTruthy()
      expect(getByTestId('book-card-4')).toBeTruthy()
    })
  })

  describe('Error state', () => {
    it('shows error message when books fail to load', () => {
      mockUseBooks.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
      })

      const { queryByTestId } = render(<BooksScreen />)

      // Books list should not be shown on error
      expect(queryByTestId('books-list')).toBeNull()
      expect(queryByTestId('book-card-1')).toBeNull()
    })
  })
})
