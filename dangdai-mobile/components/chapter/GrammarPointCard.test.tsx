/**
 * GrammarPointCard Component Tests
 *
 * Co-located unit tests for the GrammarPointCard component per architecture spec.
 * Tests rendering, accessibility, and conditional display behavior.
 *
 * Story 11.6: Grammar Points Browse Screen — Task 3
 *
 * AC #2: Each point shows title (English + Chinese), function, structure, usage
 * AC #3: Examples show traditional Chinese, pinyin, and English translation
 */

import React from 'react'
import { render } from '@testing-library/react-native'

// Mock Tamagui components before importing GrammarPointCard
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
import { GrammarPointCard } from './GrammarPointCard'
import type { GrammarPoint } from '../../hooks/useGrammarPoints'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const mockFullGrammarPoint: GrammarPoint = {
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
    {
      traditional: '她是老師。',
      pinyin: 'Tā shì lǎoshī.',
      english: 'She is a teacher.',
    },
  ],
}

const mockMinimalGrammarPoint: GrammarPoint = {
  id: 'gp-2',
  grammar_order: 2,
  title_english: 'Question Particle 嗎 (ma)',
  title_chinese: null,
  function_description: null,
  structure_pattern: null,
  usage_notes: null,
  examples: [],
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GrammarPointCard', () => {
  describe('rendering', () => {
    it('renders the grammar point card', () => {
      const { getByTestId } = render(<GrammarPointCard item={mockFullGrammarPoint} />)
      expect(getByTestId('grammar-point-card-gp-1')).toBeTruthy()
    })

    it('displays the English title', () => {
      const { getByTestId } = render(<GrammarPointCard item={mockFullGrammarPoint} />)
      expect(getByTestId('grammar-point-title-english-gp-1')).toHaveTextContent(
        'The Verb 是 (shì)'
      )
    })
  })

  describe('Chinese title (AC #2)', () => {
    it('displays Chinese title when present', () => {
      const { getByTestId } = render(<GrammarPointCard item={mockFullGrammarPoint} />)
      expect(getByTestId('grammar-point-title-chinese-gp-1')).toHaveTextContent('是字句')
    })

    it('does not render Chinese title when null', () => {
      const { queryByTestId } = render(<GrammarPointCard item={mockMinimalGrammarPoint} />)
      expect(queryByTestId('grammar-point-title-chinese-gp-2')).toBeNull()
    })
  })

  describe('function description (AC #2)', () => {
    it('displays function description when present', () => {
      const { getByTestId } = render(<GrammarPointCard item={mockFullGrammarPoint} />)
      // Use the text-specific testID to avoid matching the "Function" label
      expect(getByTestId('grammar-point-function-text-gp-1')).toHaveTextContent(
        'Used to link a subject to a predicate noun or pronoun.'
      )
    })

    it('does not render function description when null', () => {
      const { queryByTestId } = render(<GrammarPointCard item={mockMinimalGrammarPoint} />)
      expect(queryByTestId('grammar-point-function-gp-2')).toBeNull()
    })
  })

  describe('structure pattern (AC #2)', () => {
    it('displays structure pattern when present', () => {
      const { getByTestId } = render(<GrammarPointCard item={mockFullGrammarPoint} />)
      // Use the text-specific testID to avoid matching the "Structure" label
      expect(getByTestId('grammar-point-structure-text-gp-1')).toHaveTextContent(
        'Subject + 是 + Noun/Pronoun'
      )
    })

    it('does not render structure pattern when null', () => {
      const { queryByTestId } = render(<GrammarPointCard item={mockMinimalGrammarPoint} />)
      expect(queryByTestId('grammar-point-structure-gp-2')).toBeNull()
    })
  })

  describe('usage notes (AC #2)', () => {
    it('displays usage notes when present', () => {
      const { getByTestId } = render(<GrammarPointCard item={mockFullGrammarPoint} />)
      // Use the text-specific testID to avoid matching the "Usage" label
      expect(getByTestId('grammar-point-usage-text-gp-1')).toHaveTextContent(
        'The negative form uses 不是 (bú shì).'
      )
    })

    it('does not render usage notes when null', () => {
      const { queryByTestId } = render(<GrammarPointCard item={mockMinimalGrammarPoint} />)
      expect(queryByTestId('grammar-point-usage-gp-2')).toBeNull()
    })
  })

  describe('examples (AC #3)', () => {
    it('renders examples section when examples exist', () => {
      const { getByTestId } = render(<GrammarPointCard item={mockFullGrammarPoint} />)
      expect(getByTestId('grammar-point-examples-gp-1')).toBeTruthy()
    })

    it('does not render examples section when examples array is empty', () => {
      const { queryByTestId } = render(<GrammarPointCard item={mockMinimalGrammarPoint} />)
      expect(queryByTestId('grammar-point-examples-gp-2')).toBeNull()
    })

    it('displays traditional Chinese for each example', () => {
      const { getByTestId } = render(<GrammarPointCard item={mockFullGrammarPoint} />)
      expect(getByTestId('grammar-example-traditional-gp-1-0')).toHaveTextContent('我是學生。')
    })

    it('displays pinyin for each example', () => {
      const { getByTestId } = render(<GrammarPointCard item={mockFullGrammarPoint} />)
      expect(getByTestId('grammar-example-pinyin-gp-1-0')).toHaveTextContent('Wǒ shì xuéshēng.')
    })

    it('displays English translation for each example', () => {
      const { getByTestId } = render(<GrammarPointCard item={mockFullGrammarPoint} />)
      expect(getByTestId('grammar-example-english-gp-1-0')).toHaveTextContent('I am a student.')
    })

    it('renders multiple examples', () => {
      const { getByTestId } = render(<GrammarPointCard item={mockFullGrammarPoint} />)
      expect(getByTestId('grammar-point-example-gp-1-0')).toBeTruthy()
      expect(getByTestId('grammar-point-example-gp-1-1')).toBeTruthy()
    })

    it('displays second example correctly', () => {
      const { getByTestId } = render(<GrammarPointCard item={mockFullGrammarPoint} />)
      expect(getByTestId('grammar-example-traditional-gp-1-1')).toHaveTextContent('她是老師。')
      expect(getByTestId('grammar-example-pinyin-gp-1-1')).toHaveTextContent('Tā shì lǎoshī.')
      expect(getByTestId('grammar-example-english-gp-1-1')).toHaveTextContent('She is a teacher.')
    })
  })

  describe('accessibility', () => {
    it('has accessibilityRole="text" on the card', () => {
      const { getByTestId } = render(<GrammarPointCard item={mockFullGrammarPoint} />)
      const card = getByTestId('grammar-point-card-gp-1')
      expect(card.props.accessibilityRole).toBe('text')
    })

    it('has a descriptive accessibilityLabel including English and Chinese title', () => {
      const { getByTestId } = render(<GrammarPointCard item={mockFullGrammarPoint} />)
      const card = getByTestId('grammar-point-card-gp-1')
      expect(card.props.accessibilityLabel).toBe('Grammar point: The Verb 是 (shì), 是字句')
    })

    it('omits Chinese title from accessibilityLabel when null', () => {
      const { getByTestId } = render(<GrammarPointCard item={mockMinimalGrammarPoint} />)
      const card = getByTestId('grammar-point-card-gp-2')
      expect(card.props.accessibilityLabel).toBe('Grammar point: Question Particle 嗎 (ma)')
    })
  })
})
