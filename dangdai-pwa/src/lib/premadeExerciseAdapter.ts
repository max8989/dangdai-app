/**
 * Premade Exercise Content Adapter
 *
 * Transforms premade exercise content JSONB (from the premade_exercises table)
 * into the QuizQuestion format used by existing quiz UI components.
 *
 * This adapter is the bridge between the static workbook content stored in
 * Supabase and the exercise components built for AI-generated quizzes.
 * All existing components (FillInBlankSentence, MatchingExercise, etc.) work
 * unchanged — only the data format changes.
 *
 * Key design decisions:
 * - NO LLM calls — all content comes from the database
 * - correct_answer is derived from stored content for local validation
 * - Each exercise type maps to one or more QuizQuestion entries
 * - Unknown exercise types return an empty array (graceful degradation)
 *
 * Story 11.8: Premade Exercise Completion Flow — Task 3
 */

import type { QuizQuestion } from '../types/quiz'

// ─── Content JSONB shape types ────────────────────────────────────────────────

/** A single fill-in-blank sentence from the content JSONB */
interface FillInBlankSentence {
  text_with_blanks: string
  word_bank: string[]
  correct_answers: string[]
  /** Optional instruction text for this sentence */
  instruction?: string
  /** Optional explanation shown after answering */
  explanation?: string
}

/** Content JSONB for fill_in_blank exercises */
interface FillInBlankContent {
  sentences: FillInBlankSentence[]
  /** Optional global instruction */
  instruction?: string
}

/** A single matching pair from the content JSONB */
interface MatchingPairContent {
  left: string
  right: string
}

/** Content JSONB for matching exercises */
interface MatchingContent {
  pairs: MatchingPairContent[]
  /** Optional instruction */
  instruction?: string
  /** Optional explanation */
  explanation?: string
}

/** A single sentence construction item from the content JSONB */
interface SentenceConstructionItem {
  scrambled_words: string[]
  correct_order: string[]
  /** Optional instruction for this sentence */
  instruction?: string
  /** Optional explanation */
  explanation?: string
}

/** Content JSONB for sentence_construction exercises */
interface SentenceConstructionContent {
  sentences: SentenceConstructionItem[]
  /** Optional global instruction */
  instruction?: string
}

/** A comprehension sub-question from the content JSONB */
interface ComprehensionQuestion {
  question: string
  options: string[]
  correct_answer: string
  /** Optional explanation */
  explanation?: string
}

/** Content JSONB for reading comprehension exercises */
interface ReadingContent {
  passage: string
  passage_pinyin?: string
  questions: ComprehensionQuestion[]
  /** Optional instruction */
  instruction?: string
}

/** A single dialogue line from the content JSONB */
interface DialogueLine {
  speaker: 'a' | 'b'
  text: string
  is_blank: boolean
}

/** Content JSONB for dialogue_completion exercises */
interface DialogueContent {
  lines: DialogueLine[]
  options: string[]
  correct_answer: string
  /** Optional explanation */
  explanation?: string
  /** Optional instruction */
  instruction?: string
}

// ─── Adapter functions ────────────────────────────────────────────────────────

/**
 * Adapt fill_in_blank content to QuizQuestion[].
 * Each sentence in the content becomes one QuizQuestion.
 */
function adaptFillInBlank(content: Record<string, unknown>): QuizQuestion[] {
  const typed = content as unknown as FillInBlankContent
  if (!typed.sentences || !Array.isArray(typed.sentences)) {
    console.warn('[premadeExerciseAdapter] fill_in_blank: missing sentences array')
    return []
  }

  return typed.sentences.map((sentence, index): QuizQuestion => {
    // correct_answer is comma-joined for multi-blank sentences (matches validateFillInBlank)
    const correctAnswer = sentence.correct_answers.join(',')

    return {
      question_id: `premade-fib-${index}`,
      exercise_type: 'fill_in_blank',
      question_text: sentence.instruction ?? typed.instruction ?? 'Fill in the blanks:',
      correct_answer: correctAnswer,
      explanation: sentence.explanation ?? '',
      source_citation: '',
      sentence_with_blanks: sentence.text_with_blanks,
      word_bank: sentence.word_bank,
      blank_positions: sentence.correct_answers.map((_, i) => i),
    }
  })
}

