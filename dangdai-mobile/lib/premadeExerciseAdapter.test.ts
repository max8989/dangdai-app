/**
 * Premade Exercise Adapter Tests
 *
 * Unit tests for the adaptPremadeContent function.
 * Tests each exercise type transformation from content JSONB to QuizQuestion[].
 *
 * Story 11.8: Premade Exercise Completion Flow — Task 7.5, 7.6
 */

import { adaptPremadeContent } from './premadeExerciseAdapter'

// ─── Fill-in-blank tests ──────────────────────────────────────────────────────

describe('adaptPremadeContent — fill_in_blank', () => {
  const fillInBlankContent = {
    instruction: 'Fill in the blanks:',
    sentences: [
      {
        text_with_blanks: '我___去___買東西。',
        word_bank: ['想', '要', '超市', '商店', '會'],
        correct_answers: ['想', '超市'],
        instruction: 'Complete the sentence:',
        explanation: '想 means "want to" and 超市 means "supermarket".',
      },
      {
        text_with_blanks: '我很___吃中國菜。',
        word_bank: ['喜歡', '想要', '可以', '應該'],
        correct_answers: ['喜歡'],
        explanation: '喜歡 means "to like".',
      },
    ],
  }

  it('returns one QuizQuestion per sentence', () => {
    const result = adaptPremadeContent('fill_in_blank', fillInBlankContent)
    expect(result).toHaveLength(2)
  })

  it('sets exercise_type to fill_in_blank', () => {
    const result = adaptPremadeContent('fill_in_blank', fillInBlankContent)
    expect(result[0].exercise_type).toBe('fill_in_blank')
    expect(result[1].exercise_type).toBe('fill_in_blank')
  })

  it('joins correct_answers with comma for multi-blank sentences', () => {
    const result = adaptPremadeContent('fill_in_blank', fillInBlankContent)
    expect(result[0].correct_answer).toBe('想,超市')
  })

  it('uses single correct_answer for single-blank sentences', () => {
    const result = adaptPremadeContent('fill_in_blank', fillInBlankContent)
    expect(result[1].correct_answer).toBe('喜歡')
  })

  it('maps sentence_with_blanks correctly', () => {
    const result = adaptPremadeContent('fill_in_blank', fillInBlankContent)
    expect(result[0].sentence_with_blanks).toBe('我___去___買東西。')
    expect(result[1].sentence_with_blanks).toBe('我很___吃中國菜。')
  })

  it('maps word_bank correctly', () => {
    const result = adaptPremadeContent('fill_in_blank', fillInBlankContent)
    expect(result[0].word_bank).toEqual(['想', '要', '超市', '商店', '會'])
  })

  it('uses sentence-level instruction when available', () => {
    const result = adaptPremadeContent('fill_in_blank', fillInBlankContent)
    expect(result[0].question_text).toBe('Complete the sentence:')
  })

  it('falls back to global instruction when sentence instruction is missing', () => {
    const result = adaptPremadeContent('fill_in_blank', fillInBlankContent)
    expect(result[1].question_text).toBe('Fill in the blanks:')
  })

  it('maps explanation correctly', () => {
    const result = adaptPremadeContent('fill_in_blank', fillInBlankContent)
    expect(result[0].explanation).toBe('想 means "want to" and 超市 means "supermarket".')
  })

  it('generates blank_positions array', () => {
    const result = adaptPremadeContent('fill_in_blank', fillInBlankContent)
    expect(result[0].blank_positions).toEqual([0, 1])
    expect(result[1].blank_positions).toEqual([0])
  })

  it('returns empty array when sentences is missing', () => {
    const result = adaptPremadeContent('fill_in_blank', { instruction: 'test' })
    expect(result).toHaveLength(0)
  })

  it('returns empty array when sentences is not an array', () => {
    const result = adaptPremadeContent('fill_in_blank', { sentences: 'not-an-array' })
    expect(result).toHaveLength(0)
  })
})

// ─── Matching tests ───────────────────────────────────────────────────────────

