import { useMemo } from 'react';

import { getChapter, getChaptersByBook } from '@/constants/chapters';
import type { Chapter } from '@/types/chapter';

export function useChapters(bookId: number): Chapter[] {
  return useMemo(() => getChaptersByBook(bookId), [bookId]);
}

export function useChapter(chapterId: number): Chapter | undefined {
  return useMemo(() => getChapter(chapterId), [chapterId]);
}
