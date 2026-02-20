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

  const Progress = ({ children, testID }: any) => <View testID={testID}>{children}</View>
  Progress.Indicator = ({ testID }: any) => <View testID={testID} />

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
    Progress,
  }
})

// Mock lucide icons
jest.mock('@tamagui/lucide-icons', () => ({
  ChevronRight: () => null,
  Check: ({ testID }: { testID?: string }) => {
    const { View } = require('react-native')
    return <View testID={testID} />
  },
}))

// Import after mocks are set up
import { ChapterListItem } from './ChapterListItem'

import type { ChapterProgress } from '../../types/chapter'

const mockChapter: Chapter = {
  id: 105,
  bookId: 1,
  chapterNumber: 5,
  titleEnglish: 'Beef Noodles Are Delicious',
  titleChinese: '牛肉麵真好吃',
}

// Progress test fixtures
const mockProgressNotStarted: ChapterProgress = {
  id: 'progress-1',
  userId: 'user-1',
  chapterId: 105,
  bookId: 1,
  completionPercentage: 0,
  masteredAt: null,
  updatedAt: '2026-02-15T00:00:00Z',
}

const mockProgressInProgress: ChapterProgress = {
  id: 'progress-2',
  userId: 'user-1',
  chapterId: 105,
  bookId: 1,
  completionPercentage: 45,
  masteredAt: null,
  updatedAt: '2026-02-15T00:00:00Z',
}

const mockProgressMastered: ChapterProgress = {
  id: 'progress-3',
  userId: 'user-1',
  chapterId: 105,
  bookId: 1,
  completionPercentage: 95,
  masteredAt: '2026-02-14T00:00:00Z',
  updatedAt: '2026-02-15T00:00:00Z',
}

const mockFirstChapter: Chapter = {
  id: 101,
  bookId: 1,
  chapterNumber: 1,
  titleEnglish: 'Welcome to Taiwan!',
  titleChinese: '歡迎你來臺灣！',
}

