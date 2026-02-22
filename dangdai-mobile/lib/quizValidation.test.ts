/**
 * Tests for quiz answer validation utilities.
 * Story 4.12: Text Input Answer Type
 */

import { validateTextAnswer } from './quizValidation'

describe('validateTextAnswer', () => {
  describe('meaning type', () => {
    it('matches exact answer', () => {
      expect(validateTextAnswer('to study', 'to study', 'meaning')).toBe(true)
    })

    it('matches case-insensitively', () => {
      expect(validateTextAnswer('To Study', 'to study', 'meaning')).toBe(true)
      expect(validateTextAnswer('TO STUDY', 'to study', 'meaning')).toBe(true)
      expect(validateTextAnswer('to STUDY', 'To Study', 'meaning')).toBe(true)
    })

    it('trims whitespace', () => {
      expect(validateTextAnswer('  to study  ', 'to study', 'meaning')).toBe(true)
      expect(validateTextAnswer('to study', '  to study  ', 'meaning')).toBe(true)
      expect(validateTextAnswer('  to study  ', '  to study  ', 'meaning')).toBe(true)
    })

    it('rejects wrong answer', () => {
      expect(validateTextAnswer('to teach', 'to study', 'meaning')).toBe(false)
      expect(validateTextAnswer('study', 'to study', 'meaning')).toBe(false)
    })

    it('rejects empty input', () => {
      expect(validateTextAnswer('', 'to study', 'meaning')).toBe(false)
    })

    it('rejects whitespace-only input', () => {
      expect(validateTextAnswer('   ', 'to study', 'meaning')).toBe(false)
      expect(validateTextAnswer('\t\t', 'to study', 'meaning')).toBe(false)
    })

    it('handles multi-word meanings', () => {
      expect(validateTextAnswer('hello there', 'hello there', 'meaning')).toBe(true)
      expect(validateTextAnswer('Hello There', 'hello there', 'meaning')).toBe(true)
    })
  })

  describe('pinyin type', () => {
    it('matches tone marks to tone numbers', () => {
      expect(validateTextAnswer('xué', 'xue2', 'pinyin')).toBe(true)
      expect(validateTextAnswer('nǐ', 'ni3', 'pinyin')).toBe(true)
      expect(validateTextAnswer('hǎo', 'hao3', 'pinyin')).toBe(true)
    })

    it('matches tone numbers to tone marks', () => {
      expect(validateTextAnswer('xue2', 'xué', 'pinyin')).toBe(true)
      expect(validateTextAnswer('ni3', 'nǐ', 'pinyin')).toBe(true)
    })

    it('matches identical tone marks', () => {
      expect(validateTextAnswer('xué', 'xué', 'pinyin')).toBe(true)
      expect(validateTextAnswer('nǐ hǎo', 'nǐ hǎo', 'pinyin')).toBe(true)
      expect(validateTextAnswer('hǎo', 'hǎo', 'pinyin')).toBe(true)
    })

    it('matches identical tone numbers', () => {
      expect(validateTextAnswer('xue2', 'xue2', 'pinyin')).toBe(true)
      expect(validateTextAnswer('ni3 hao3', 'ni3 hao3', 'pinyin')).toBe(true)
      expect(validateTextAnswer('hao3', 'hao3', 'pinyin')).toBe(true)
    })

    it('matches ü and v equivalence', () => {
      expect(validateTextAnswer('lv4', 'lǜ', 'pinyin')).toBe(true)
      expect(validateTextAnswer('lǜ', 'lv4', 'pinyin')).toBe(true)
      expect(validateTextAnswer('nv3', 'nǚ', 'pinyin')).toBe(true)
      expect(validateTextAnswer('lü', 'lv', 'pinyin')).toBe(true)
    })

    it('is case-insensitive', () => {
      expect(validateTextAnswer('Xue2', 'xué', 'pinyin')).toBe(true)
      expect(validateTextAnswer('XUE2', 'xué', 'pinyin')).toBe(true)
      expect(validateTextAnswer('xué', 'XUE2', 'pinyin')).toBe(true)
    })

    it('handles whitespace correctly', () => {
      expect(validateTextAnswer('  xué  ', 'xue2', 'pinyin')).toBe(true)
      expect(validateTextAnswer('nǐ  hǎo', 'ni3 hao3', 'pinyin')).toBe(true)
    })

    it('rejects wrong pinyin', () => {
      expect(validateTextAnswer('xue1', 'xué', 'pinyin')).toBe(false)
      expect(validateTextAnswer('ni4', 'nǐ', 'pinyin')).toBe(false)
    })

    it('rejects wrong tone', () => {
      expect(validateTextAnswer('xùe', 'xué', 'pinyin')).toBe(false)
      expect(validateTextAnswer('xū', 'xú', 'pinyin')).toBe(false)
    })

    it('rejects empty input', () => {
      expect(validateTextAnswer('', 'xué', 'pinyin')).toBe(false)
      expect(validateTextAnswer('   ', 'ni3', 'pinyin')).toBe(false)
    })

    it('handles multi-syllable pinyin', () => {
      expect(validateTextAnswer('nǐ hǎo', 'ni3 hao3', 'pinyin')).toBe(true)
      expect(validateTextAnswer('xué sheng', 'xue2 sheng', 'pinyin')).toBe(true)
      expect(validateTextAnswer('ni3 hao3', 'nǐ hǎo', 'pinyin')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('handles empty correct answer (meaning)', () => {
      expect(validateTextAnswer('test', '', 'meaning')).toBe(false)
    })

    it('handles empty correct answer (pinyin)', () => {
      expect(validateTextAnswer('test', '', 'pinyin')).toBe(false)
    })

    it('both empty returns false', () => {
      expect(validateTextAnswer('', '', 'meaning')).toBe(false)
      expect(validateTextAnswer('', '', 'pinyin')).toBe(false)
    })
  })
})
