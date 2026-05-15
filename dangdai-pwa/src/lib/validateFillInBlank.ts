/**
 * Fill-in-the-Blank Validation Utility
 *
 * Local validation for fill-in-blank exercises.
 * No LLM call needed — exact match against the answer key (case-insensitive, trimmed).
 *
 * Story 4.4: Fill-in-the-Blank Exercise (Word Bank)
 */

/**
 * Validate fill-in-the-blank answers against the answer key.
 *
 * Returns a boolean array where each element indicates whether the
 * corresponding blank was answered correctly. Comparison is
 * case-insensitive and trims whitespace from both sides.
 *
 * @param blankAnswers - Map of blank index → user-provided word
 * @param correctAnswers - Ordered array of correct answers (index-aligned with blanks)
 * @returns Array of booleans, one per blank (true = correct)
 */
export function validateFillInBlank(
  blankAnswers: Record<number, string>,
  correctAnswers: string[]
): boolean[] {
  return correctAnswers.map((correct, index) => {
    const userAnswer = blankAnswers[index]
    if (!userAnswer) return false
    return userAnswer.trim().toLowerCase() === correct.trim().toLowerCase()
  })
}

/**
 * Parse the correct_answer field from the API into an array of answers.
 *
 * The backend stores multiple blank answers as a comma-separated string
 * (e.g., "想,超市"). A single-blank answer has no comma (e.g., "喜歡").
 *
 * @param correctAnswer - Raw correct_answer string from API
 * @returns Array of individual correct answers, one per blank
 */
export function parseCorrectAnswers(correctAnswer: string): string[] {
  return correctAnswer.split(',').map((a) => a.trim())
}

/**
 * Check whether all blanks in a question have been filled.
 *
 * @param blankAnswers - Current blank answer state from the store
 * @param totalBlanks - Total number of blanks in the current question
 * @returns true if every blank has a non-null, non-empty value
 */
export function allBlanksFilled(
  blankAnswers: Record<number, string | null>,
  totalBlanks: number
): boolean {
  for (let i = 0; i < totalBlanks; i++) {
    if (!blankAnswers[i]) return false
  }
  return true
}