const mockBook3Chapter: Chapter = {
  id: 301,
  bookId: 3,
  chapterNumber: 1,
  titleEnglish: 'School Has Started',
  titleChinese: '開學了',
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

      expect(getByTestId('chapter-title-english-105')).toHaveTextContent('Beef Noodles Are Delicious')
    })

    it('renders Chinese title', () => {
      const { getByTestId } = render(
        <ChapterListItem chapter={mockChapter} onPress={mockOnPress} />
      )

      expect(getByTestId('chapter-title-chinese-105')).toHaveTextContent('牛肉麵真好吃')
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

    it('has descriptive accessibility label with English and Chinese titles', () => {
      const { getByTestId } = render(
        <ChapterListItem chapter={mockChapter} onPress={mockOnPress} />
      )

      const card = getByTestId('chapter-list-item-105')
      expect(card.props.accessibilityLabel).toBe('Chapter 5: Beef Noodles Are Delicious, 牛肉麵真好吃')
    })

    it('includes Chinese title in accessibility for bilingual context', () => {
      const { getByTestId } = render(
        <ChapterListItem chapter={mockFirstChapter} onPress={mockOnPress} />
      )

      const card = getByTestId('chapter-list-item-101')
      expect(card.props.accessibilityLabel).toBe('Chapter 1: Welcome to Taiwan!, 歡迎你來臺灣！')
    })
  })

  describe('different chapters', () => {
    it('renders first chapter correctly', () => {
      const { getByTestId } = render(
        <ChapterListItem chapter={mockFirstChapter} onPress={mockOnPress} />
      )

      expect(getByTestId('chapter-number-text-101')).toHaveTextContent('1')
      expect(getByTestId('chapter-title-english-101')).toHaveTextContent('Welcome to Taiwan!')
      expect(getByTestId('chapter-title-chinese-101')).toHaveTextContent('歡迎你來臺灣！')
    })

    it('renders chapter from different book correctly', () => {
      const { getByTestId } = render(
        <ChapterListItem chapter={mockBook3Chapter} onPress={mockOnPress} />
      )

      expect(getByTestId('chapter-number-text-301')).toHaveTextContent('1')
      expect(getByTestId('chapter-title-english-301')).toHaveTextContent('School Has Started')
      expect(getByTestId('chapter-title-chinese-301')).toHaveTextContent('開學了')
    })
  })

  describe('progress states', () => {
    describe('not started state (AC #1)', () => {
      it('shows 0% for chapter with no progress', () => {
        const { getByTestId } = render(
          <ChapterListItem chapter={mockChapter} progress={null} onPress={mockOnPress} />
        )

        expect(getByTestId('chapter-progress-text-105')).toHaveTextContent('0%')
      })

      it('shows 0% for chapter with 0 completion percentage', () => {
        const { getByTestId } = render(
          <ChapterListItem
            chapter={mockChapter}
            progress={mockProgressNotStarted}
            onPress={mockOnPress}
          />
        )

        expect(getByTestId('chapter-progress-text-105')).toHaveTextContent('0%')
      })

      it('shows chapter number in gray badge when not started', () => {
        const { getByTestId, queryByTestId } = render(
          <ChapterListItem chapter={mockChapter} progress={null} onPress={mockOnPress} />
        )

        // Badge should show chapter number, not checkmark
        expect(getByTestId('chapter-number-text-105')).toHaveTextContent('5')
        expect(queryByTestId('chapter-checkmark-105')).toBeNull()
      })
    })

    describe('in progress state (AC #2)', () => {
      it('shows percentage for partially completed chapter', () => {
        const { getByTestId } = render(
          <ChapterListItem
            chapter={mockChapter}
            progress={mockProgressInProgress}
            onPress={mockOnPress}
          />
        )

        expect(getByTestId('chapter-progress-text-105')).toHaveTextContent('45%')
      })

      it('shows progress bar for in-progress chapter', () => {
        const { getByTestId } = render(
          <ChapterListItem
            chapter={mockChapter}
            progress={mockProgressInProgress}
            onPress={mockOnPress}
          />
        )

        expect(getByTestId('chapter-progress-bar-105')).toBeTruthy()
      })

      it('shows chapter number in badge when in progress', () => {
        const { getByTestId, queryByTestId } = render(
          <ChapterListItem
            chapter={mockChapter}
            progress={mockProgressInProgress}
            onPress={mockOnPress}
          />
        )

        expect(getByTestId('chapter-number-text-105')).toHaveTextContent('5')
        expect(queryByTestId('chapter-checkmark-105')).toBeNull()
      })
    })

    describe('mastered state (AC #3)', () => {
      it('shows "Mastered" text for 80%+ completion', () => {
        const { getByTestId } = render(
          <ChapterListItem
            chapter={mockChapter}
            progress={mockProgressMastered}
            onPress={mockOnPress}
          />
        )

        expect(getByTestId('chapter-progress-text-105')).toHaveTextContent('Mastered')
      })

      it('shows checkmark instead of chapter number when mastered', () => {
        const { getByTestId, queryByTestId } = render(
          <ChapterListItem
            chapter={mockChapter}
            progress={mockProgressMastered}
            onPress={mockOnPress}
          />
        )

        expect(getByTestId('chapter-checkmark-105')).toBeTruthy()
        expect(queryByTestId('chapter-number-text-105')).toBeNull()
      })

      it('shows mastered state at exactly 80%', () => {
        const progressAt80 = { ...mockProgressInProgress, completionPercentage: 80 }
        const { getByTestId } = render(
          <ChapterListItem chapter={mockChapter} progress={progressAt80} onPress={mockOnPress} />
        )

        expect(getByTestId('chapter-progress-text-105')).toHaveTextContent('Mastered')
        expect(getByTestId('chapter-checkmark-105')).toBeTruthy()
      })

      it('does not show progress bar when mastered', () => {
        const { queryByTestId } = render(
          <ChapterListItem
            chapter={mockChapter}
            progress={mockProgressMastered}
            onPress={mockOnPress}
          />
        )

        expect(queryByTestId('chapter-progress-bar-105')).toBeNull()
      })
    })

    describe('progress state transitions', () => {
      it('shows in-progress state at 79%', () => {
        const progressAt79 = { ...mockProgressInProgress, completionPercentage: 79 }
        const { getByTestId, queryByTestId } = render(
          <ChapterListItem chapter={mockChapter} progress={progressAt79} onPress={mockOnPress} />
        )

        expect(getByTestId('chapter-progress-text-105')).toHaveTextContent('79%')
        expect(getByTestId('chapter-progress-bar-105')).toBeTruthy()
        expect(queryByTestId('chapter-checkmark-105')).toBeNull()
      })

      it('shows in-progress state at 1%', () => {
        const progressAt1 = { ...mockProgressInProgress, completionPercentage: 1 }
        const { getByTestId, queryByTestId } = render(
          <ChapterListItem chapter={mockChapter} progress={progressAt1} onPress={mockOnPress} />
        )

        expect(getByTestId('chapter-progress-text-105')).toHaveTextContent('1%')
        expect(getByTestId('chapter-progress-bar-105')).toBeTruthy()
        expect(queryByTestId('chapter-checkmark-105')).toBeNull()
      })
    })

    /**
     * Story 3.4: Open Chapter Navigation (No Gates)
     * These tests explicitly verify NO gating logic exists
     */
    describe('no gating (AC #1, #2) - Story 3.4', () => {
      it('is always pressable regardless of progress', () => {
        const { getByTestId } = render(
          <ChapterListItem chapter={mockChapter} progress={null} onPress={mockOnPress} />
        )

        const card = getByTestId('chapter-list-item-105')
        fireEvent.press(card)
        expect(mockOnPress).toHaveBeenCalledTimes(1)
      })

      it('does not render any lock icon', () => {
        const { queryByTestId, queryByText } = render(
          <ChapterListItem chapter={mockChapter} progress={null} onPress={mockOnPress} />
        )

        expect(queryByTestId('lock-icon')).toBeNull()
        expect(queryByTestId('locked-indicator')).toBeNull()
        expect(queryByText(/locked/i)).toBeNull()
        expect(queryByText(/unlock/i)).toBeNull()
      })

      it('does not show unlock requirements message', () => {
        const { queryByText } = render(
          <ChapterListItem chapter={mockChapter} progress={null} onPress={mockOnPress} />
        )

        expect(queryByText(/complete previous/i)).toBeNull()
        expect(queryByText(/unlock/i)).toBeNull()
        expect(queryByText(/prerequisite/i)).toBeNull()
      })

      it('is pressable for a later chapter even with no progress on earlier chapters', () => {
        // Simulating Book 3, Chapter 1 being accessed with no progress
        const { getByTestId } = render(
          <ChapterListItem chapter={mockBook3Chapter} progress={null} onPress={mockOnPress} />
        )

        const card = getByTestId('chapter-list-item-301')
        fireEvent.press(card)
        expect(mockOnPress).toHaveBeenCalledTimes(1)
      })

      it('has no disabled state on the card', () => {
        const { getByTestId } = render(
          <ChapterListItem chapter={mockChapter} progress={null} onPress={mockOnPress} />
        )

        const card = getByTestId('chapter-list-item-105')
        // If disabled was set, onPress would not fire
        expect(card.props.disabled).toBeFalsy()
      })
    })

    describe('percentage bounds validation', () => {
      it('clamps negative percentage to 0%', () => {
        const progressNegative = { ...mockProgressInProgress, completionPercentage: -10 }
        const { getByTestId } = render(
          <ChapterListItem chapter={mockChapter} progress={progressNegative} onPress={mockOnPress} />
        )

        expect(getByTestId('chapter-progress-text-105')).toHaveTextContent('0%')
      })

      it('clamps percentage above 100 to 100%', () => {
        const progressOver100 = { ...mockProgressInProgress, completionPercentage: 150 }
        const { getByTestId } = render(
          <ChapterListItem chapter={mockChapter} progress={progressOver100} onPress={mockOnPress} />
        )

        // 100% >= 80% so shows Mastered
        expect(getByTestId('chapter-progress-text-105')).toHaveTextContent('Mastered')
      })

      it('shows mastered state for percentage exactly 100', () => {
        const progressAt100 = { ...mockProgressMastered, completionPercentage: 100 }
        const { getByTestId } = render(
          <ChapterListItem chapter={mockChapter} progress={progressAt100} onPress={mockOnPress} />
        )

        expect(getByTestId('chapter-progress-text-105')).toHaveTextContent('Mastered')
        expect(getByTestId('chapter-checkmark-105')).toBeTruthy()
      })
    })
  })
})
