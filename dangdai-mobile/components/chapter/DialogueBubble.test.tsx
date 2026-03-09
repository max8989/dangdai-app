/**
 * DialogueBubble Component Tests
 *
 * Unit tests for the DialogueBubble component.
 * Validates rendering, toggle behavior, and accessibility.
 *
 * Story 11.7: Dialogue Browse Screen — Task 6 (component tests)
 *
 * AC #2: Each dialogue shows conversation lines in a chat-bubble layout with speaker labels
 * AC #3: Traditional Chinese always visible; simplified, pinyin, English are toggleable
 * AC #4: Toggle controls show/hide content across all lines
 */

import React from 'react'
import { render } from '@testing-library/react-native'

// Mock Tamagui components
jest.mock('tamagui', () => {
  const { View, Text } = require('react-native')

  return {
    YStack: ({ children, testID, alignItems }: any) => (
      <View testID={testID} accessibilityLabel={alignItems}>{children}</View>
    ),
    Card: ({ children, testID, accessibilityRole, accessibilityLabel }: any) => (
      <View
        testID={testID}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </View>
    ),
    Text: ({ children, testID, fontStyle }: any) => (
      <Text testID={testID}>{children}</Text>
    ),
  }
})

// Import after mocks
import { DialogueBubble } from './DialogueBubble'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const mockLine = {
  speaker: '明華',
  traditional: '田中，歡迎！歡迎！請進。',
  simplified: '田中，欢迎！欢迎！请进。',
  pinyin: 'Tiánzhōng, huānyíng! Huānyíng! Qǐng jìn.',
  english: 'Tanaka, welcome! Welcome! Please come in.',
}

