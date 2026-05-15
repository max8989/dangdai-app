/**
 * Book Definitions
 *
 * Static book metadata for Dangdai Chinese textbook series (Books 1-4).
 * Chapter counts match the actual NTNU textbook structure.
 */

import type { Book } from '../types/chapter'

export const BOOKS: readonly Book[] = [
  {
    id: 1,
    title: 'Book 1',
    titleChinese: '當代中文課程 第一冊',
    chapterCount: 15,
    coverColor: '$blue9',
  },
  {
    id: 2,
    title: 'Book 2',
    titleChinese: '當代中文課程 第二冊',
    chapterCount: 15,
    coverColor: '$green9',
  },
  {
    id: 3,
    title: 'Book 3',
    titleChinese: '當代中文課程 第三冊',
    chapterCount: 12,
    coverColor: '$orange9',
  },
  {
    id: 4,
    title: 'Book 4',
    titleChinese: '當代中文課程 第四冊',
    chapterCount: 12,
    coverColor: '$purple9',
  },
] as const
