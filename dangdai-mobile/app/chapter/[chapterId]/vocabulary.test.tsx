/**
 * Vocabulary Browse Screen Tests
 *
 * Unit tests for the Vocabulary Browse screen.
 * Validates rendering, section grouping, item display, loading state, and empty state.
 *
 * Story 11.5: Vocabulary Browse Screen — Task 6
 *
 * AC #1: Screen renders vocabulary items from the vocabulary table
 * AC #2: Each item shows traditional character, pinyin, English, POS tag
 * AC #3: Items are grouped by vocabulary section (Vocab I, Vocab II) with headers
 * AC #4: Items are sorted by sort_order (original textbook order)
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'

// Mock expo-router
const mockBack = jest.fn()
const mockUseLocalSearchParams = jest.fn()
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => ({ back: mockBack }),
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
    Text: ({ children, testID }: any) => <Text testID={testID}>{children}</Text>,
    H3: ({ children, testID }: any) => <Text testID={testID}>{children}</Text>,
    Button: ({ children, onPress, testID, icon }: any) => (
      <TouchableOpacity testID={testID} onPress={onPress}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
    Spinner: ({ testID }: any) => <ActivityIndicator testID={testID} />,
  }
})

// Mock lucide icons
jest.mock('@tamagui/lucide-icons', () => ({
  ChevronLeft: () => null,
  AlertCircle: () => null,
  RefreshCw: () => null,
}))

// Mock VocabularyItem component
jest.mock('../../../components/chapter/VocabularyItem', () => ({
  VocabularyItem: ({ item }: any) => {
    const { View, Text } = require('react-native')
    return (
      <View testID={`vocabulary-item-${item.id}`}>
        <Text testID={`vocabulary-traditional-${item.id}`}>{item.traditional}</Text>
        <Text testID={`vocabulary-pinyin-${item.id}`}>{item.pinyin}</Text>
        <Text testID={`vocabulary-english-${item.id}`}>{item.english}</Text>
        {item.part_of_speech ? (
          <Text testID={`vocabulary-pos-${item.id}`}>{item.part_of_speech}</Text>
        ) : null}
        {item.is_name ? (
          <Text testID={`vocabulary-name-indicator-${item.id}`}>Name</Text>
        ) : null}
      </View>
    )
  },
}))

// Mock useVocabulary hook
const mockUseVocabulary = jest.fn()
jest.mock('../../../hooks/useVocabulary', () => ({
  useVocabulary: (bookId: number, lessonId: number) => mockUseVocabulary(bookId, lessonId),
}))

// Import after mocks
import VocabularyScreen from './vocabulary'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const mockVocabItemSection1 = {
  id: 'vocab-1',
  traditional: '你好',
  pinyin: 'nǐ hǎo',
  english: 'hello',
  part_of_speech: 'Intj',
  is_name: false,
  vocab_section: 'I' as const,
  sort_order: 1,
}

const mockVocabItemSection2 = {
  id: 'vocab-2',
  traditional: '謝謝',
  pinyin: 'xiè xiè',
  english: 'thank you',
  part_of_speech: 'Intj',
  is_name: false,
  vocab_section: 'II' as const,
  sort_order: 1,
}

const mockVocabNameItem = {
  id: 'vocab-3',
  traditional: '台灣',
  pinyin: 'Táiwān',
  english: 'Taiwan',
  part_of_speech: 'N',
  is_name: true,
  vocab_section: 'I' as const,
  sort_order: 2,
}

const mockSections = [
  {
    title: 'Vocab I',
    key: 'I' as const,
    data: [mockVocabItemSection1, mockVocabNameItem],
  },
  {
    title: 'Vocab II',
    key: 'II' as const,
    data: [mockVocabItemSection2],
  },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('VocabularyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLocalSearchParams.mockReturnValue({ chapterId: '101' })
    mockUseVocabulary.mockReturnValue({
      data: mockSections,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })
  })

  describe('screen rendering (AC #1)', () => {
    it('renders the vocabulary screen', () => {
      const { getByTestId } = render(<VocabularyScreen />)
      expect(getByTestId('vocabulary-screen')).toBeTruthy()
    })

    it('calls useVocabulary with correct bookId and lessonId parsed from chapterId', () => {
      render(<VocabularyScreen />)
      // chapterId=101 → bookId=1, lessonId=1
      expect(mockUseVocabulary).toHaveBeenCalledWith(1, 1)
    })

    it('parses chapterId 212 into bookId=2, lessonId=12', () => {
      mockUseLocalSearchParams.mockReturnValue({ chapterId: '212' })
      render(<VocabularyScreen />)
      expect(mockUseVocabulary).toHaveBeenCalledWith(2, 12)
    })

    it('renders the SectionList when data is available', () => {
      const { getByTestId } = render(<VocabularyScreen />)
      expect(getByTestId('vocabulary-section-list')).toBeTruthy()
    })
  })

  describe('vocabulary items display (AC #2)', () => {
    it('renders vocabulary items from section I', () => {
      const { getByTestId } = render(<VocabularyScreen />)
      expect(getByTestId('vocabulary-item-vocab-1')).toBeTruthy()
    })

    it('renders vocabulary items from section II', () => {
      const { getByTestId } = render(<VocabularyScreen />)
      expect(getByTestId('vocabulary-item-vocab-2')).toBeTruthy()
    })

    it('displays traditional character for each item', () => {
      const { getByTestId } = render(<VocabularyScreen />)
      expect(getByTestId('vocabulary-traditional-vocab-1')).toHaveTextContent('你好')
    })

    it('displays pinyin for each item', () => {
      const { getByTestId } = render(<VocabularyScreen />)
      expect(getByTestId('vocabulary-pinyin-vocab-1')).toHaveTextContent('nǐ hǎo')
    })

    it('displays English definition for each item', () => {
      const { getByTestId } = render(<VocabularyScreen />)
      expect(getByTestId('vocabulary-english-vocab-1')).toHaveTextContent('hello')
    })

    it('displays part of speech tag for items that have one', () => {
      const { getByTestId } = render(<VocabularyScreen />)
      expect(getByTestId('vocabulary-pos-vocab-1')).toHaveTextContent('Intj')
    })

    it('shows name indicator for is_name entries', () => {
      const { getByTestId } = render(<VocabularyScreen />)
      expect(getByTestId('vocabulary-name-indicator-vocab-3')).toHaveTextContent('Name')
    })
  })

  describe('section grouping (AC #3)', () => {
    it('renders Vocab I section header', () => {
      const { getByTestId } = render(<VocabularyScreen />)
      expect(getByTestId('vocabulary-section-header-I')).toBeTruthy()
    })

    it('renders Vocab II section header', () => {
      const { getByTestId } = render(<VocabularyScreen />)
      expect(getByTestId('vocabulary-section-header-II')).toBeTruthy()
    })

    it('shows item count for Vocab I section', () => {
      const { getByTestId } = render(<VocabularyScreen />)
      // Section I has 2 items
      expect(getByTestId('vocabulary-section-count-I')).toHaveTextContent('2 words')
    })

    it('shows item count for Vocab II section', () => {
      const { getByTestId } = render(<VocabularyScreen />)
      // Section II has 1 item
      expect(getByTestId('vocabulary-section-count-II')).toHaveTextContent('1 word')
    })
  })

  describe('loading state (AC #1)', () => {
    it('shows loading indicator when data is loading', () => {
      mockUseVocabulary.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      })

      const { getByTestId, queryByTestId } = render(<VocabularyScreen />)

      expect(getByTestId('vocabulary-loading')).toBeTruthy()
      expect(queryByTestId('vocabulary-section-list')).toBeNull()
    })

    it('does not show section list while loading', () => {
      mockUseVocabulary.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      })

      const { queryByTestId } = render(<VocabularyScreen />)
      expect(queryByTestId('vocabulary-section-list')).toBeNull()
    })
  })

  describe('empty state (AC #1)', () => {
    it('shows empty state when no vocabulary exists', () => {
      mockUseVocabulary.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      const { getByTestId, queryByTestId } = render(<VocabularyScreen />)

      expect(getByTestId('vocabulary-empty')).toBeTruthy()
      expect(queryByTestId('vocabulary-section-list')).toBeNull()
    })

    it('does not show section list when vocabulary is empty', () => {
      mockUseVocabulary.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      const { queryByTestId } = render(<VocabularyScreen />)
      expect(queryByTestId('vocabulary-section-list')).toBeNull()
    })
  })

  describe('error state', () => {
    it('shows error message when vocabulary fetch fails', () => {
      mockUseVocabulary.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: jest.fn(),
      })

      const { getByTestId } = render(<VocabularyScreen />)
      expect(getByTestId('vocabulary-error')).toBeTruthy()
    })

    it('shows retry button on error', () => {
      const mockRefetch = jest.fn()
      mockUseVocabulary.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
      })

      const { getByTestId } = render(<VocabularyScreen />)
      expect(getByTestId('retry-button')).toBeTruthy()
    })

    it('calls refetch when retry button is pressed', () => {
      const mockRefetch = jest.fn()
      mockUseVocabulary.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
      })

      const { getByTestId } = render(<VocabularyScreen />)
      fireEvent.press(getByTestId('retry-button'))
      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('invalid chapterId', () => {
    it('shows invalid chapter message for non-numeric chapterId', () => {
      mockUseLocalSearchParams.mockReturnValue({ chapterId: 'abc' })

      const { getByTestId } = render(<VocabularyScreen />)
      expect(getByTestId('vocabulary-invalid-chapter')).toBeTruthy()
    })

    it('shows invalid chapter message for undefined chapterId', () => {
      mockUseLocalSearchParams.mockReturnValue({ chapterId: undefined })

      const { getByTestId } = render(<VocabularyScreen />)
      expect(getByTestId('vocabulary-invalid-chapter')).toBeTruthy()
    })
  })

  describe('back navigation', () => {
    // Note: The back button is rendered in the Stack.Screen headerLeft option.
    // Stack.Screen is mocked to return null in tests, so the header is not rendered.
    // Back navigation is provided by the native header back button (Expo Router).
    it('renders the vocabulary screen with back navigation configured via Stack.Screen', () => {
      // Verify the screen renders without errors (back nav is in the header)
      const { getByTestId } = render(<VocabularyScreen />)
      expect(getByTestId('vocabulary-screen')).toBeTruthy()
    })
  })
})
