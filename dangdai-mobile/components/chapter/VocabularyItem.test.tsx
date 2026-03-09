/**
 * VocabularyItem Component Tests
 *
 * Co-located unit tests for the VocabularyItem component per architecture spec.
 * Tests rendering, accessibility, and conditional display behavior.
 *
 * Story 11.5: Vocabulary Browse Screen — Task 3
 */

import React from 'react'
import { render } from '@testing-library/react-native'

// Mock Tamagui components before importing VocabularyItem
jest.mock('tamagui', () => {
  const { View, Text } = require('react-native')

  return {
    Card: ({
      children,
      testID,
      accessibilityRole,
      accessibilityLabel,
    }: any) => (
      <View
        testID={testID}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </View>
    ),
    XStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    YStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    Text: ({ children, testID }: any) => <Text testID={testID}>{children}</Text>,
  }
})

// Import after mocks
import { VocabularyItem } from './VocabularyItem'
import type { VocabularyItem as VocabularyItemType } from '../../hooks/useVocabulary'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const mockItem: VocabularyItemType = {
  id: 'vocab-1',
  traditional: '你好',
  pinyin: 'nǐ hǎo',
  english: 'hello',
  part_of_speech: 'Intj',
  is_name: false,
  vocab_section: 'I',
  sort_order: 1,
}

const mockNameItem: VocabularyItemType = {
  id: 'vocab-2',
  traditional: '台灣',
  pinyin: 'Táiwān',
  english: 'Taiwan',
  part_of_speech: 'N',
  is_name: true,
  vocab_section: 'I',
  sort_order: 2,
}

const mockItemNoPOS: VocabularyItemType = {
  id: 'vocab-3',
  traditional: '嗎',
  pinyin: 'ma',
  english: 'question particle',
  part_of_speech: null,
  is_name: false,
  vocab_section: 'I',
  sort_order: 3,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('VocabularyItem', () => {
  describe('rendering', () => {
    it('renders the vocabulary card', () => {
      const { getByTestId } = render(<VocabularyItem item={mockItem} />)
      expect(getByTestId('vocabulary-item-vocab-1')).toBeTruthy()
    })

    it('displays the traditional character', () => {
      const { getByTestId } = render(<VocabularyItem item={mockItem} />)
      expect(getByTestId('vocabulary-traditional-vocab-1')).toHaveTextContent('你好')
    })

    it('displays the pinyin', () => {
      const { getByTestId } = render(<VocabularyItem item={mockItem} />)
      expect(getByTestId('vocabulary-pinyin-vocab-1')).toHaveTextContent('nǐ hǎo')
    })

    it('displays the English definition', () => {
      const { getByTestId } = render(<VocabularyItem item={mockItem} />)
      expect(getByTestId('vocabulary-english-vocab-1')).toHaveTextContent('hello')
    })
  })

  describe('part of speech badge', () => {
    it('displays POS badge when part_of_speech is provided', () => {
      const { getByTestId } = render(<VocabularyItem item={mockItem} />)
      expect(getByTestId('vocabulary-pos-vocab-1')).toHaveTextContent('Intj')
    })

    it('does not render POS badge when part_of_speech is null', () => {
      const { queryByTestId } = render(<VocabularyItem item={mockItemNoPOS} />)
      expect(queryByTestId('vocabulary-pos-vocab-3')).toBeNull()
    })
  })

  describe('name indicator', () => {
    it('shows name indicator for is_name entries', () => {
      const { getByTestId } = render(<VocabularyItem item={mockNameItem} />)
      expect(getByTestId('vocabulary-name-indicator-vocab-2')).toHaveTextContent('Name')
    })

    it('does not show name indicator for non-name entries', () => {
      const { queryByTestId } = render(<VocabularyItem item={mockItem} />)
      expect(queryByTestId('vocabulary-name-indicator-vocab-1')).toBeNull()
    })
  })

  describe('accessibility', () => {
    it('has accessibilityRole="text" on the card', () => {
      const { getByTestId } = render(<VocabularyItem item={mockItem} />)
      const card = getByTestId('vocabulary-item-vocab-1')
      expect(card.props.accessibilityRole).toBe('text')
    })

    it('has a descriptive accessibilityLabel including traditional, pinyin, english, and POS', () => {
      const { getByTestId } = render(<VocabularyItem item={mockItem} />)
      const card = getByTestId('vocabulary-item-vocab-1')
      expect(card.props.accessibilityLabel).toBe('你好, nǐ hǎo, hello, Intj')
    })

    it('includes "proper noun" in accessibilityLabel for is_name entries', () => {
      const { getByTestId } = render(<VocabularyItem item={mockNameItem} />)
      const card = getByTestId('vocabulary-item-vocab-2')
      expect(card.props.accessibilityLabel).toContain('proper noun')
    })

    it('omits POS from accessibilityLabel when part_of_speech is null', () => {
      const { getByTestId } = render(<VocabularyItem item={mockItemNoPOS} />)
      const card = getByTestId('vocabulary-item-vocab-3')
      expect(card.props.accessibilityLabel).toBe('嗎, ma, question particle')
    })
  })
})