describe('adaptPremadeContent — matching', () => {
  const matchingContent = {
    instruction: 'Match the Chinese with the English:',
    pairs: [
      { left: '你好', right: 'Hello' },
      { left: '謝謝', right: 'Thank you' },
      { left: '再見', right: 'Goodbye' },
    ],
    explanation: 'Common greetings.',
  }

  it('returns a single QuizQuestion for all pairs', () => {
    const result = adaptPremadeContent('matching', matchingContent)
    expect(result).toHaveLength(1)
  })

  it('sets exercise_type to matching', () => {
    const result = adaptPremadeContent('matching', matchingContent)
    expect(result[0].exercise_type).toBe('matching')
  })

  it('maps pairs correctly', () => {
    const result = adaptPremadeContent('matching', matchingContent)
    expect(result[0].pairs).toEqual([
      { left: '你好', right: 'Hello' },
      { left: '謝謝', right: 'Thank you' },
      { left: '再見', right: 'Goodbye' },
    ])
  })

  it('uses instruction as question_text', () => {
    const result = adaptPremadeContent('matching', matchingContent)
    expect(result[0].question_text).toBe('Match the Chinese with the English:')
  })

  it('maps explanation correctly', () => {
    const result = adaptPremadeContent('matching', matchingContent)
    expect(result[0].explanation).toBe('Common greetings.')
  })

  it('returns empty array when pairs is missing', () => {
    const result = adaptPremadeContent('matching', { instruction: 'test' })
    expect(result).toHaveLength(0)
  })

  it('returns empty array when pairs is empty', () => {
    const result = adaptPremadeContent('matching', { pairs: [] })
    expect(result).toHaveLength(0)
  })
})

// ─── Sentence construction tests ──────────────────────────────────────────────

describe('adaptPremadeContent — sentence_construction', () => {
  const sentenceConstructionContent = {
    instruction: 'Arrange the words to form a sentence:',
    sentences: [
      {
        scrambled_words: ['去', '我', '超市', '想'],
        correct_order: ['我', '想', '去', '超市'],
        explanation: 'Subject + want + verb + object.',
      },
      {
        scrambled_words: ['中國菜', '喜歡', '她', '吃'],
        correct_order: ['她', '喜歡', '吃', '中國菜'],
        instruction: 'Put the words in order:',
      },
    ],
  }

  it('returns one QuizQuestion per sentence', () => {
    const result = adaptPremadeContent('sentence_construction', sentenceConstructionContent)
    expect(result).toHaveLength(2)
  })

  it('sets exercise_type to sentence_construction', () => {
    const result = adaptPremadeContent('sentence_construction', sentenceConstructionContent)
    expect(result[0].exercise_type).toBe('sentence_construction')
  })

  it('joins correct_order with space for correct_answer', () => {
    const result = adaptPremadeContent('sentence_construction', sentenceConstructionContent)
    expect(result[0].correct_answer).toBe('我 想 去 超市')
  })

  it('maps scrambled_words correctly', () => {
    const result = adaptPremadeContent('sentence_construction', sentenceConstructionContent)
    expect(result[0].scrambled_words).toEqual(['去', '我', '超市', '想'])
  })

  it('maps correct_order correctly', () => {
    const result = adaptPremadeContent('sentence_construction', sentenceConstructionContent)
    expect(result[0].correct_order).toEqual(['我', '想', '去', '超市'])
  })

  it('uses sentence-level instruction when available', () => {
    const result = adaptPremadeContent('sentence_construction', sentenceConstructionContent)
    expect(result[1].question_text).toBe('Put the words in order:')
  })

  it('falls back to global instruction', () => {
    const result = adaptPremadeContent('sentence_construction', sentenceConstructionContent)
    expect(result[0].question_text).toBe('Arrange the words to form a sentence:')
  })

  it('returns empty array when sentences is missing', () => {
    const result = adaptPremadeContent('sentence_construction', {})
    expect(result).toHaveLength(0)
  })
})

// ─── Reading comprehension tests ──────────────────────────────────────────────

