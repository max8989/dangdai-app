/**
 * TanStack Query Keys
 *
 * Centralized query key factory for TanStack Query.
 * Consistent query key structure: [resource, ...identifiers]
 * This pattern enables efficient cache invalidation.
 *
 * Per architecture specification, TanStack Query manages server state:
 * - User profile
 * - Chapter progress
 * - Quiz history
 */

export const queryKeys = {
  // User data
  user: ['user'] as const,
  userProfile: (userId: string) => ['user', 'profile', userId] as const,

  // Books and chapters
  books: (userId: string) => ['books', userId] as const,
  booksAll: ['books'] as const,
  chapters: (bookId: number) => ['chapters', bookId] as const,
  chapter: (chapterId: number) => ['chapter', chapterId] as const,

  // Quiz data
  quizzes: ['quizzes'] as const,
  quiz: (quizId: string) => ['quiz', quizId] as const,
  quizHistory: (userId: string) => ['quizHistory', userId] as const,

  // Progress data
  progress: ['progress'] as const,
  userProgress: (userId: string) => ['progress', userId] as const,
  chapterProgress: (userId: string, bookId: number) =>
    ['chapterProgress', userId, bookId] as const,
  singleChapterProgress: (userId: string, chapterId: number) =>
    ['progress', userId, 'chapter', chapterId] as const,

  // Activity and streaks
  dailyActivity: (userId: string) => ['dailyActivity', userId] as const,
  streak: (userId: string) => ['streak', userId] as const,

  // Exercise type progress (Story 4.11)
  exerciseTypeProgress: (chapterId: number) => ['exerciseTypeProgress', chapterId] as const,
} as const

// Type helper for query key extraction
export type QueryKeys = typeof queryKeys
