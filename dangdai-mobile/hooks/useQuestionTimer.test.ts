/**
 * useQuestionTimer Tests
 *
 * Unit tests for the per-question timer hook (Story 4.10 — Task 2).
 *
 * Test scenarios:
 * 1. startTimer() + stopTimer() returns elapsed ms > 0
 * 2. stopTimer() without startTimer() returns 0
 * 3. resetTimer() clears the timer
 * 4. Auto-starts when questionIndex changes
 * 5. Multiple start/stop cycles work correctly
 * 6. getElapsedMs() returns current elapsed without stopping
 */

import { renderHook, act } from '@testing-library/react-native'
import { useQuestionTimer } from './useQuestionTimer'

// Mock Date.now for deterministic timing
const mockNow = jest.spyOn(Date, 'now')

beforeEach(() => {
  mockNow.mockReset()
  mockNow.mockReturnValue(1000)
})

afterAll(() => {
  mockNow.mockRestore()
})

describe('useQuestionTimer — Story 4.10 (Task 2)', () => {
  describe('startTimer() + stopTimer() (Tasks 2.3, 2.4)', () => {
    it('stopTimer() returns elapsed ms after startTimer()', () => {
      const { result } = renderHook(() => useQuestionTimer(0))

      act(() => {
        result.current.startTimer()
      })

      // Advance mock time by 500ms
      mockNow.mockReturnValue(1500)

      let elapsed = 0
      act(() => {
        elapsed = result.current.stopTimer()
      })

      expect(elapsed).toBe(500)
    })

    it('stopTimer() returns 0 when timer was never started (Task 2.4)', () => {
      // Reset mock so auto-start from useEffect does not matter
      // We need to call stopTimer BEFORE useEffect runs, so we test the
      // raw function behavior by calling stopTimer immediately after hook creation
      // and verifying reset clears the timer first
      const { result } = renderHook(() => useQuestionTimer(0))

      act(() => {
        result.current.resetTimer() // Clear the auto-started timer
      })

      // Now stopTimer should return 0 since timer was cleared
      let elapsed = -1
      act(() => {
        elapsed = result.current.stopTimer()
      })

      expect(elapsed).toBe(0)
    })

    it('stopTimer() clears the timer ref (second stopTimer returns 0)', () => {
      const { result } = renderHook(() => useQuestionTimer(0))

      act(() => {
        result.current.startTimer()
      })

      mockNow.mockReturnValue(1200)

      act(() => {
        result.current.stopTimer()
      })

      // Second stop should return 0 because timer was cleared
      mockNow.mockReturnValue(1400)
      let elapsed = -1
      act(() => {
        elapsed = result.current.stopTimer()
      })

      expect(elapsed).toBe(0)
    })
  })

  describe('resetTimer() (Task 2.6)', () => {
    it('resetTimer() clears the ref so stopTimer returns 0 afterward', () => {
      const { result } = renderHook(() => useQuestionTimer(0))

      act(() => {
        result.current.startTimer()
      })

      act(() => {
        result.current.resetTimer()
      })

      mockNow.mockReturnValue(1500)

      let elapsed = -1
      act(() => {
        elapsed = result.current.stopTimer()
      })

      expect(elapsed).toBe(0)
    })
  })

  describe('getElapsedMs() (Task 2.5)', () => {
    it('returns current elapsed without stopping the timer', () => {
      const { result } = renderHook(() => useQuestionTimer(0))

      act(() => {
        result.current.startTimer()
      })

      mockNow.mockReturnValue(1300)

      let elapsed = 0
      act(() => {
        elapsed = result.current.getElapsedMs()
      })

      expect(elapsed).toBe(300)

      // Timer should still be running — stopTimer returns elapsed from original start
      mockNow.mockReturnValue(1600)
      let elapsed2 = 0
      act(() => {
        elapsed2 = result.current.stopTimer()
      })

      expect(elapsed2).toBe(600)
    })

    it('returns 0 when timer not started', () => {
      const { result } = renderHook(() => useQuestionTimer(0))

      act(() => {
        result.current.resetTimer() // Clear auto-start
      })

      let elapsed = -1
      act(() => {
        elapsed = result.current.getElapsedMs()
      })

      expect(elapsed).toBe(0)
    })
  })

  describe('auto-start on questionIndex change (Task 2.7)', () => {
    it('auto-starts timer when hook is first rendered', () => {
      mockNow.mockReturnValue(1000)

      // Use a mutable ref to allow rerender with different props
      let questionIndex = 0
      const { result } = renderHook(() => useQuestionTimer(questionIndex))

      // Timer should have auto-started via useEffect on mount
      mockNow.mockReturnValue(1250)

      let elapsed = 0
      act(() => {
        elapsed = result.current.stopTimer()
      })

      expect(elapsed).toBe(250)
    })

    it('auto-restarts timer when questionIndex changes', () => {
      mockNow.mockReturnValue(1000)

      // Track current index via closure
      let currentIndex = 0
      const { result, rerender } = renderHook(() => useQuestionTimer(currentIndex))

      // Advance time before question change
      mockNow.mockReturnValue(1500)

      // Change question index — timer should restart from 1500
      // Pass empty update to trigger rerender (rerender requires an argument in RTN v13)
      currentIndex = 1
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rerender(undefined as any)

      // Advance time after question change
      mockNow.mockReturnValue(1700)

      let elapsed = 0
      act(() => {
        elapsed = result.current.stopTimer()
      })

      // Elapsed should be from the new start (1700 - 1500 = 200), not from 1000
      expect(elapsed).toBe(200)
    })
  })

  describe('multiple start/stop cycles (Task 2.7)', () => {
    it('works correctly across multiple start/stop cycles', () => {
      const { result } = renderHook(() => useQuestionTimer(0))

      // Cycle 1
      mockNow.mockReturnValue(1000)
      act(() => { result.current.startTimer() })
      mockNow.mockReturnValue(1100)
      let e1 = 0
      act(() => { e1 = result.current.stopTimer() })
      expect(e1).toBe(100)

      // Cycle 2
      mockNow.mockReturnValue(2000)
      act(() => { result.current.startTimer() })
      mockNow.mockReturnValue(2350)
      let e2 = 0
      act(() => { e2 = result.current.stopTimer() })
      expect(e2).toBe(350)
    })
  })
})
