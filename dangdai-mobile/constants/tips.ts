/**
 * Loading Screen Tips
 *
 * Chinese learning tips displayed during quiz generation loading.
 * Tips rotate every 2 seconds with random non-repeating selection.
 *
 * Story 4.2: Quiz Loading Screen with Progressive Loading
 */

/**
 * Collection of Chinese learning tips for the loading screen.
 * Mix of language tips, cultural facts, and study advice.
 */
export const LOADING_TIPS = [
  'Did you know? \u4f60\u597d literally means "you good"!',
  'Tip: Practice writing characters by hand to build muscle memory.',
  'Fun fact: Mandarin has 4 tones (plus a neutral tone).',
  'The character \u4eba (r\u00e9n) looks like a person walking!',
  'Tip: Listen to Chinese music or podcasts to improve your tones.',
  'Fun fact: Chinese has no verb conjugation \u2014 tense is shown by context words.',
  'The character \u5c71 (sh\u0101n) looks like a mountain with three peaks!',
  'Tip: Use flashcards to review characters daily for long-term retention.',
  'Fun fact: There are over 50,000 Chinese characters, but 3,000 cover 99% of daily use.',
  'The character \u706b (hu\u01d2) looks like a campfire with sparks!',
  'Tip: Try shadowing \u2014 repeat after native speakers to improve pronunciation.',
  'Fun fact: The same character can have different meanings with different tones.',
  'Tip: Learn radicals first \u2014 they are the building blocks of Chinese characters.',
  'Fun fact: \u8c22\u8c22 (xi\u00e8xie) originally meant "to wither" before meaning "thank you".',
  'The character \u53e3 (k\u01d2u) looks like an open mouth!',
  'Tip: Watch Chinese dramas with subtitles to learn natural conversation patterns.',
  'Fun fact: Chinese word order is Subject-Verb-Object, just like English!',
  'Tip: Focus on the most common 500 characters first for rapid progress.',
] as const

/** Interval in milliseconds between tip rotations. */
export const TIP_ROTATION_INTERVAL_MS = 2_000

/**
 * Get a random tip index that differs from the current one.
 * Ensures non-repeating tip selection.
 *
 * @param currentIndex - The index of the currently displayed tip.
 * @param totalTips - The total number of tips available.
 * @returns A new random index different from currentIndex.
 */
export function getNextTipIndex(currentIndex: number, totalTips: number): number {
  if (totalTips <= 1) return 0

  let nextIndex: number
  do {
    nextIndex = Math.floor(Math.random() * totalTips)
  } while (nextIndex === currentIndex)

  return nextIndex
}
