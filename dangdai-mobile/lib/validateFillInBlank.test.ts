/**
 * validateFillInBlank Utility Tests
 *
 * Unit tests for fill-in-the-blank local validation utility.
 * Tests: per-blank result correctness, case-insensitive comparison,
 * trimming, partial correctness, parseCorrectAnswers, allBlanksFilled.
 *
 * Story 4.4: Fill-in-the-Blank Exercise (Word Bank) — Task 6.8
 */

import { validateFillInBlank, parseCorrectAnswers, allBlanksFilled } from './validateFillInBlank'

// ─── validateFillInBlank ──────────────────────────────────────────────────────

describe('validateFillInBlank', () => {
  // Task 6.8: returns correct per-blank results

  it('returns [true, true] when all blanks are correct', () => {
    const blankAnswers = { 0: '想', 1: '超市' }
    const correctAnswers = ['想', '超市']

    const result = validateFillInBlank(blankAnswers, correctAnswers)

    expect(result).toEqual([true, true])
  })

  it('returns [true, false] for partially correct answers', () => {
    const blankAnswers = { 0: '想', 1: '商店' }
    const correctAnswers = ['想', '超市']

    const result = validateFillInBlank(blankAnswers, correctAnswers)

    expect(result).toEqual([true, false])
  })

  it('returns [false, false] when all blanks are incorrect', () => {
    const blankAnswers = { 0: '要', 1: '商店' }
    const correctAnswers = ['想', '超市']

    const result = validateFillInBlank(blankAnswers, correctAnswers)

    expect(result).toEqual([false, false])
  })

  it('returns [true] for a single correct blank', () => {
    const blankAnswers = { 0: '喜歡' }
    const correctAnswers = ['喜歡']

    const result = validateFillInBlank(blankAnswers, correctAnswers)

    expect(result).toEqual([true])
  })

  it('returns [false] for a single incorrect blank', () => {
    const blankAnswers = { 0: '想要' }
    const correctAnswers = ['喜歡']

    const result = validateFillInBlank(blankAnswers, correctAnswers)

    expect(result).toEqual([false])
  })

  it('handles case-insensitive comparison (lowercase answer)', () => {
    const blankAnswers = { 0: 'hello' }
    const correctAnswers = ['Hello']

    const result = validateFillInBlank(blankAnswers, correctAnswers)

    expect(result).toEqual([true])
  })

  it('handles trimming of leading/trailing whitespace', () => {
    const blankAnswers = { 0: ' 想 ' }
    const correctAnswers = ['想']

    const result = validateFillInBlank(blankAnswers, correctAnswers)

    expect(result).toEqual([true])
  })

  it('returns false when blank is missing from answers', () => {
    // blankAnswers missing key 1 → should be false
    const blankAnswers = { 0: '想' } as Record<number, string>
    const correctAnswers = ['想', '超市']

    const result = validateFillInBlank(blankAnswers, correctAnswers)

    expect(result).toEqual([true, false])
  })

  it('returns an array with the same length as correctAnswers', () => {
    const blankAnswers = { 0: '是', 1: '學生' }
    const correctAnswers = ['是', '學生']

    const result = validateFillInBlank(blankAnswers, correctAnswers)

    expect(result).toHaveLength(2)
  })
})

// ─── parseCorrectAnswers ──────────────────────────────────────────────────────

describe('parseCorrectAnswers', () => {
  it('parses a comma-separated string into an array', () => {
    expect(parseCorrectAnswers('想,超市')).toEqual(['想', '超市'])
  })

  it('returns a single-element array for a non-comma string', () => {
    expect(parseCorrectAnswers('喜歡')).toEqual(['喜歡'])
  })

  it('trims whitespace from parsed answers', () => {
    expect(parseCorrectAnswers('想, 超市')).toEqual(['想', '超市'])
  })

  it('handles three answers', () => {
    expect(parseCorrectAnswers('是,一個,學生')).toEqual(['是', '一個', '學生'])
  })
})

// ─── allBlanksFilled ──────────────────────────────────────────────────────────

describe('allBlanksFilled', () => {
  it('returns true when all blanks have values', () => {
    const blankAnswers = { 0: '想', 1: '超市' }
    expect(allBlanksFilled(blankAnswers, 2)).toBe(true)
  })

  it('returns false when a blank is null', () => {
    const blankAnswers = { 0: '想', 1: null }
    expect(allBlanksFilled(blankAnswers, 2)).toBe(false)
  })

  it('returns false when a blank is missing (undefined)', () => {
    const blankAnswers: Record<number, string | null> = { 0: '想' }
    expect(allBlanksFilled(blankAnswers, 2)).toBe(false)
  })

  it('returns false when blanks object is empty and totalBlanks > 0', () => {
    expect(allBlanksFilled({}, 1)).toBe(false)
  })

  it('returns true for a single filled blank', () => {
    const blankAnswers = { 0: '喜歡' }
    expect(allBlanksFilled(blankAnswers, 1)).toBe(true)
  })

  it('returns true when totalBlanks is 0', () => {
    expect(allBlanksFilled({}, 0)).toBe(true)
  })
})