/**
 * Adapt matching content to QuizQuestion[].
 * All pairs become a single matching QuizQuestion.
 */
function adaptMatching(content: Record<string, unknown>): QuizQuestion[] {
  const typed = content as unknown as MatchingContent
  if (!typed.pairs || !Array.isArray(typed.pairs) || typed.pairs.length === 0) {
    console.warn('[premadeExerciseAdapter] matching: missing or empty pairs array')
    return []
  }

  // Build pairs in the format expected by MatchingExercise
  const pairs = typed.pairs.map((pair) => ({
    left: pair.left,
    right: pair.right,
  }))

  // correct_answer is a JSON string of the pairs for local validation reference
  const correctAnswer = JSON.stringify(pairs)

  return [
    {
      question_id: 'premade-matching-0',
      exercise_type: 'matching',
      question_text: typed.instruction ?? 'Match the items:',
      correct_answer: correctAnswer,
      explanation: typed.explanation ?? '',
      source_citation: '',
      pairs,
    },
  ]
}

/**
 * Adapt sentence_construction content to QuizQuestion[].
 * Each sentence becomes one QuizQuestion.
 */
function adaptSentenceConstruction(content: Record<string, unknown>): QuizQuestion[] {
  const typed = content as unknown as SentenceConstructionContent
  if (!typed.sentences || !Array.isArray(typed.sentences)) {
    console.warn('[premadeExerciseAdapter] sentence_construction: missing sentences array')
    return []
  }

  return typed.sentences.map((sentence, index): QuizQuestion => {
    // correct_answer is the joined correct order (space-separated)
    const correctAnswer = sentence.correct_order.join(' ')

    return {
      question_id: `premade-sc-${index}`,
      exercise_type: 'sentence_construction',
      question_text: sentence.instruction ?? typed.instruction ?? 'Arrange the words:',
      correct_answer: correctAnswer,
      explanation: sentence.explanation ?? '',
      source_citation: '',
      scrambled_words: sentence.scrambled_words,
      correct_order: sentence.correct_order,
    }
  })
}

/**
 * Adapt reading comprehension content to QuizQuestion[].
 * The passage + all sub-questions become a single QuizQuestion.
 */
function adaptReadingComprehension(content: Record<string, unknown>): QuizQuestion[] {
  const typed = content as unknown as ReadingContent
  if (!typed.passage) {
    console.warn('[premadeExerciseAdapter] reading: missing passage')
    return []
  }
  if (!typed.questions || !Array.isArray(typed.questions) || typed.questions.length === 0) {
    console.warn('[premadeExerciseAdapter] reading: missing or empty questions array')
    return []
  }

  const comprehensionQuestions = typed.questions.map((q) => ({
    question: q.question,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
  }))

  return [
    {
      question_id: 'premade-reading-0',
      exercise_type: 'reading_comprehension',
      question_text: typed.instruction ?? 'Read the passage and answer the questions:',
      // correct_answer for the passage is the first sub-question's answer (used as fallback)
      correct_answer: typed.questions[0]?.correct_answer ?? '',
      explanation: '',
      source_citation: '',
      passage: typed.passage,
      passage_pinyin: typed.passage_pinyin,
      comprehension_questions: comprehensionQuestions,
    },
  ]
}

/**
 * Adapt dialogue_completion content to QuizQuestion[].
 * The dialogue becomes a single QuizQuestion.
 */
function adaptDialogueCompletion(content: Record<string, unknown>): QuizQuestion[] {
  const typed = content as unknown as DialogueContent
  if (!typed.lines || !Array.isArray(typed.lines) || typed.lines.length === 0) {
    console.warn('[premadeExerciseAdapter] dialogue_completion: missing or empty lines array')
    return []
  }
  if (!typed.options || !Array.isArray(typed.options) || typed.options.length === 0) {
    console.warn('[premadeExerciseAdapter] dialogue_completion: missing or empty options array')
    return []
  }

  // Map content dialogue lines to the DialogueLine format expected by DialogueCard
  const dialogueLines = typed.lines.map((line) => ({
    speaker: line.speaker,
    text: line.is_blank ? '' : line.text,
    isBlank: line.is_blank,
  }))

  return [
    {
      question_id: 'premade-dialogue-0',
      exercise_type: 'dialogue_completion',
      question_text: typed.instruction ?? 'Complete the dialogue:',
      correct_answer: typed.correct_answer,
      explanation: typed.explanation ?? '',
      source_citation: '',
      dialogue_lines: dialogueLines,
      options: typed.options,
    },
  ]
}

