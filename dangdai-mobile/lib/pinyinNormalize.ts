/**
 * Pinyin normalization utilities for answer validation.
 * Story 4.12: Text Input Answer Type
 *
 * Normalizes pinyin input to a canonical form for comparison,
 * handling tone marks, tone numbers, and ü/v equivalence.
 */

/** Map of tone-marked vowels to their base vowel + tone number */
const TONE_MARK_TO_NUMBER: Record<string, string> = {
  // a tones
  ā: 'a1',
  á: 'a2',
  ǎ: 'a3',
  à: 'a4',
  // e tones
  ē: 'e1',
  é: 'e2',
  ě: 'e3',
  è: 'e4',
  // i tones
  ī: 'i1',
  í: 'i2',
  ǐ: 'i3',
  ì: 'i4',
  // o tones
  ō: 'o1',
  ó: 'o2',
  ǒ: 'o3',
  ò: 'o4',
  // u tones
  ū: 'u1',
  ú: 'u2',
  ǔ: 'u3',
  ù: 'u4',
  // ü tones (normalized to v)
  ǖ: 'v1',
  ǘ: 'v2',
  ǚ: 'v3',
  ǜ: 'v4',
}

/**
 * Normalize pinyin to a canonical form for comparison.
 *
 * Converts tone marks to tone numbers, lowercases, strips extra spaces,
 * and normalizes ü to v for consistent comparison.
 *
 * @param input - Pinyin string to normalize
 * @returns Normalized pinyin string
 *
 * @example
 * normalizePinyin("xué") // → "xue2"
 * normalizePinyin("xue2") // → "xue2"
 * normalizePinyin("Xué") // → "xue2"
 * normalizePinyin("lǜ") // → "lv4"
 * normalizePinyin("lv4") // → "lv4"
 * normalizePinyin("nǚ") // → "nv3"
 */
export function normalizePinyin(input: string): string {
  let result = input.toLowerCase().trim()

  // Replace ü with v (standard pinyin input convention)
  result = result.replace(/ü/g, 'v')

  // Process each syllable: find tone-marked vowels and move tone number to end
  // This ensures "hǎo" becomes "hao3" not "ha3o"
  result = result.replace(/\S+/g, (syllable) => {
    // Check if syllable contains a tone-marked vowel
    for (const [marked, numbered] of Object.entries(TONE_MARK_TO_NUMBER)) {
      if (syllable.includes(marked)) {
        // Extract base vowel and tone number (e.g., "a3" → base="a", tone="3")
        const baseVowel = numbered.slice(0, -1)
        const toneNumber = numbered.slice(-1)
        // Replace tone-marked vowel with base vowel, then append tone at syllable end
        return syllable.replace(marked, baseVowel) + toneNumber
      }
    }
    // No tone mark found — return syllable unchanged (already has tone number or is neutral tone)
    return syllable
  })

  // Collapse multiple whitespace characters to single space
  result = result.replace(/\s+/g, ' ')

  // Trim again in case whitespace normalization created leading/trailing spaces
  return result.trim()
}
