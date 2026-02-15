/**
 * Book and Chapter Types
 *
 * Type definitions for book selection and chapter navigation.
 * Used by BookCard component, Books screen, and chapter progress tracking.
 */

export interface Book {
  id: number
  title: string
  titleChinese: string
  chapterCount: number
  coverColor: string
}

export interface BookProgress {
  bookId: number
  chaptersCompleted: number
  totalChapters: number
}

export interface Chapter {
  id: number
  bookId: number
  chapterNumber: number
  titleEnglish: string
  titleChinese: string
}

export interface ChapterProgress {
  id: string
  userId: string
  chapterId: number
  bookId: number
  completionPercentage: number
  masteredAt: string | null
  updatedAt: string
}