// ─── Multiple-choice content types (vocabulary, grammar) ─────────────────────

/** A single multiple-choice question from vocabulary/grammar content JSONB */
interface MultipleChoiceQuestion {
  question_id: number
  question_text: string
  question_type: string
  options: string[]
  correct_answer: string
  explanation: string
  source_citation: string
}

/** Content JSONB for vocabulary and grammar exercises */
interface MultipleChoiceContent {
  questions: MultipleChoiceQuestion[]
}

// ─── Multiple-choice adapter (vocabulary, grammar, mixed) ────────────────────

/**
 * Adapt multiple-choice content to QuizQuestion[].
 * Used by vocabulary, grammar, and mixed exercise types which share the same
 * content JSONB structure (questions array with options + correct_answer).
 */
function adaptMultipleChoice(
  content: Record<string, unknown>,
  exerciseType: string,
  idPrefix: string,
): QuizQuestion[] {
  const typed = content as unknown as MultipleChoiceContent
  if (!typed.questions || !Array.isArray(typed.questions) || typed.questions.length === 0) {
    console.warn(`[premadeExerciseAdapter] ${exerciseType}: missing or empty questions array`)
    return []
  }

  return typed.questions.map((q, index): QuizQuestion => ({
    question_id: `premade-${idPrefix}-${index}`,
    exercise_type: exerciseType as QuizQuestion['exercise_type'],
    question_text: q.question_text,
    correct_answer: q.correct_answer,
    explanation: q.explanation ?? '',
    source_citation: q.source_citation ?? '',
    options: q.options,
  }))
}

// ─── Main adapter ─────────────────────────────────────────────────────────────

/**
 * Fisher–Yates shuffle that returns a new array (does not mutate input).
 */
