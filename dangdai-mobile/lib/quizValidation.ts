/**
 * Quiz answer validation utilities.
 * Story 4.12: Text Input Answer Type
 *
 * Provides validation for typed text answers (pinyin and meaning).
 */

import { normalizePinyin } from './pinyinNormalize'

/**
 * Validate a typed text answer against the correct answer.
 *
 * For pinyin: normalizes tone marks/numbers and compares.
 * For meaning: trims whitespace and compares case-insensitively.
 *
 * @param userAnswer - The user's typed answer
 * @param correctAnswer - The correct answer from the question
 * @param questionType - Whether this is a 'pinyin' or 'meaning' question
 * @returns true if the answer is correct, false otherwise
 *
 * @example
 * // Pinyin validation
 * validateTextAnswer("xué", "xue2", "pinyin") // → true
 * validateTextAnswer("xue2", "xué", "pinyin") // → true
 * validateTextAnswer("lv4", "lǜ", "pinyin") // → true
 *
 * @example
 * // Meaning validation
 * validateTextAnswer("to study", "To Study", "meaning") // → true
 * validateTextAnswer("  hello  ", "hello", "meaning") // → true
 */
export function validateTextAnswer(
  userAnswer: string,
  correctAnswer: string,
  questionType: 'pinyin' | 'meaning'
): boolean {
  // Reject empty or whitespace-only input
  if (!userAnswer.trim() || !correctAnswer.trim()) {
    return false
  }

  if (questionType === 'pinyin') {
    return normalizePinyin(userAnswer) === normalizePinyin(correctAnswer)
  }

  // Meaning: case-insensitive, trimmed exact match
  return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
}
