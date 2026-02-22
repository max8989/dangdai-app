/**
 * Tests for pinyin normalization utility.
 * Story 4.12: Text Input Answer Type
 */

import { normalizePinyin } from './pinyinNormalize'

describe('normalizePinyin', () => {
  describe('tone mark to tone number conversion', () => {
    // a tones
    it('converts tone mark ā to a1', () => {
      expect(normalizePinyin('mā')).toBe('ma1')
    })
    it('converts tone mark á to a2', () => {
      expect(normalizePinyin('má')).toBe('ma2')
    })
    it('converts tone mark ǎ to a3', () => {
      expect(normalizePinyin('mǎ')).toBe('ma3')
    })
    it('converts tone mark à to a4', () => {
      expect(normalizePinyin('mà')).toBe('ma4')
    })

    // e tones
    it('handles e tones', () => {
      expect(normalizePinyin('hē')).toBe('he1')
      expect(normalizePinyin('hé')).toBe('he2')
      expect(normalizePinyin('hě')).toBe('he3')
      expect(normalizePinyin('hè')).toBe('he4')
    })

    // i tones
    it('handles i tones', () => {
      expect(normalizePinyin('chī')).toBe('chi1')
      expect(normalizePinyin('chí')).toBe('chi2')
      expect(normalizePinyin('chǐ')).toBe('chi3')
      expect(normalizePinyin('chì')).toBe('chi4')
    })

    // o tones
    it('handles o tones', () => {
      expect(normalizePinyin('wō')).toBe('wo1')
      expect(normalizePinyin('wó')).toBe('wo2')
      expect(normalizePinyin('wǒ')).toBe('wo3')
      expect(normalizePinyin('wò')).toBe('wo4')
    })

    // u tones
    it('handles u tones', () => {
      expect(normalizePinyin('shū')).toBe('shu1')
      expect(normalizePinyin('shú')).toBe('shu2')
      expect(normalizePinyin('shǔ')).toBe('shu3')
      expect(normalizePinyin('shù')).toBe('shu4')
    })

    // ü tones (normalized to v)
    it('handles ü tones (normalized to v)', () => {
      expect(normalizePinyin('lǖ')).toBe('lv1')
      expect(normalizePinyin('lǘ')).toBe('lv2')
      expect(normalizePinyin('lǚ')).toBe('lv3')
      expect(normalizePinyin('lǜ')).toBe('lv4')
    })
  })

  describe('multi-syllable pinyin', () => {
    it('normalizes multi-syllable pinyin with tone marks', () => {
      expect(normalizePinyin('xué')).toBe('xue2')
    })
    it('normalizes multi-syllable pinyin with tone numbers', () => {
      expect(normalizePinyin('xue2')).toBe('xue2')
    })
    it('normalizes nǐ hǎo', () => {
      expect(normalizePinyin('nǐ hǎo')).toBe('ni3 hao3')
    })
  })

  describe('ü/v equivalence', () => {
    it('normalizes ü to v', () => {
      expect(normalizePinyin('lǜ')).toBe('lv4')
    })
    it('treats lv4 and lü4 as equivalent', () => {
      expect(normalizePinyin('lv4')).toBe(normalizePinyin('lǜ'))
    })
    it('normalizes nǚ to nv3', () => {
      expect(normalizePinyin('nǚ')).toBe('nv3')
    })
    it('normalizes plain ü to v (no tone)', () => {
      expect(normalizePinyin('lü')).toBe('lv')
    })
  })

  describe('case insensitivity', () => {
    it('lowercases input', () => {
      expect(normalizePinyin('Xué')).toBe('xue2')
    })
    it('lowercases all-caps', () => {
      expect(normalizePinyin('XUE2')).toBe('xue2')
    })
    it('lowercases mixed case with tone marks', () => {
      expect(normalizePinyin('NǏ HǍO')).toBe('ni3 hao3')
    })
  })

  describe('whitespace handling', () => {
    it('trims leading/trailing whitespace', () => {
      expect(normalizePinyin('  xué  ')).toBe('xue2')
    })
    it('collapses multiple spaces', () => {
      expect(normalizePinyin('nǐ  hǎo')).toBe('ni3 hao3')
    })
    it('handles tabs and mixed whitespace', () => {
      expect(normalizePinyin('nǐ\t\thǎo')).toBe('ni3 hao3')
    })
  })

  describe('neutral tone (no mark)', () => {
    it('leaves unmarked pinyin unchanged', () => {
      expect(normalizePinyin('ma')).toBe('ma')
    })
    it('leaves tone 5 notation unchanged', () => {
      expect(normalizePinyin('ma5')).toBe('ma5')
    })
  })

  describe('edge cases', () => {
    it('handles empty string', () => {
      expect(normalizePinyin('')).toBe('')
    })
    it('handles whitespace-only input', () => {
      expect(normalizePinyin('   ')).toBe('')
    })
    it('handles numbers in input', () => {
      expect(normalizePinyin('xue2')).toBe('xue2')
    })
    it('handles complex multi-syllable with mixed marks and numbers', () => {
      expect(normalizePinyin('xué sheng2')).toBe('xue2 sheng2')
    })
  })
})