function shuffled<T>(arr: readonly T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Randomize the position of `options` for each question — and for each
 * comprehension sub-question — so the correct answer doesn't always land at
 * index 0. Cached premade content was generated under a prompt that biased the
 * LLM toward putting the answer first; we re-shuffle on every load so position
 * is uncorrelated with correctness.
 */
function shuffleQuestionOptions(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.map((q) => {
    const next: QuizQuestion = { ...q }
    if (Array.isArray(q.options) && q.options.length > 1 && q.correct_answer) {
      next.options = shuffled(q.options)
    }
    if (Array.isArray(q.comprehension_questions)) {
      next.comprehension_questions = q.comprehension_questions.map((sub) => {
        if (!Array.isArray(sub.options) || sub.options.length <= 1) return sub
        const correctText =
          sub.correct_answer ??
          (typeof sub.correct === 'number' ? sub.options[sub.correct] : '') ??
          ''
        const newOptions = shuffled(sub.options)
        const newCorrectIdx = newOptions.indexOf(correctText)
        return {
          ...sub,
          options: newOptions,
          correct: newCorrectIdx >= 0 ? newCorrectIdx : sub.correct,
          correct_answer: correctText,
        }
      })
    }
    return next
  })
}

/**
 * Transform premade exercise content JSONB into the QuizQuestion[] format
 * used by all existing quiz UI components.
 *
 * @param exerciseType - The exercise_type from the premade_exercises table
 * @param content - The content JSONB field (cast from Supabase as unknown)
 * @returns Array of QuizQuestion objects ready for use with quiz components
 */
export function adaptPremadeContent(
  exerciseType: string,
  content: Record<string, unknown>,
): QuizQuestion[] {
  // Story 4.17: AI-generated content arrives as {"questions": [...]} where each
  // question already has exercise_type, question_text, etc. Detect this format
  // by checking if the first question has an exercise_type field.
  const questionsArr = content.questions as any[] | undefined
  if (
    questionsArr &&
    Array.isArray(questionsArr) &&
    questionsArr.length > 0 &&
    questionsArr[0].exercise_type
  ) {
    console.log('[premadeExerciseAdapter] AI format detected, first q keys:', Object.keys(questionsArr[0]).join(', '), 'dialogue_bubbles?', !!questionsArr[0].dialogue_bubbles)
    return shuffleQuestionOptions(adaptAIGeneratedQuestions(questionsArr))
  }
  console.log('[premadeExerciseAdapter] Legacy format, exerciseType:', exerciseType, 'content keys:', Object.keys(content).join(', '))

  let result: QuizQuestion[]
  switch (exerciseType) {
    case 'fill_in_blank':
      result = adaptFillInBlank(content)
      break
    case 'matching':
      result = adaptMatching(content)
      break
    case 'dialogue_completion':
      result = adaptDialogueCompletion(content)
      break
    case 'sentence_construction':
      result = adaptSentenceConstruction(content)
      break
    case 'reading':
    case 'reading_comprehension':
      result = adaptReadingComprehension(content)
      break
    case 'vocabulary':
      result = adaptMultipleChoice(content, 'vocabulary', 'vocab')
      break
    case 'grammar':
      result = adaptMultipleChoice(content, 'grammar', 'grammar')
      break
    case 'mixed':
      result = adaptMultipleChoice(content, 'mixed', 'mixed')
      break
    default:
      console.warn(`[premadeExerciseAdapter] Unknown exercise type: ${exerciseType}`)
      return []
  }
  return shuffleQuestionOptions(result)
}

/**
 * Adapt AI-generated questions (from /api/exercises/generate) to QuizQuestion[].
 *
 * AI questions already contain exercise_type, question_text, correct_answer, etc.
 * We just need to map LLM field names to the mobile QuizQuestion field names
 * (e.g., dialogue_bubbles → dialogue_lines).
 *
 * Story 4.17: On-the-fly AI generation with baked-in validation metadata.
 */
function adaptAIGeneratedQuestions(questions: any[]): QuizQuestion[] {
  return questions.map((q, i): QuizQuestion => {
    const base: QuizQuestion = {
      question_id: q.question_id ?? `ai-${i}`,
      exercise_type: q.exercise_type,
      question_text: q.question_text ?? '',
      correct_answer: q.correct_answer ?? '',
      explanation: q.explanation ?? '',
      source_citation: q.source_citation ?? '',
      options: Array.isArray(q.options) ? q.options.map((o: any) => typeof o === 'string' ? o : String(o)) : q.options,
      character: q.character,
      pinyin: q.pinyin,
      sentence_with_blanks: q.sentence_with_blanks ?? '',
      word_bank: Array.isArray(q.word_bank) ? q.word_bank.map((w: any) => typeof w === 'string' ? w : String(w)) : [],
      blank_positions: q.blank_positions,
      scrambled_words: q.scrambled_words,
      correct_order: q.correct_order?.map(String),
      left_items: q.left_items,
      right_items: q.right_items,
      correct_pairs: q.correct_pairs,
      passage: q.passage,
      acceptable_answer_variants: q.acceptable_answer_variants,
      semantic_rubric: q.semantic_rubric,
      english_translation: q.english_translation,
    }

    // Map dialogue_bubbles → dialogue_lines
    if (q.dialogue_bubbles && Array.isArray(q.dialogue_bubbles)) {
      base.dialogue_lines = q.dialogue_bubbles.map((b: any) => ({
        speaker: b.speaker?.toLowerCase() ?? 'a',
        text: b.is_blank ? '' : (b.text ?? ''),
        isBlank: !!b.is_blank,
      }))
      console.log(`[adaptAI] q${i} dialogue_lines mapped:`, base.dialogue_lines?.length, 'from bubbles:', q.dialogue_bubbles.length)
    } else if (q.exercise_type === 'dialogue_completion') {
      console.warn(`[adaptAI] q${i} is dialogue_completion but NO dialogue_bubbles! Keys:`, Object.keys(q).join(', '))
    }

    // Map comprehension_questions
    if (q.comprehension_questions && Array.isArray(q.comprehension_questions)) {
      base.comprehension_questions = q.comprehension_questions.map((sub: any) => ({
        question: sub.question,
        options: sub.options,
        correct: sub.correct,
        correct_answer: sub.correct_answer ?? sub.options?.[sub.correct] ?? '',
        explanation: sub.explanation,
      }))
    }

    return base
  })
}
