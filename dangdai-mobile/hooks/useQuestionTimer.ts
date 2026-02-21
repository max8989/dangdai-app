/**
 * useQuestionTimer Hook
 *
 * Per-question timing for quiz sessions. Tracks time spent on each question
 * to populate the `time_spent_ms` field in `question_results` (Story 4.10, AC #1).
 *
 * Uses useRef (not useState) for the start timestamp — the timer value does not
 * need to trigger re-renders. We only read it once on answer submission.
 *
 * Uses Date.now() instead of performance.now() for cross-platform compatibility
 * (React Native does not guarantee performance.now() precision).
 *
 * Auto-starts timer when questionIndex changes via useEffect.
 *
 * Story 4.10: Quiz Progress Saving — Task 2
 */

import { useRef, useEffect, useCallback } from 'react'

/**
 * Per-question timer hook.
 *
 * @param questionIndex - Current question index. Timer auto-restarts whenever
 *   this value changes (i.e., when the user advances to the next question).
 *
 * @returns Object with timer control functions:
 *   - startTimer(): Records current timestamp. Called by auto-start effect.
 *   - stopTimer(): Returns elapsed ms since startTimer, clears ref.
 *   - getElapsedMs(): Returns current elapsed without stopping.
 *   - resetTimer(): Clears the ref without returning a value.
 */
export function useQuestionTimer(questionIndex: number) {
  const startTimeRef = useRef<number | null>(null)

  // Auto-start timer when question index changes (Task 2.7)
  useEffect(() => {
    startTimeRef.current = Date.now()
  }, [questionIndex])

  /**
   * Manually start the timer (records current timestamp).
   * Called automatically by the useEffect on question advance.
   * Can also be called manually to restart the timer mid-question.
   */
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now()
  }, [])

  /**
   * Stop the timer and return elapsed milliseconds.
   * Clears the timer ref after reading (subsequent calls return 0).
   * Returns 0 if the timer was never started or already stopped.
   */
  const stopTimer = useCallback((): number => {
    if (startTimeRef.current === null) return 0
    const elapsed = Date.now() - startTimeRef.current
    startTimeRef.current = null
    return elapsed
  }, [])

  /**
   * Return current elapsed milliseconds without stopping the timer.
   * Useful for display purposes (e.g., showing time elapsed).
   * Returns 0 if the timer is not running.
   */
  const getElapsedMs = useCallback((): number => {
    if (startTimeRef.current === null) return 0
    return Date.now() - startTimeRef.current
  }, [])

  /**
   * Clear the timer ref without returning a value.
   * Called on question advance to prevent stale timing data.
   */
  const resetTimer = useCallback(() => {
    startTimeRef.current = null
  }, [])

  return { startTimer, stopTimer, getElapsedMs, resetTimer }
}
