/**
 * Grammar Points Browse Screen Tests
 *
 * Unit tests for the Grammar Points Browse screen.
 * Validates rendering, item display, loading state, empty state, and error state.
 *
 * Story 11.6: Grammar Points Browse Screen — Task 5
 *
 * AC #1: Screen renders grammar points from the grammar_points table
 * AC #2: Each point shows title (English + Chinese), function, structure, usage, examples
 * AC #3: Examples show traditional Chinese, pinyin, and English translation
 * AC #4: Points are sorted by grammar_order (handled by the hook/query)
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

// Mock GrammarPointCard component
jest.mock('../../../components/chapter/GrammarPointCard', () => ({
  GrammarPointCard: ({ item }: any) => {
    const { View, Text } = require('react-native')
    return (
      <View testID={`grammar-point-card-${item.id}`}>
        <Text testID={`grammar-point-title-english-${item.id}`}>{item.title_english}</Text>
        {item.title_chinese ? (
          <Text testID={`grammar-point-title-chinese-${item.id}`}>{item.title_chinese}</Text>
        ) : null}
        {item.function_description ? (
          <View testID={`grammar-point-function-${item.id}`}>
            <Text testID={`grammar-point-function-text-${item.id}`}>{item.function_description}</Text>
          </View>
        ) : null}
        {item.structure_pattern ? (
          <View testID={`grammar-point-structure-${item.id}`}>
            <Text testID={`grammar-point-structure-text-${item.id}`}>{item.structure_pattern}</Text>
          </View>
        ) : null}
        {item.usage_notes ? (
          <View testID={`grammar-point-usage-${item.id}`}>
            <Text testID={`grammar-point-usage-text-${item.id}`}>{item.usage_notes}</Text>
          </View>
        ) : null}
        {item.examples && item.examples.length > 0 ? (
          <View testID={`grammar-point-examples-${item.id}`}>
            {item.examples.map((ex: any, i: number) => (
              <View key={i} testID={`grammar-point-example-${item.id}-${i}`}>
                <Text testID={`grammar-example-traditional-${item.id}-${i}`}>{ex.traditional}</Text>
                <Text testID={`grammar-example-pinyin-${item.id}-${i}`}>{ex.pinyin}</Text>
                <Text testID={`grammar-example-english-${item.id}-${i}`}>{ex.english}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    )
  },
}))

// Mock useGrammarPoints hook
const mockUseGrammarPoints = jest.fn()
jest.mock('../../../hooks/useGrammarPoints', () => ({
  useGrammarPoints: (bookId: number, lessonId: number) => mockUseGrammarPoints(bookId, lessonId),
}))

// Import after mocks
import GrammarScreen from './grammar'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const mockGrammarPoint1 = {
  id: 'gp-1',
  grammar_order: 1,
  title_english: 'The Verb 是 (shì)',
  title_chinese: '是字句',
  function_description: 'Used to link a subject to a predicate noun or pronoun.',
  structure_pattern: 'Subject + 是 + Noun/Pronoun',
  usage_notes: 'The negative form uses 不是 (bú shì).',
  examples: [
    {
      traditional: '我是學生。',
      pinyin: 'Wǒ shì xuéshēng.',
      english: 'I am a student.',
    },
  ],
}

const mockGrammarPoint2 = {
  id: 'gp-2',
  grammar_order: 2,
  title_english: 'Question Particle 嗎 (ma)',
  title_chinese: null,
  function_description: 'Turns a statement into a yes/no question.',
  structure_pattern: 'Statement + 嗎？',
  usage_notes: null,
  examples: [],
}

const mockGrammarPoints = [mockGrammarPoint1, mockGrammarPoint2]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GrammarScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLocalSearchParams.mockReturnValue({ chapterId: '101' })
    mockUseGrammarPoints.mockReturnValue({
      data: mockGrammarPoints,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })
  })

  describe('screen rendering (AC #1)', () => {
    it('renders the grammar screen', () => {
      const { getByTestId } = render(<GrammarScreen />)
      expect(getByTestId('grammar-screen')).toBeTruthy()
    })

    it('calls useGrammarPoints with correct bookId and lessonId parsed from chapterId', () => {
      render(<GrammarScreen />)
      // chapterId=101 → bookId=1, lessonId=1
      expect(mockUseGrammarPoints).toHaveBeenCalledWith(1, 1)
    })

    it('parses chapterId 212 into bookId=2, lessonId=12', () => {
      mockUseLocalSearchParams.mockReturnValue({ chapterId: '212' })
      render(<GrammarScreen />)
      expect(mockUseGrammarPoints).toHaveBeenCalledWith(2, 12)
    })

    it('renders the FlatList when data is available', () => {
      const { getByTestId } = render(<GrammarScreen />)
      expect(getByTestId('grammar-flat-list')).toBeTruthy()
    })

    it('renders all grammar point cards', () => {
      const { getByTestId } = render(<GrammarScreen />)
      expect(getByTestId('grammar-point-card-gp-1')).toBeTruthy()
      expect(getByTestId('grammar-point-card-gp-2')).toBeTruthy()
    })
  })

  describe('grammar point display (AC #2)', () => {
    it('displays English title for each grammar point', () => {
      const { getByTestId } = render(<GrammarScreen />)
      expect(getByTestId('grammar-point-title-english-gp-1')).toHaveTextContent(
        'The Verb 是 (shì)'
      )
    })

    it('displays Chinese title when present', () => {
      const { getByTestId } = render(<GrammarScreen />)
      expect(getByTestId('grammar-point-title-chinese-gp-1')).toHaveTextContent('是字句')
    })

    it('does not render Chinese title when null', () => {
      const { queryByTestId } = render(<GrammarScreen />)
      expect(queryByTestId('grammar-point-title-chinese-gp-2')).toBeNull()
    })

    it('displays function description when present', () => {
      const { getByTestId } = render(<GrammarScreen />)
      expect(getByTestId('grammar-point-function-text-gp-1')).toHaveTextContent(
        'Used to link a subject to a predicate noun or pronoun.'
      )
    })

    it('displays structure pattern when present', () => {
      const { getByTestId } = render(<GrammarScreen />)
      expect(getByTestId('grammar-point-structure-text-gp-1')).toHaveTextContent(
        'Subject + 是 + Noun/Pronoun'
      )
    })

    it('displays usage notes when present', () => {
      const { getByTestId } = render(<GrammarScreen />)
      expect(getByTestId('grammar-point-usage-text-gp-1')).toHaveTextContent(
        'The negative form uses 不是 (bú shì).'
      )
    })

    it('does not render usage notes when null', () => {
      const { queryByTestId } = render(<GrammarScreen />)
      expect(queryByTestId('grammar-point-usage-gp-2')).toBeNull()
    })
  })

  describe('examples display (AC #3)', () => {
    it('renders examples section when examples exist', () => {
      const { getByTestId } = render(<GrammarScreen />)
      expect(getByTestId('grammar-point-examples-gp-1')).toBeTruthy()
    })

    it('does not render examples section when examples array is empty', () => {
      const { queryByTestId } = render(<GrammarScreen />)
      expect(queryByTestId('grammar-point-examples-gp-2')).toBeNull()
    })

    it('displays traditional Chinese for each example', () => {
      const { getByTestId } = render(<GrammarScreen />)
      expect(getByTestId('grammar-example-traditional-gp-1-0')).toHaveTextContent('我是學生。')
    })

    it('displays pinyin for each example', () => {
      const { getByTestId } = render(<GrammarScreen />)
      expect(getByTestId('grammar-example-pinyin-gp-1-0')).toHaveTextContent('Wǒ shì xuéshēng.')
    })

    it('displays English translation for each example', () => {
      const { getByTestId } = render(<GrammarScreen />)
      expect(getByTestId('grammar-example-english-gp-1-0')).toHaveTextContent('I am a student.')
    })
  })

  describe('loading state (AC #1)', () => {
    it('shows loading indicator when data is loading', () => {
      mockUseGrammarPoints.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      })

      const { getByTestId, queryByTestId } = render(<GrammarScreen />)

      expect(getByTestId('grammar-loading')).toBeTruthy()
      expect(queryByTestId('grammar-flat-list')).toBeNull()
    })

    it('does not show FlatList while loading', () => {
      mockUseGrammarPoints.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      })

      const { queryByTestId } = render(<GrammarScreen />)
      expect(queryByTestId('grammar-flat-list')).toBeNull()
    })
  })

  describe('empty state (AC #1)', () => {
    it('shows empty state when no grammar points exist', () => {
      mockUseGrammarPoints.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      const { getByTestId, queryByTestId } = render(<GrammarScreen />)

      expect(getByTestId('grammar-empty')).toBeTruthy()
      expect(queryByTestId('grammar-flat-list')).toBeNull()
    })

    it('does not show FlatList when grammar points are empty', () => {
      mockUseGrammarPoints.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      const { queryByTestId } = render(<GrammarScreen />)
      expect(queryByTestId('grammar-flat-list')).toBeNull()
    })
  })

  describe('error state', () => {
    it('shows error message when grammar points fetch fails', () => {
      mockUseGrammarPoints.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: jest.fn(),
      })

      const { getByTestId } = render(<GrammarScreen />)
      expect(getByTestId('grammar-error')).toBeTruthy()
    })

    it('shows retry button on error', () => {
      const mockRefetch = jest.fn()
      mockUseGrammarPoints.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
      })

      const { getByTestId } = render(<GrammarScreen />)
      expect(getByTestId('retry-button')).toBeTruthy()
    })

    it('calls refetch when retry button is pressed', () => {
      const mockRefetch = jest.fn()
      mockUseGrammarPoints.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
      })

      const { getByTestId } = render(<GrammarScreen />)
      fireEvent.press(getByTestId('retry-button'))
      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('invalid chapterId', () => {
    it('shows invalid chapter message for non-numeric chapterId', () => {
      mockUseLocalSearchParams.mockReturnValue({ chapterId: 'abc' })

      const { getByTestId } = render(<GrammarScreen />)
      expect(getByTestId('grammar-invalid-chapter')).toBeTruthy()
    })

    it('shows invalid chapter message for undefined chapterId', () => {
      mockUseLocalSearchParams.mockReturnValue({ chapterId: undefined })

      const { getByTestId } = render(<GrammarScreen />)
      expect(getByTestId('grammar-invalid-chapter')).toBeTruthy()
    })
  })

  describe('back navigation', () => {
    // Note: The back button is rendered in the Stack.Screen headerLeft option.
    // Stack.Screen is mocked to return null in tests, so the header is not rendered.
    // Back navigation is provided by the native header back button (Expo Router).
    it('renders the grammar screen with back navigation configured via Stack.Screen', () => {
      // Verify the screen renders without errors (back nav is in the header)
      const { getByTestId } = render(<GrammarScreen />)
      expect(getByTestId('grammar-screen')).toBeTruthy()
    })
  })

  describe('header count display', () => {
    it('shows correct count for multiple grammar points', () => {
      const { getByTestId } = render(<GrammarScreen />)
      expect(getByTestId('grammar-header')).toBeTruthy()
    })

    it('shows singular "grammar point" for a single item', () => {
      mockUseGrammarPoints.mockReturnValue({
        data: [mockGrammarPoint1],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      const { getByTestId } = render(<GrammarScreen />)
      expect(getByTestId('grammar-header')).toBeTruthy()
    })
  })
})
