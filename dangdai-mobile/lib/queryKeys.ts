/**
 * TanStack Query Keys
 *
 * Centralized query key factory for TanStack Query.
 * Will be implemented in Story 1-5 (Configure State Management).
 */

/**
 * Query key factory for type-safe query keys
 *
 * Usage:
 * ```ts
 * import { queryKeys } from '@/lib/queryKeys';
 *
 * // In a query
 * useQuery({
 *   queryKey: queryKeys.users.detail(userId),
 *   queryFn: () => fetchUser(userId),
 * });
 * ```
 */
export const queryKeys = {
  // User queries
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // Quiz queries (placeholder for future stories)
  quizzes: {
    all: ['quizzes'] as const,
    lists: () => [...queryKeys.quizzes.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.quizzes.lists(), filters] as const,
    details: () => [...queryKeys.quizzes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.quizzes.details(), id] as const,
  },

  // Chapter queries (placeholder for future stories)
  chapters: {
    all: ['chapters'] as const,
    lists: () => [...queryKeys.chapters.all, 'list'] as const,
    list: (bookId: string) => [...queryKeys.chapters.lists(), bookId] as const,
    details: () => [...queryKeys.chapters.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.chapters.details(), id] as const,
  },

  // Progress queries (placeholder for future stories)
  progress: {
    all: ['progress'] as const,
    user: (userId: string) => [...queryKeys.progress.all, userId] as const,
    chapter: (userId: string, chapterId: string) =>
      [...queryKeys.progress.user(userId), 'chapter', chapterId] as const,
  },
} as const;
