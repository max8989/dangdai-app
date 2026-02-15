/**
 * Chapter Detail / Quiz Screen Tests
 *
 * Integration tests for the Chapter Detail screen (quiz start screen).
 * Validates chapter info display, quiz type selection, progress display,
 * and mastery status handling.
 *
 * Story 3.4: Open Chapter Navigation (No Gates)
 *
 * AC #1: User can start quiz for any chapter regardless of completion status
 * AC #2: New user can navigate to any chapter immediately
 * AC #3: Chapter screen shows vocabulary and grammar quiz options
 * AC #4: User can retake quizzes, previous progress preserved
 * AC #5: Mastered chapters can still be practiced, status remains visible
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'

// Mock expo-router
const mockPush = jest.fn()
const mockBack = jest.fn()
const mockUseLocalSearchParams = jest.fn()
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => ({ push: mockPush, back: mockBack }),
  Stack: {
    Screen: ({ options }: any) => null,
  },
}))

// Mock Tamagui components
jest.mock('tamagui', () => {
  const { View, Text, TouchableOpacity, ActivityIndicator } = require('react-native')

  return {
    YStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    XStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    Text: ({ children, testID, ...props }: any) => <Text testID={testID}>{children}</Text>,
    H2: ({ children, testID }: any) => <Text testID={testID}>{children}</Text>,
    Button: ({ children, onPress, testID, icon }: any) => (
      <TouchableOpacity testID={testID} onPress={onPress}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
    Card: ({ children, onPress, testID }: any) => (
      <TouchableOpacity testID={testID} onPress={onPress}>
        {children}
      </TouchableOpacity>
    ),
    Spinner: ({ testID }: any) => <ActivityIndicator testID={testID} />,
  }
})

// Mock lucide icons
jest.mock('@tamagui/lucide-icons', () => {
  const { View } = require('react-native')
  return {
    ChevronLeft: () => null,
    BookOpen: () => null,
    MessageSquare: () => null,
    Trophy: ({ testID }: any) => <View testID={testID} />,
  }
})

// Mock useChapter hook
const mockUseChapter = jest.fn()
jest.mock('../../hooks/useChapters', () => ({
  useChapter: (chapterId: number) => mockUseChapter(chapterId),
}))

// Mock useChapterProgress
const mockUseChapterProgress = jest.fn()
jest.mock('../../hooks/useChapterProgress', () => ({
  useChapterProgress: (bookId: number) => mockUseChapterProgress(bookId),
}))

// Mock BOOKS constant
jest.mock('../../constants/books', () => ({
  BOOKS: [
    { id: 1, title: 'Book 1', titleChinese: '當代中文課程 第一冊', chapterCount: 15, coverColor: '$blue9' },
    { id: 2, title: 'Book 2', titleChinese: '當代中文課程 第二冊', chapterCount: 15, coverColor: '$green9' },
  ],
}))

// Mock useAuth
jest.mock('../../providers/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}))

// Import after mocks
import ChapterDetailScreen from './[chapterId]'

const mockChapter = {
  id: 210,
  bookId: 2,
  chapterNumber: 10,
  titleEnglish: 'Celebrations',
  titleChinese: '庆祝',
}

describe('ChapterDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLocalSearchParams.mockReturnValue({ chapterId: '210' })
    mockUseChapter.mockReturnValue(mockChapter)
    mockUseChapterProgress.mockReturnValue({
      data: {},
      isLoading: false,
      error: null,
    })
  })

  describe('chapter info display (AC #1, #3 - subtask 1.2)', () => {
    it('renders chapter detail screen', () => {
      const { getByTestId } = render(<ChapterDetailScreen />)
      expect(getByTestId('chapter-detail-screen')).toBeTruthy()
    })

    it('displays chapter title in English', () => {
      const { getByTestId } = render(<ChapterDetailScreen />)
      expect(getByTestId('chapter-title-english')).toHaveTextContent('Celebrations')
    })

    it('displays chapter title in Chinese', () => {
      const { getByTestId } = render(<ChapterDetailScreen />)
      expect(getByTestId('chapter-title-chinese')).toHaveTextContent('庆祝')
    })

    it('displays book info', () => {
      const { getByTestId } = render(<ChapterDetailScreen />)
      // Book info contains both English and Chinese title
      const bookInfo = getByTestId('book-info')
      expect(bookInfo).toHaveTextContent(/Book 2/)
      expect(bookInfo).toHaveTextContent(/當代中文課程 第二冊/)
    })

    it('shows "Chapter not found" for invalid chapter ID', () => {
      mockUseChapter.mockReturnValue(undefined)
      const { getByTestId } = render(<ChapterDetailScreen />)
      expect(getByTestId('chapter-not-found')).toBeTruthy()
    })

    it('shows "Chapter not found" for non-numeric chapterId param', () => {
      mockUseLocalSearchParams.mockReturnValue({ chapterId: 'abc' })
      const { getByTestId } = render(<ChapterDetailScreen />)
      expect(getByTestId('chapter-not-found')).toBeTruthy()
    })

    it('shows "Chapter not found" for undefined chapterId param', () => {
      mockUseLocalSearchParams.mockReturnValue({ chapterId: undefined })
      const { getByTestId } = render(<ChapterDetailScreen />)
      expect(getByTestId('chapter-not-found')).toBeTruthy()
    })

    it('shows "Chapter not found" for negative chapterId', () => {
      mockUseLocalSearchParams.mockReturnValue({ chapterId: '-5' })
      const { getByTestId } = render(<ChapterDetailScreen />)
      expect(getByTestId('chapter-not-found')).toBeTruthy()
    })
  })

  describe('quiz type selection (AC #3 - subtasks 1.3, 1.4)', () => {
    it('renders vocabulary quiz button', () => {
      const { getByTestId } = render(<ChapterDetailScreen />)
      expect(getByTestId('vocabulary-quiz-button')).toBeTruthy()
    })

    it('renders grammar quiz button', () => {
      const { getByTestId } = render(<ChapterDetailScreen />)
      expect(getByTestId('grammar-quiz-button')).toBeTruthy()
    })

    it('navigates to quiz loading with vocabulary type when vocabulary button pressed', () => {
      const { getByTestId } = render(<ChapterDetailScreen />)

      fireEvent.press(getByTestId('vocabulary-quiz-button'))

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/quiz/loading',
        params: {
          chapterId: '210',
          bookId: '2',
          quizType: 'vocabulary',
        },
      })
    })

    it('navigates to quiz loading with grammar type when grammar button pressed', () => {
      const { getByTestId } = render(<ChapterDetailScreen />)

      fireEvent.press(getByTestId('grammar-quiz-button'))

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/quiz/loading',
        params: {
          chapterId: '210',
          bookId: '2',
          quizType: 'grammar',
        },
      })
    })
  })

  describe('progress display (AC #4 - subtask 1.5, 3.1)', () => {
    it('shows progress card when user has progress', () => {
      mockUseChapterProgress.mockReturnValue({
        data: { 210: { completionPercentage: 45 } },
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterDetailScreen />)
      expect(getByTestId('progress-card')).toBeTruthy()
    })

    it('does not show progress card when no progress', () => {
      mockUseChapterProgress.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      const { queryByTestId } = render(<ChapterDetailScreen />)
      expect(queryByTestId('progress-card')).toBeNull()
    })

    it('displays current completion percentage', () => {
      mockUseChapterProgress.mockReturnValue({
        data: { 210: { completionPercentage: 45 } },
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterDetailScreen />)
      // Progress text shows percentage with "complete" suffix
      expect(getByTestId('progress-percentage')).toHaveTextContent('45% complete')
    })
  })

  describe('mastered status (AC #5 - subtasks 4.1, 4.3)', () => {
    it('shows mastered badge when completion is 80% or more', () => {
      mockUseChapterProgress.mockReturnValue({
        data: { 210: { completionPercentage: 80 } },
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterDetailScreen />)
      expect(getByTestId('mastered-badge')).toBeTruthy()
    })

    it('shows mastered badge at exactly 80%', () => {
      mockUseChapterProgress.mockReturnValue({
        data: { 210: { completionPercentage: 80 } },
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterDetailScreen />)
      expect(getByTestId('mastered-badge')).toBeTruthy()
    })

    it('shows mastered badge at 100%', () => {
      mockUseChapterProgress.mockReturnValue({
        data: { 210: { completionPercentage: 100 } },
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterDetailScreen />)
      expect(getByTestId('mastered-badge')).toBeTruthy()
    })

    it('does not show mastered badge when completion is below 80%', () => {
      mockUseChapterProgress.mockReturnValue({
        data: { 210: { completionPercentage: 79 } },
        isLoading: false,
        error: null,
      })

      const { queryByTestId } = render(<ChapterDetailScreen />)
      expect(queryByTestId('mastered-badge')).toBeNull()
    })

    it('shows "Practice Again" label when mastered', () => {
      mockUseChapterProgress.mockReturnValue({
        data: { 210: { completionPercentage: 85 } },
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterDetailScreen />)
      expect(getByTestId('quiz-section-label')).toHaveTextContent('Practice Again')
    })

    it('shows "Start Learning" label when not mastered', () => {
      mockUseChapterProgress.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterDetailScreen />)
      expect(getByTestId('quiz-section-label')).toHaveTextContent('Start Learning')
    })

    it('allows starting quiz even when mastered (AC #5)', () => {
      mockUseChapterProgress.mockReturnValue({
        data: { 210: { completionPercentage: 100 } },
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterDetailScreen />)

      fireEvent.press(getByTestId('vocabulary-quiz-button'))

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/quiz/loading',
        params: {
          chapterId: '210',
          bookId: '2',
          quizType: 'vocabulary',
        },
      })
    })
  })

  describe('retaking quizzes (AC #4 - subtasks 3.2, 3.3)', () => {
    it('allows starting quiz when progress exists (retake)', () => {
      mockUseChapterProgress.mockReturnValue({
        data: { 210: { completionPercentage: 45 } },
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterDetailScreen />)

      fireEvent.press(getByTestId('vocabulary-quiz-button'))

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/quiz/loading',
        params: {
          chapterId: '210',
          bookId: '2',
          quizType: 'vocabulary',
        },
      })
    })

    it('quiz buttons remain enabled regardless of progress', () => {
      mockUseChapterProgress.mockReturnValue({
        data: { 210: { completionPercentage: 100 } },
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterDetailScreen />)

      // Both buttons should be pressable
      expect(getByTestId('vocabulary-quiz-button')).toBeTruthy()
      expect(getByTestId('grammar-quiz-button')).toBeTruthy()
    })
  })

  describe('no gating (AC #1, #2)', () => {
    it('renders normally for any chapter without prerequisites check', () => {
      // Simulate accessing Book 2 Chapter 10 as a new user (no progress)
      mockUseLocalSearchParams.mockReturnValue({ chapterId: '210' })
      mockUseChapter.mockReturnValue(mockChapter)
      mockUseChapterProgress.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      const { getByTestId, queryByTestId } = render(<ChapterDetailScreen />)

      // Should render chapter detail without any lock/unlock messages
      expect(getByTestId('chapter-detail-screen')).toBeTruthy()
      expect(queryByTestId('unlock-message')).toBeNull()
      expect(queryByTestId('locked-indicator')).toBeNull()
    })

    it('does not show any unlock requirements', () => {
      const { queryByText, queryByTestId } = render(<ChapterDetailScreen />)

      expect(queryByText(/unlock/i)).toBeNull()
      expect(queryByText(/complete previous/i)).toBeNull()
      expect(queryByText(/locked/i)).toBeNull()
      expect(queryByTestId('lock-icon')).toBeNull()
    })
  })

  describe('helper text for new users', () => {
    it('shows helper text when user has no progress', () => {
      mockUseChapterProgress.mockReturnValue({
        data: {},
        isLoading: false,
        error: null,
      })

      const { getByTestId } = render(<ChapterDetailScreen />)
      expect(getByTestId('new-user-helper-text')).toBeTruthy()
    })

    it('does not show helper text when user has progress', () => {
      mockUseChapterProgress.mockReturnValue({
        data: { 210: { completionPercentage: 45 } },
        isLoading: false,
        error: null,
      })

      const { queryByTestId } = render(<ChapterDetailScreen />)
      expect(queryByTestId('new-user-helper-text')).toBeNull()
    })
  })
})
