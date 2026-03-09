/**
 * Chapter List Screen Tests
 *
 * Integration tests for the Chapter List screen.
 * Validates loading state, progress display, and navigation.
 *
 * Story 3.3: Chapter Completion Status Display
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'

// Mock expo-router
const mockPush = jest.fn()
const mockUseLocalSearchParams = jest.fn()
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => ({ push: mockPush }),
  Stack: {
    Screen: ({ options }: any) => null,
  },
}))

// Mock Tamagui components
jest.mock('tamagui', () => {
  const { View, Text, ScrollView: RNScrollView, TouchableOpacity } = require('react-native')

  return {
    YStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    XStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    Text: ({ children, testID }: any) => <Text testID={testID}>{children}</Text>,
    ScrollView: ({ children, testID }: any) => (
      <RNScrollView testID={testID}>{children}</RNScrollView>
    ),
    Button: ({ children, onPress, testID }: any) => (
      <TouchableOpacity testID={testID} onPress={onPress}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
  }
})

// Mock lucide icons
jest.mock('@tamagui/lucide-icons', () => ({
  AlertCircle: () => null,
  RefreshCw: () => null,
}))

// Mock ChapterListItem
jest.mock('../../components/chapter/ChapterListItem', () => ({
  ChapterListItem: ({ chapter, progress, onPress }: any) => {
    const { TouchableOpacity, Text, View } = require('react-native')
    return (
      <TouchableOpacity
        testID={`chapter-list-item-${chapter.id}`}
        onPress={onPress}
      >
        <View>
          <Text testID={`chapter-progress-${chapter.id}`}>
            {progress?.completionPercentage ?? 0}%
          </Text>
        </View>
      </TouchableOpacity>
    )
  },
}))

// Mock ChapterListSkeleton
jest.mock('../../components/chapter/ChapterListSkeleton', () => ({
  ChapterListSkeleton: ({ count }: any) => {
    const { View } = require('react-native')
    return <View testID="chapter-list-skeleton" />
  },
}))

// Mock useChapters — returns different chapters based on bookId (Story 3.6)
const mockChaptersBook1 = [
  { id: 101, bookId: 1, chapterNumber: 1, titleEnglish: 'Welcome to Taiwan!', titleChinese: '歡迎你來臺灣！' },
  { id: 102, bookId: 1, chapterNumber: 2, titleEnglish: 'My Family', titleChinese: '我的家人' },
]
const mockChaptersBook3 = Array.from({ length: 12 }, (_, i) => ({
  id: 301 + i,
  bookId: 3,
  chapterNumber: i + 1,
  titleEnglish: `Book 3 Chapter ${i + 1}`,
  titleChinese: `第三冊第${i + 1}課`,
}))
const mockUseChapters = jest.fn()
jest.mock('../../hooks/useChapters', () => ({
  useChapters: (bookId: number) => mockUseChapters(bookId),
}))

// Mock useChapterProgress
const mockUseChapterProgress = jest.fn()
jest.mock('../../hooks/useChapterProgress', () => ({
  useChapterProgress: (bookId: number) => mockUseChapterProgress(bookId),
}))

// Mock BOOKS constant — all 4 books (Story 3.6)
jest.mock('../../constants/books', () => ({
  BOOKS: [
    { id: 1, title: 'Book 1', titleChinese: '第一册', chapterCount: 15, coverColor: '$blue9' },
    { id: 2, title: 'Book 2', titleChinese: '第二册', chapterCount: 15, coverColor: '$green9' },
    { id: 3, title: 'Book 3', titleChinese: '第三册', chapterCount: 12, coverColor: '$orange9' },
    { id: 4, title: 'Book 4', titleChinese: '第四册', chapterCount: 12, coverColor: '$purple9' },
  ],
}))

// Import after mocks
import ChapterListScreen from './[bookId]'

describe('ChapterListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLocalSearchParams.mockReturnValue({ bookId: '1' })
    // Default: return Book 1 chapters
    mockUseChapters.mockImplementation((bookId: number) => {
      if (bookId === 3) return mockChaptersBook3
      return mockChaptersBook1
    })
  })

  describe('loading state (AC #4)', () => {
    it('shows skeleton when progress is loading', () => {
      mockUseChapterProgress.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      })

      const { getByTestId, queryByTestId } = render(<ChapterListScreen />)

      expect(getByTestId('chapter-list-skeleton')).toBeTruthy()
      expect(queryByTestId('chapter-list-item-101')).toBeNull()
    })

    it('shows chapters when progress is loaded', () => {
      mockUseChapterProgress.mockReturnValue({
        data: { 101: { completionPercentage: 45 } },
        isLoading: false,
        error: null,
      })

      const { getByTestId, queryByTestId } = render(<ChapterListScreen />)

      expect(queryByTestId('chapter-list-skeleton')).toBeNull()
      expect(getByTestId('chapter-list-item-101')).toBeTruthy()
      expect(getByTestId('chapter-list-item-102')).toBeTruthy()
    })
  })

  describe('progress display', () => {
    it('passes progress to ChapterListItem', () => {
      const mockProgressMap = {
        101: { completionPercentage: 45 },
        102: { completionPercentage: 80 },
      }
      mockUseChapterProgress.mockReturnValue({
        data: mockProgressMap,
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterListScreen />)

      expect(getByTestId('chapter-progress-101')).toHaveTextContent('45%')
      expect(getByTestId('chapter-progress-102')).toHaveTextContent('80%')
    })

    it('shows 0% for chapters without progress data', () => {
      mockUseChapterProgress.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterListScreen />)

      expect(getByTestId('chapter-progress-101')).toHaveTextContent('0%')
      expect(getByTestId('chapter-progress-102')).toHaveTextContent('0%')
    })
  })

  describe('navigation', () => {
    /**
     * Story 3.5: Navigate to exercise type selection screen (updated from Story 3.4)
     * Chapter list now navigates to /chapter/[chapterId]/exercises instead of /quiz/[chapterId]
     */
    it('navigates to exercise type selection when chapter is pressed', () => {
      mockUseChapterProgress.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterListScreen />)

      fireEvent.press(getByTestId('chapter-list-item-101'))

      expect(mockPush).toHaveBeenCalledWith('/chapter/101/exercises')
    })

    /**
     * Story 3.4: Open Chapter Navigation (No Gates)
     * Verifies navigation works for any chapter without restrictions
     */
    it('navigates to any chapter without checking prerequisites (AC #2)', () => {
      mockUseChapterProgress.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterListScreen />)

      // Navigate to second chapter (102) with no progress on chapter 101
      fireEvent.press(getByTestId('chapter-list-item-102'))

      expect(mockPush).toHaveBeenCalledWith('/chapter/102/exercises')
    })

    it('allows navigation to chapter regardless of progress state', () => {
      // No progress data - simulates new user
      mockUseChapterProgress.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterListScreen />)

      // Both chapters should be navigable
      fireEvent.press(getByTestId('chapter-list-item-101'))
      expect(mockPush).toHaveBeenNthCalledWith(1, '/chapter/101/exercises')

      fireEvent.press(getByTestId('chapter-list-item-102'))
      expect(mockPush).toHaveBeenNthCalledWith(2, '/chapter/102/exercises')
    })
  })

  describe('error state', () => {
    it('shows error message when progress fetch fails', () => {
      mockUseChapterProgress.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
      })

      const { getByTestId } = render(<ChapterListScreen />)

      expect(getByTestId('chapter-list-error')).toBeTruthy()
    })
  })

  describe('book header', () => {
    it('displays book Chinese title', () => {
      mockUseChapterProgress.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterListScreen />)

      expect(getByTestId('book-chinese-title')).toHaveTextContent('第一册')
    })

    it('displays chapter count', () => {
      mockUseChapterProgress.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterListScreen />)

      expect(getByTestId('chapter-count')).toHaveTextContent('2 chapters')
    })
  })

  /**
   * Story 3.6: Expand Book Selection to Books 1-4
   * Tests for Books 3 and 4 with 12 chapters each (AC #4)
   */
  describe('Story 3.6: Books 3 and 4 chapter list (AC #4)', () => {
    it('displays 12 chapters for Book 3', () => {
      mockUseLocalSearchParams.mockReturnValue({ bookId: '3' })
      mockUseChapterProgress.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterListScreen />)

      expect(getByTestId('chapter-count')).toHaveTextContent('12 chapters')
    })

    it('displays Book 3 Chinese title in header', () => {
      mockUseLocalSearchParams.mockReturnValue({ bookId: '3' })
      mockUseChapterProgress.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterListScreen />)

      expect(getByTestId('book-chinese-title')).toHaveTextContent('第三册')
    })

    it('renders all 12 chapter items for Book 3', () => {
      mockUseLocalSearchParams.mockReturnValue({ bookId: '3' })
      mockUseChapterProgress.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterListScreen />)

      // Verify all 12 chapters are rendered (IDs 301-312)
      for (let i = 1; i <= 12; i++) {
        expect(getByTestId(`chapter-list-item-${300 + i}`)).toBeTruthy()
      }
    })

    it('navigates to exercises for Book 3 chapters', () => {
      mockUseLocalSearchParams.mockReturnValue({ bookId: '3' })
      mockUseChapterProgress.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterListScreen />)

      fireEvent.press(getByTestId('chapter-list-item-301'))

      expect(mockPush).toHaveBeenCalledWith('/chapter/301/exercises')
    })

    it('navigates to exercises for Book 4 chapters', () => {
      // Book 4 uses same 12-chapter structure as Book 3
      const mockChaptersBook4 = Array.from({ length: 12 }, (_, i) => ({
        id: 401 + i,
        bookId: 4,
        chapterNumber: i + 1,
        titleEnglish: `Book 4 Chapter ${i + 1}`,
        titleChinese: `第四冊第${i + 1}課`,
      }))
      mockUseChapters.mockImplementation((bookId: number) => {
        if (bookId === 4) return mockChaptersBook4
        return mockChaptersBook1
      })
      mockUseLocalSearchParams.mockReturnValue({ bookId: '4' })
      mockUseChapterProgress.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterListScreen />)

      fireEvent.press(getByTestId('chapter-list-item-401'))

      expect(mockPush).toHaveBeenCalledWith('/chapter/401/exercises')
    })
  })
})
