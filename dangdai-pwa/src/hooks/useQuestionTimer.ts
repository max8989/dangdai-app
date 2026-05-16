/**
 * useQuestionTimer Hook
 *
 * Per-question timing for quiz sessions. Tracks time spent on each question
 * to populate the `time_spent_ms` field in `question_results`.
 *
 * Uses useRef for the start timestamp — the timer value does not need to trigger
 * re-renders. We only read it on answer submission.
 *
 * Auto-starts when questionIndex changes.
 */

import { useRef, useEffect, useCallback } from 'react'

export function useQuestionTimer(questionIndex: number) {
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    startTimeRef.current = Date.now()
  }, [questionIndex])

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now()
  }, [])

  const stopTimer = useCallback((): number => {
    if (startTimeRef.current === null) return 0
    const elapsed = Date.now() - startTimeRef.current
    startTimeRef.current = null
    return elapsed
  }, [])

  const getElapsedMs = useCallback((): number => {
    if (startTimeRef.current === null) return 0
    return Date.now() - startTimeRef.current
  }, [])

  const resetTimer = useCallback(() => {
    startTimeRef.current = null
  }, [])

  return { startTimer, stopTimer, getElapsedMs, resetTimer }
}
