/**
 * Loading Tips Tests
 *
 * Tests for loading screen tips data and rotation logic.
 *
 * Story 4.2: Quiz Loading Screen with Progressive Loading
 */

import { LOADING_TIPS, TIP_ROTATION_INTERVAL_MS, getNextTipIndex } from './tips'

describe('LOADING_TIPS', () => {
  it('contains at least 15 tips', () => {
    expect(LOADING_TIPS.length).toBeGreaterThanOrEqual(15)
  })

  it('all tips are non-empty strings', () => {
    LOADING_TIPS.forEach((tip) => {
      expect(typeof tip).toBe('string')
      expect(tip.length).toBeGreaterThan(0)
    })
  })

  it('all tips are unique', () => {
    const uniqueTips = new Set(LOADING_TIPS)
    expect(uniqueTips.size).toBe(LOADING_TIPS.length)
  })
})

describe('TIP_ROTATION_INTERVAL_MS', () => {
  it('is 2000ms (2 seconds)', () => {
    expect(TIP_ROTATION_INTERVAL_MS).toBe(2000)
  })
})

describe('getNextTipIndex', () => {
  it('returns a different index from current', () => {
    // Run multiple times to verify non-repeating behavior
    for (let i = 0; i < 50; i++) {
      const currentIndex = 5
      const nextIndex = getNextTipIndex(currentIndex, LOADING_TIPS.length)
      expect(nextIndex).not.toBe(currentIndex)
    }
  })

  it('returns an index within bounds', () => {
    for (let i = 0; i < 50; i++) {
      const nextIndex = getNextTipIndex(0, LOADING_TIPS.length)
      expect(nextIndex).toBeGreaterThanOrEqual(0)
      expect(nextIndex).toBeLessThan(LOADING_TIPS.length)
    }
  })

  it('returns 0 when totalTips is 1', () => {
    expect(getNextTipIndex(0, 1)).toBe(0)
  })

  it('returns 0 when totalTips is 0', () => {
    expect(getNextTipIndex(0, 0)).toBe(0)
  })

  it('always returns the other index when totalTips is 2', () => {
    for (let i = 0; i < 20; i++) {
      expect(getNextTipIndex(0, 2)).toBe(1)
      expect(getNextTipIndex(1, 2)).toBe(0)
    }
  })
})
