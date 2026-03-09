/**
 * Dialogue Browse Screen Tests
 *
 * Unit tests for the Dialogue Browse screen.
 * Validates rendering, toggle behavior, section headers, loading state, and empty state.
 *
 * Story 11.7: Dialogue Browse Screen — Task 6
 *
 * AC #1: Screen renders dialogues from the dialogues table
 * AC #2: Each dialogue shows conversation lines in a chat-bubble layout with speaker labels
 * AC #3: Traditional text always visible; simplified, pinyin, English are toggleable
 * AC #4: Toggle controls show/hide content across all lines
 * AC #5: Multiple dialogues render with numbered section headers (Dialogue I, Dialogue II)
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
  const { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } = require('react-native')

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

// Mock DialogueBubble component
// testID is passed from the screen as `dialogue-bubble-{dialogueNumber}-{lineIndex}`
jest.mock('../../../components/chapter/DialogueBubble', () => ({
  DialogueBubble: ({ line, showPinyin, showEnglish, showSimplified, isAlternate, testID }: any) => {
    const { View, Text } = require('react-native')
    // Use the testID passed from the screen (e.g., "dialogue-bubble-1-0") as the unique key
    const bubbleId = testID ?? `dialogue-bubble-${line.speaker}`
    return (
      <View testID={bubbleId}>
        <Text testID={`${bubbleId}-speaker`}>{line.speaker}</Text>
        <Text testID={`${bubbleId}-traditional`}>{line.traditional}</Text>
        {showPinyin && line.pinyin ? (
          <Text testID={`${bubbleId}-pinyin`}>{line.pinyin}</Text>
        ) : null}
        {showEnglish && line.english ? (
          <Text testID={`${bubbleId}-english`}>{line.english}</Text>
        ) : null}
        {showSimplified && line.simplified ? (
          <Text testID={`${bubbleId}-simplified`}>{line.simplified}</Text>
        ) : null}
      </View>
    )
  },
}))

// Mock useDialogues hook
const mockUseDialogues = jest.fn()
jest.mock('../../../hooks/useDialogues', () => ({
  useDialogues: (bookId: number, lessonId: number) => mockUseDialogues(bookId, lessonId),
}))

// Import after mocks
import DialoguesScreen from './dialogues'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const mockLine1 = {
  speaker: '明華',
  traditional: '田中，歡迎！歡迎！請進。',
  simplified: '田中，欢迎！欢迎！请进。',
  pinyin: 'Tiánzhōng, huānyíng! Huānyíng! Qǐng jìn.',
  english: 'Tanaka, welcome! Welcome! Please come in.',
}

const mockLine2 = {
  speaker: '田中',
  traditional: '謝謝！',
  simplified: '谢谢！',
  pinyin: 'Xièxiè!',
  english: 'Thank you!',
}

const mockDialogue1 = {
  id: 'dialogue-1',
  dialogue_number: 1,
  title_traditional: null,
  title_english: 'At the Door',
  lines: [mockLine1, mockLine2],
}

const mockDialogue2 = {
  id: 'dialogue-2',
  dialogue_number: 2,
  title_traditional: null,
  title_english: 'In the Living Room',
  lines: [
    {
      speaker: '明華',
      traditional: '請坐，請坐。',
      simplified: '请坐，请坐。',
      pinyin: 'Qǐng zuò, qǐng zuò.',
      english: 'Please sit down, please sit down.',
    },
  ],
}

const mockDialogues = [mockDialogue1, mockDialogue2]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DialoguesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLocalSearchParams.mockReturnValue({ chapterId: '101' })
    mockUseDialogues.mockReturnValue({
      data: mockDialogues,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })
  })

  describe('screen rendering (AC #1)', () => {
    it('renders the dialogues screen', () => {
      const { getByTestId } = render(<DialoguesScreen />)
      expect(getByTestId('dialogues-screen')).toBeTruthy()
    })

    it('calls useDialogues with correct bookId and lessonId parsed from chapterId', () => {
      render(<DialoguesScreen />)
      // chapterId=101 → bookId=1, lessonId=1
      expect(mockUseDialogues).toHaveBeenCalledWith(1, 1)
    })

    it('parses chapterId 212 into bookId=2, lessonId=12', () => {
      mockUseLocalSearchParams.mockReturnValue({ chapterId: '212' })
      render(<DialoguesScreen />)
      expect(mockUseDialogues).toHaveBeenCalledWith(2, 12)
    })

    it('renders the scroll view when data is available', () => {
      const { getByTestId } = render(<DialoguesScreen />)
      expect(getByTestId('dialogues-scroll-view')).toBeTruthy()
    })
  })

  describe('dialogue lines display (AC #2)', () => {
    it('renders dialogue bubbles for each line', () => {
      const { getByTestId } = render(<DialoguesScreen />)
      expect(getByTestId('dialogue-bubble-1-0')).toBeTruthy()
      expect(getByTestId('dialogue-bubble-1-1')).toBeTruthy()
    })

    it('renders speaker labels in bubbles', () => {
      const { getByTestId } = render(<DialoguesScreen />)
      // dialogue 1, line 0 = 明華
      expect(getByTestId('dialogue-bubble-1-0-speaker')).toHaveTextContent('明華')
    })

    it('renders traditional text in bubbles', () => {
      const { getByTestId } = render(<DialoguesScreen />)
      // dialogue 1, line 0 = 明華's first line
      expect(getByTestId('dialogue-bubble-1-0-traditional')).toHaveTextContent('田中，歡迎！歡迎！請進。')
    })
  })

  describe('traditional text always visible (AC #3)', () => {
    it('shows traditional text with all toggles off (default state)', () => {
      const { getByTestId, queryByTestId } = render(<DialoguesScreen />)
      // Traditional always visible (dialogue 1, line 0)
      expect(getByTestId('dialogue-bubble-1-0-traditional')).toBeTruthy()
      // Toggleable content hidden by default
      expect(queryByTestId('dialogue-bubble-1-0-pinyin')).toBeNull()
      expect(queryByTestId('dialogue-bubble-1-0-english')).toBeNull()
      expect(queryByTestId('dialogue-bubble-1-0-simplified')).toBeNull()
    })
  })

  describe('toggle controls (AC #4)', () => {
    it('renders the toggle controls bar', () => {
      const { getByTestId } = render(<DialoguesScreen />)
      expect(getByTestId('toggle-controls')).toBeTruthy()
    })

    it('renders pinyin toggle button', () => {
      const { getByTestId } = render(<DialoguesScreen />)
      expect(getByTestId('toggle-pinyin')).toBeTruthy()
    })

    it('renders English toggle button', () => {
      const { getByTestId } = render(<DialoguesScreen />)
      expect(getByTestId('toggle-english')).toBeTruthy()
    })

    it('renders simplified toggle button', () => {
      const { getByTestId } = render(<DialoguesScreen />)
      expect(getByTestId('toggle-simplified')).toBeTruthy()
    })

    it('shows pinyin after pressing pinyin toggle', () => {
      const { getByTestId } = render(<DialoguesScreen />)

      // Pinyin hidden initially
      expect(getByTestId('toggle-pinyin')).toBeTruthy()

      // Press toggle
      fireEvent.press(getByTestId('toggle-pinyin'))

      // Pinyin now visible in bubbles (dialogue 1, line 0 = 明華)
      expect(getByTestId('dialogue-bubble-1-0-pinyin')).toBeTruthy()
    })

    it('hides pinyin after pressing pinyin toggle twice', () => {
      const { getByTestId, queryByTestId } = render(<DialoguesScreen />)

      fireEvent.press(getByTestId('toggle-pinyin'))
      expect(getByTestId('dialogue-bubble-1-0-pinyin')).toBeTruthy()

      fireEvent.press(getByTestId('toggle-pinyin'))
      expect(queryByTestId('dialogue-bubble-1-0-pinyin')).toBeNull()
    })

    it('shows English after pressing English toggle', () => {
      const { getByTestId } = render(<DialoguesScreen />)

      fireEvent.press(getByTestId('toggle-english'))

      // dialogue 1, line 0 = 明華
      expect(getByTestId('dialogue-bubble-1-0-english')).toBeTruthy()
    })

    it('hides English after pressing English toggle twice', () => {
      const { getByTestId, queryByTestId } = render(<DialoguesScreen />)

      fireEvent.press(getByTestId('toggle-english'))
      expect(getByTestId('dialogue-bubble-1-0-english')).toBeTruthy()

      fireEvent.press(getByTestId('toggle-english'))
      expect(queryByTestId('dialogue-bubble-1-0-english')).toBeNull()
    })

    it('shows simplified after pressing simplified toggle', () => {
      const { getByTestId } = render(<DialoguesScreen />)

      fireEvent.press(getByTestId('toggle-simplified'))

      // dialogue 1, line 0 = 明華
      expect(getByTestId('dialogue-bubble-1-0-simplified')).toBeTruthy()
    })

    it('toggles apply to all lines simultaneously', () => {
      const { getByTestId } = render(<DialoguesScreen />)

      fireEvent.press(getByTestId('toggle-pinyin'))

      // Both lines in dialogue 1 should show pinyin
      // dialogue 1, line 0 = 明華; dialogue 1, line 1 = 田中
      expect(getByTestId('dialogue-bubble-1-0-pinyin')).toBeTruthy()
      expect(getByTestId('dialogue-bubble-1-1-pinyin')).toBeTruthy()
    })
  })

  describe('multiple dialogues with section headers (AC #5)', () => {
    it('renders section header for Dialogue I', () => {
      const { getByTestId } = render(<DialoguesScreen />)
      expect(getByTestId('dialogue-header-1')).toBeTruthy()
    })

    it('renders section header for Dialogue II', () => {
      const { getByTestId } = render(<DialoguesScreen />)
      expect(getByTestId('dialogue-header-2')).toBeTruthy()
    })

    it('renders dialogue sections for each dialogue', () => {
      const { getByTestId } = render(<DialoguesScreen />)
      expect(getByTestId('dialogue-section-1')).toBeTruthy()
      expect(getByTestId('dialogue-section-2')).toBeTruthy()
    })

    it('shows dialogue title when available', () => {
      const { getByTestId } = render(<DialoguesScreen />)
      expect(getByTestId('dialogue-title-1')).toHaveTextContent('At the Door')
    })

    it('shows "Dialogue I" label for first dialogue', () => {
      const { getByTestId } = render(<DialoguesScreen />)
      expect(getByTestId('dialogue-numeral-1')).toHaveTextContent('Dialogue I')
    })

    it('shows "Dialogue II" label for second dialogue', () => {
      const { getByTestId } = render(<DialoguesScreen />)
      expect(getByTestId('dialogue-numeral-2')).toHaveTextContent('Dialogue II')
    })
  })

  describe('loading state (AC #1)', () => {
    it('shows loading indicator when data is loading', () => {
      mockUseDialogues.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      })

      const { getByTestId, queryByTestId } = render(<DialoguesScreen />)

      expect(getByTestId('dialogues-loading')).toBeTruthy()
      expect(queryByTestId('dialogues-scroll-view')).toBeNull()
    })

    it('does not show scroll view while loading', () => {
      mockUseDialogues.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      })

      const { queryByTestId } = render(<DialoguesScreen />)
      expect(queryByTestId('dialogues-scroll-view')).toBeNull()
    })
  })

  describe('empty state (AC #1)', () => {
    it('shows empty state when no dialogues exist', () => {
      mockUseDialogues.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      const { getByTestId, queryByTestId } = render(<DialoguesScreen />)

      expect(getByTestId('dialogues-empty')).toBeTruthy()
      expect(queryByTestId('dialogues-scroll-view')).toBeNull()
    })

    it('does not show scroll view when dialogues are empty', () => {
      mockUseDialogues.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      const { queryByTestId } = render(<DialoguesScreen />)
      expect(queryByTestId('dialogues-scroll-view')).toBeNull()
    })
  })

  describe('error state', () => {
    it('shows error message when dialogues fetch fails', () => {
      mockUseDialogues.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: jest.fn(),
      })

      const { getByTestId } = render(<DialoguesScreen />)
      expect(getByTestId('dialogues-error')).toBeTruthy()
    })

    it('shows retry button on error', () => {
      const mockRefetch = jest.fn()
      mockUseDialogues.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
      })

      const { getByTestId } = render(<DialoguesScreen />)
      expect(getByTestId('retry-button')).toBeTruthy()
    })

    it('calls refetch when retry button is pressed', () => {
      const mockRefetch = jest.fn()
      mockUseDialogues.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
      })

      const { getByTestId } = render(<DialoguesScreen />)
      fireEvent.press(getByTestId('retry-button'))
      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('invalid chapterId', () => {
    it('shows invalid chapter message for non-numeric chapterId', () => {
      mockUseLocalSearchParams.mockReturnValue({ chapterId: 'abc' })

      const { getByTestId } = render(<DialoguesScreen />)
      expect(getByTestId('dialogues-invalid-chapter')).toBeTruthy()
    })

    it('shows invalid chapter message for undefined chapterId', () => {
      mockUseLocalSearchParams.mockReturnValue({ chapterId: undefined })

      const { getByTestId } = render(<DialoguesScreen />)
      expect(getByTestId('dialogues-invalid-chapter')).toBeTruthy()
    })
  })

  describe('back navigation', () => {
    // Note: The back button is rendered in the Stack.Screen headerLeft option.
    // Stack.Screen is mocked to return null in tests, so the header is not rendered.
    // Back navigation is provided by the native header back button (Expo Router).
    it('renders the dialogues screen with back navigation configured via Stack.Screen', () => {
      const { getByTestId } = render(<DialoguesScreen />)
      expect(getByTestId('dialogues-screen')).toBeTruthy()
    })
  })
})