const mockLineMinimal = {
  speaker: '田中',
  traditional: '謝謝！',
  // No simplified, pinyin, or english
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DialogueBubble', () => {
  describe('speaker label (AC #2)', () => {
    it('renders the speaker label', () => {
      const { getByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={false}
          showEnglish={false}
          showSimplified={false}
          isAlternate={false}
        />
      )
      expect(getByTestId('dialogue-speaker-明華')).toBeTruthy()
    })

    it('displays the correct speaker name', () => {
      const { getByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={false}
          showEnglish={false}
          showSimplified={false}
          isAlternate={false}
        />
      )
      expect(getByTestId('dialogue-speaker-明華')).toHaveTextContent('明華')
    })
  })

  describe('traditional Chinese — always visible (AC #3)', () => {
    it('renders traditional Chinese text', () => {
      const { getByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={false}
          showEnglish={false}
          showSimplified={false}
          isAlternate={false}
        />
      )
      expect(getByTestId('dialogue-traditional-明華')).toBeTruthy()
    })

    it('displays the correct traditional text', () => {
      const { getByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={false}
          showEnglish={false}
          showSimplified={false}
          isAlternate={false}
        />
      )
      expect(getByTestId('dialogue-traditional-明華')).toHaveTextContent('田中，歡迎！歡迎！請進。')
    })

    it('shows traditional text even when all toggles are off', () => {
      const { getByTestId, queryByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={false}
          showEnglish={false}
          showSimplified={false}
          isAlternate={false}
        />
      )
      expect(getByTestId('dialogue-traditional-明華')).toBeTruthy()
      expect(queryByTestId('dialogue-pinyin-明華')).toBeNull()
      expect(queryByTestId('dialogue-english-明華')).toBeNull()
      expect(queryByTestId('dialogue-simplified-明華')).toBeNull()
    })
  })

  describe('pinyin toggle (AC #4)', () => {
    it('hides pinyin when showPinyin is false', () => {
      const { queryByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={false}
          showEnglish={false}
          showSimplified={false}
          isAlternate={false}
        />
      )
      expect(queryByTestId('dialogue-pinyin-明華')).toBeNull()
    })

    it('shows pinyin when showPinyin is true', () => {
      const { getByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={true}
          showEnglish={false}
          showSimplified={false}
          isAlternate={false}
        />
      )
      expect(getByTestId('dialogue-pinyin-明華')).toBeTruthy()
    })

    it('displays the correct pinyin text', () => {
      const { getByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={true}
          showEnglish={false}
          showSimplified={false}
          isAlternate={false}
        />
      )
      expect(getByTestId('dialogue-pinyin-明華')).toHaveTextContent(
        'Tiánzhōng, huānyíng! Huānyíng! Qǐng jìn.'
      )
    })

    it('does not show pinyin when line has no pinyin field', () => {
      const { queryByTestId } = render(
        <DialogueBubble
          line={mockLineMinimal}
          showPinyin={true}
          showEnglish={false}
          showSimplified={false}
          isAlternate={false}
        />
      )
      expect(queryByTestId('dialogue-pinyin-田中')).toBeNull()
    })
  })

  describe('English toggle (AC #4)', () => {
    it('hides English when showEnglish is false', () => {
      const { queryByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={false}
          showEnglish={false}
          showSimplified={false}
          isAlternate={false}
        />
      )
      expect(queryByTestId('dialogue-english-明華')).toBeNull()
    })

    it('shows English when showEnglish is true', () => {
      const { getByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={false}
          showEnglish={true}
          showSimplified={false}
          isAlternate={false}
        />
      )
      expect(getByTestId('dialogue-english-明華')).toBeTruthy()
    })

    it('displays the correct English text', () => {
      const { getByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={false}
          showEnglish={true}
          showSimplified={false}
          isAlternate={false}
        />
      )
      expect(getByTestId('dialogue-english-明華')).toHaveTextContent(
        'Tanaka, welcome! Welcome! Please come in.'
      )
    })

    it('does not show English when line has no english field', () => {
      const { queryByTestId } = render(
        <DialogueBubble
          line={mockLineMinimal}
          showPinyin={false}
          showEnglish={true}
          showSimplified={false}
          isAlternate={false}
        />
      )
      expect(queryByTestId('dialogue-english-田中')).toBeNull()
    })
  })

  describe('simplified toggle (AC #4)', () => {
    it('hides simplified when showSimplified is false', () => {
      const { queryByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={false}
          showEnglish={false}
          showSimplified={false}
          isAlternate={false}
        />
      )
      expect(queryByTestId('dialogue-simplified-明華')).toBeNull()
    })

    it('shows simplified when showSimplified is true', () => {
      const { getByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={false}
          showEnglish={false}
          showSimplified={true}
          isAlternate={false}
        />
      )
      expect(getByTestId('dialogue-simplified-明華')).toBeTruthy()
    })

    it('displays the correct simplified text', () => {
      const { getByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={false}
          showEnglish={false}
          showSimplified={true}
          isAlternate={false}
        />
      )
      expect(getByTestId('dialogue-simplified-明華')).toHaveTextContent('田中，欢迎！欢迎！请进。')
    })

    it('does not show simplified when line has no simplified field', () => {
      const { queryByTestId } = render(
        <DialogueBubble
          line={mockLineMinimal}
          showPinyin={false}
          showEnglish={false}
          showSimplified={true}
          isAlternate={false}
        />
      )
      expect(queryByTestId('dialogue-simplified-田中')).toBeNull()
    })
  })

  describe('all toggles on simultaneously', () => {
    it('shows all fields when all toggles are on', () => {
      const { getByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={true}
          showEnglish={true}
          showSimplified={true}
          isAlternate={false}
        />
      )
      expect(getByTestId('dialogue-traditional-明華')).toBeTruthy()
      expect(getByTestId('dialogue-simplified-明華')).toBeTruthy()
      expect(getByTestId('dialogue-pinyin-明華')).toBeTruthy()
      expect(getByTestId('dialogue-english-明華')).toBeTruthy()
    })
  })

  describe('bubble alignment (AC #2)', () => {
    it('renders the bubble card', () => {
      const { getByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={false}
          showEnglish={false}
          showSimplified={false}
          isAlternate={false}
        />
      )
      expect(getByTestId('dialogue-bubble-card-明華')).toBeTruthy()
    })

    it('renders with alternate alignment for second speaker', () => {
      const { getByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={false}
          showEnglish={false}
          showSimplified={false}
          isAlternate={true}
        />
      )
      expect(getByTestId('dialogue-bubble-card-明華')).toBeTruthy()
    })
  })

  describe('accessibility', () => {
    it('has accessibilityRole="text" on the bubble card', () => {
      const { getByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={false}
          showEnglish={false}
          showSimplified={false}
          isAlternate={false}
        />
      )
      const card = getByTestId('dialogue-bubble-card-明華')
      expect(card.props.accessibilityRole).toBe('text')
    })

    it('has a descriptive accessibilityLabel', () => {
      const { getByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={false}
          showEnglish={false}
          showSimplified={false}
          isAlternate={false}
        />
      )
      const card = getByTestId('dialogue-bubble-card-明華')
      expect(card.props.accessibilityLabel).toContain('明華')
      expect(card.props.accessibilityLabel).toContain('田中，歡迎！歡迎！請進。')
    })
  })

  describe('custom testID', () => {
    it('uses custom testID when provided', () => {
      const { getByTestId } = render(
        <DialogueBubble
          line={mockLine}
          showPinyin={false}
          showEnglish={false}
          showSimplified={false}
          isAlternate={false}
          testID="custom-bubble-0"
        />
      )
      expect(getByTestId('custom-bubble-0')).toBeTruthy()
    })
  })
})
