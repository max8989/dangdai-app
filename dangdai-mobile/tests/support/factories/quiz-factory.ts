/**
 * Data factories for quiz-related domain objects.
 *
 * All factories accept Partial<T> overrides and return complete typed objects.
 * Use `@faker-js/faker` for unique parallel-safe values.
 *
 * Convention: chapter IDs follow bookId * 100 + chapterNumber (e.g. Book 1 Ch 5 = 105).
 */

// ---------------------------------------------------------------------------
// Minimal inline faker-lite — avoids heavy @faker-js/faker dependency in E2E.
// Replace with `import { faker } from '@faker-js/faker'` if faker is installed.
// ---------------------------------------------------------------------------
let _counter = 0
const uid = () => `${Date.now()}-${(++_counter).toString(36)}`
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

// ---------------------------------------------------------------------------
// Domain types (mirrors the generated Supabase types where possible)
// ---------------------------------------------------------------------------
export type ExerciseType =
  | 'vocabulary'
  | 'grammar'
  | 'fill_in_blank'
  | 'matching'
  | 'dialogue_completion'
  | 'sentence_construction'
  | 'reading_comprehension'
  | 'mixed'

export type QuizQuestion = {
  id: string
  question_text: string
  options: string[]
  correct_answer: string
  exercise_type: ExerciseType
  difficulty: 'easy' | 'medium' | 'hard'
  chapter_id: number
  explanation: string
}

export type QuizRequest = {
  chapter_id: number
  exercise_type: ExerciseType
  num_questions: number
  user_id: string
}

export type QuizResult = {
  quiz_id: string
  chapter_id: number
  exercise_type: ExerciseType
  questions: QuizQuestion[]
  total_questions: number
  generation_time_ms: number
}

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

export const createQuizQuestion = (overrides: Partial<QuizQuestion> = {}): QuizQuestion => ({
  id: uid(),
  question_text: `What is the meaning of 你好 (${uid()})?`,
  options: ['Hello', 'Goodbye', 'Thank you', 'Sorry'],
  correct_answer: 'Hello',
  exercise_type: 'vocabulary',
  difficulty: 'easy',
  chapter_id: 101,
  explanation: '你好 (nǐ hǎo) means "Hello" in Mandarin.',
  ...overrides,
})

export const createQuizRequest = (overrides: Partial<QuizRequest> = {}): QuizRequest => ({
  chapter_id: 101,
  exercise_type: 'vocabulary',
  num_questions: 5,
  user_id: uid(),
  ...overrides,
})

export const createQuizResult = (overrides: Partial<QuizResult> = {}): QuizResult => {
  const chapterId = overrides.chapter_id ?? 101
  const exerciseType = overrides.exercise_type ?? 'vocabulary'
  const numQ = 5
  return {
    quiz_id: uid(),
    chapter_id: chapterId,
    exercise_type: exerciseType,
    questions: Array.from({ length: numQ }, () =>
      createQuizQuestion({ chapter_id: chapterId, exercise_type: exerciseType }),
    ),
    total_questions: numQ,
    generation_time_ms: Math.floor(Math.random() * 3000) + 200,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Book / Chapter factories
// ---------------------------------------------------------------------------

export type Book = {
  id: number
  title: string
  subtitle: string
  total_chapters: number
}

export type Chapter = {
  id: number
  book_id: number
  chapter_number: number
  title: string
  vocabulary_count: number
}

export const createBook = (overrides: Partial<Book> = {}): Book => ({
  id: pick([1, 2, 3, 4]),
  title: '當代中文課程',
  subtitle: 'A Course in Contemporary Chinese',
  total_chapters: 15,
  ...overrides,
})

export const createChapter = (overrides: Partial<Chapter> = {}): Chapter => {
  const bookId = overrides.book_id ?? 1
  const chapterNumber = overrides.chapter_number ?? 1
  return {
    id: bookId * 100 + chapterNumber,
    book_id: bookId,
    chapter_number: chapterNumber,
    title: `Lesson ${chapterNumber}`,
    vocabulary_count: Math.floor(Math.random() * 30) + 10,
    ...overrides,
  }
}