describe('adaptPremadeContent — reading / reading_comprehension', () => {
  const readingContent = {
    instruction: 'Read the passage and answer the questions:',
    passage: '小明每天早上七點起床，然後去學校上課。',
    passage_pinyin: 'Xiǎo Míng měitiān zǎoshang qī diǎn qǐchuáng...',
    questions: [
      {
        question: '小明幾點起床？',
        options: ['六點', '七點', '八點', '九點'],
        correct_answer: '七點',
        explanation: '文章說七點起床。',
      },
      {
        question: '小明起床後去哪裡？',
        options: ['超市', '公園', '學校', '圖書館'],
        correct_answer: '學校',
      },
    ],
  }

  it('returns a single QuizQuestion for the passage', () => {
    const result = adaptPremadeContent('reading', readingContent)
    expect(result).toHaveLength(1)
  })

  it('sets exercise_type to reading_comprehension', () => {
    const result = adaptPremadeContent('reading', readingContent)
    expect(result[0].exercise_type).toBe('reading_comprehension')
  })

  it('also works with reading_comprehension exercise type', () => {
    const result = adaptPremadeContent('reading_comprehension', readingContent)
    expect(result).toHaveLength(1)
    expect(result[0].exercise_type).toBe('reading_comprehension')
  })

  it('maps passage correctly', () => {
    const result = adaptPremadeContent('reading', readingContent)
    expect(result[0].passage).toBe('小明每天早上七點起床，然後去學校上課。')
  })

  it('maps passage_pinyin correctly', () => {
    const result = adaptPremadeContent('reading', readingContent)
    expect(result[0].passage_pinyin).toBe('Xiǎo Míng měitiān zǎoshang qī diǎn qǐchuáng...')
  })

  it('maps comprehension_questions correctly', () => {
    const result = adaptPremadeContent('reading', readingContent)
    expect(result[0].comprehension_questions).toHaveLength(2)
    expect(result[0].comprehension_questions![0].question).toBe('小明幾點起床？')
    expect(result[0].comprehension_questions![0].correct_answer).toBe('七點')
    expect(result[0].comprehension_questions![0].options).toEqual(['六點', '七點', '八點', '九點'])
  })

  it('uses first question correct_answer as passage correct_answer', () => {
    const result = adaptPremadeContent('reading', readingContent)
    expect(result[0].correct_answer).toBe('七點')
  })

  it('returns empty array when passage is missing', () => {
    const result = adaptPremadeContent('reading', { questions: [] })
    expect(result).toHaveLength(0)
  })

  it('returns empty array when questions is empty', () => {
    const result = adaptPremadeContent('reading', { passage: 'test', questions: [] })
    expect(result).toHaveLength(0)
  })
})

// ─── Dialogue completion tests ────────────────────────────────────────────────

describe('adaptPremadeContent — dialogue_completion', () => {
  const dialogueContent = {
    instruction: 'Complete the dialogue:',
    lines: [
      { speaker: 'a', text: '你好！你叫什麼名字？', is_blank: false },
      { speaker: 'b', text: '', is_blank: true },
      { speaker: 'a', text: '很高興認識你！', is_blank: false },
    ],
    options: ['我叫小明。', '我不知道。', '你好嗎？', '再見！'],
    correct_answer: '我叫小明。',
    explanation: 'The correct response to "What is your name?" is "My name is Xiao Ming."',
  }

  it('returns a single QuizQuestion', () => {
    const result = adaptPremadeContent('dialogue_completion', dialogueContent)
    expect(result).toHaveLength(1)
  })

  it('sets exercise_type to dialogue_completion', () => {
    const result = adaptPremadeContent('dialogue_completion', dialogueContent)
    expect(result[0].exercise_type).toBe('dialogue_completion')
  })

  it('maps dialogue_lines correctly', () => {
    const result = adaptPremadeContent('dialogue_completion', dialogueContent)
    const lines = result[0].dialogue_lines!
    expect(lines).toHaveLength(3)
    expect(lines[0]).toEqual({ speaker: 'a', text: '你好！你叫什麼名字？', isBlank: false })
    expect(lines[1]).toEqual({ speaker: 'b', text: '', isBlank: true })
    expect(lines[2]).toEqual({ speaker: 'a', text: '很高興認識你！', isBlank: false })
  })

  it('maps options correctly', () => {
    const result = adaptPremadeContent('dialogue_completion', dialogueContent)
    expect(result[0].options).toEqual(['我叫小明。', '我不知道。', '你好嗎？', '再見！'])
  })

  it('maps correct_answer correctly', () => {
    const result = adaptPremadeContent('dialogue_completion', dialogueContent)
    expect(result[0].correct_answer).toBe('我叫小明。')
  })

  it('maps explanation correctly', () => {
    const result = adaptPremadeContent('dialogue_completion', dialogueContent)
    expect(result[0].explanation).toBe(
      'The correct response to "What is your name?" is "My name is Xiao Ming."'
    )
  })

  it('returns empty array when lines is missing', () => {
    const result = adaptPremadeContent('dialogue_completion', {
      options: ['a', 'b'],
      correct_answer: 'a',
    })
    expect(result).toHaveLength(0)
  })

  it('returns empty array when options is empty', () => {
    const result = adaptPremadeContent('dialogue_completion', {
      lines: [{ speaker: 'a', text: 'test', is_blank: false }],
      options: [],
      correct_answer: 'test',
    })
    expect(result).toHaveLength(0)
  })
})

// ─── Unknown exercise type tests ──────────────────────────────────────────────

describe('adaptPremadeContent — unknown exercise type', () => {
  it('returns empty array for unknown exercise type', () => {
    const result = adaptPremadeContent('unknown_type', { data: 'test' })
    expect(result).toHaveLength(0)
  })

  it('returns empty array for empty string exercise type', () => {
    const result = adaptPremadeContent('', { data: 'test' })
    expect(result).toHaveLength(0)
  })
})
