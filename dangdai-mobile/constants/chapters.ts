/**
 * Chapter Definitions
 *
 * Static chapter metadata for Dangdai Chinese textbook series (Books 1-4).
 * Chapter counts: Book 1 (15), Book 2 (15), Book 3 (12), Book 4 (12).
 *
 * Chapter ID convention: bookId * 100 + chapterNumber
 * Example: Book 1, Chapter 5 = 105
 */

import type { Chapter } from '../types/chapter'

export const CHAPTERS: readonly Chapter[] = [
  // Book 1 - 15 chapters
  { id: 101, bookId: 1, chapterNumber: 1, titleEnglish: 'Greetings', titleChinese: '问候' },
  { id: 102, bookId: 1, chapterNumber: 2, titleEnglish: 'Names', titleChinese: '名字' },
  { id: 103, bookId: 1, chapterNumber: 3, titleEnglish: 'Numbers', titleChinese: '数字' },
  { id: 104, bookId: 1, chapterNumber: 4, titleEnglish: 'Time', titleChinese: '时间' },
  { id: 105, bookId: 1, chapterNumber: 5, titleEnglish: 'Dates', titleChinese: '日期' },
  { id: 106, bookId: 1, chapterNumber: 6, titleEnglish: 'Family', titleChinese: '家庭' },
  { id: 107, bookId: 1, chapterNumber: 7, titleEnglish: 'Countries', titleChinese: '国家' },
  { id: 108, bookId: 1, chapterNumber: 8, titleEnglish: 'Languages', titleChinese: '语言' },
  { id: 109, bookId: 1, chapterNumber: 9, titleEnglish: 'School', titleChinese: '学校' },
  { id: 110, bookId: 1, chapterNumber: 10, titleEnglish: 'Daily Life', titleChinese: '日常生活' },
  { id: 111, bookId: 1, chapterNumber: 11, titleEnglish: 'Weather', titleChinese: '天气' },
  { id: 112, bookId: 1, chapterNumber: 12, titleEnglish: 'Shopping', titleChinese: '购物' },
  { id: 113, bookId: 1, chapterNumber: 13, titleEnglish: 'Food', titleChinese: '食物' },
  { id: 114, bookId: 1, chapterNumber: 14, titleEnglish: 'Transportation', titleChinese: '交通' },
  { id: 115, bookId: 1, chapterNumber: 15, titleEnglish: 'Review', titleChinese: '复习' },

  // Book 2 - 15 chapters
  { id: 201, bookId: 2, chapterNumber: 1, titleEnglish: 'Hobbies', titleChinese: '爱好' },
  { id: 202, bookId: 2, chapterNumber: 2, titleEnglish: 'Sports', titleChinese: '运动' },
  { id: 203, bookId: 2, chapterNumber: 3, titleEnglish: 'Music', titleChinese: '音乐' },
  { id: 204, bookId: 2, chapterNumber: 4, titleEnglish: 'Travel', titleChinese: '旅行' },
  { id: 205, bookId: 2, chapterNumber: 5, titleEnglish: 'Health', titleChinese: '健康' },
  { id: 206, bookId: 2, chapterNumber: 6, titleEnglish: 'Work', titleChinese: '工作' },
  { id: 207, bookId: 2, chapterNumber: 7, titleEnglish: 'Housing', titleChinese: '住房' },
  { id: 208, bookId: 2, chapterNumber: 8, titleEnglish: 'Directions', titleChinese: '方向' },
  { id: 209, bookId: 2, chapterNumber: 9, titleEnglish: 'Appointments', titleChinese: '约会' },
  { id: 210, bookId: 2, chapterNumber: 10, titleEnglish: 'Celebrations', titleChinese: '庆祝' },
  { id: 211, bookId: 2, chapterNumber: 11, titleEnglish: 'Customs', titleChinese: '习俗' },
  { id: 212, bookId: 2, chapterNumber: 12, titleEnglish: 'Environment', titleChinese: '环境' },
  { id: 213, bookId: 2, chapterNumber: 13, titleEnglish: 'Technology', titleChinese: '科技' },
  { id: 214, bookId: 2, chapterNumber: 14, titleEnglish: 'Communication', titleChinese: '交流' },
  { id: 215, bookId: 2, chapterNumber: 15, titleEnglish: 'Review', titleChinese: '复习' },

  // Book 3 - 12 chapters
  { id: 301, bookId: 3, chapterNumber: 1, titleEnglish: 'Education', titleChinese: '教育' },
  { id: 302, bookId: 3, chapterNumber: 2, titleEnglish: 'Career', titleChinese: '职业' },
  { id: 303, bookId: 3, chapterNumber: 3, titleEnglish: 'Society', titleChinese: '社会' },
  { id: 304, bookId: 3, chapterNumber: 4, titleEnglish: 'Economy', titleChinese: '经济' },
  { id: 305, bookId: 3, chapterNumber: 5, titleEnglish: 'Culture', titleChinese: '文化' },
  { id: 306, bookId: 3, chapterNumber: 6, titleEnglish: 'Art', titleChinese: '艺术' },
  { id: 307, bookId: 3, chapterNumber: 7, titleEnglish: 'Literature', titleChinese: '文学' },
  { id: 308, bookId: 3, chapterNumber: 8, titleEnglish: 'History', titleChinese: '历史' },
  { id: 309, bookId: 3, chapterNumber: 9, titleEnglish: 'Philosophy', titleChinese: '哲学' },
  { id: 310, bookId: 3, chapterNumber: 10, titleEnglish: 'Media', titleChinese: '媒体' },
  { id: 311, bookId: 3, chapterNumber: 11, titleEnglish: 'Politics', titleChinese: '政治' },
  { id: 312, bookId: 3, chapterNumber: 12, titleEnglish: 'Review', titleChinese: '复习' },

  // Book 4 - 12 chapters
  { id: 401, bookId: 4, chapterNumber: 1, titleEnglish: 'Global Issues', titleChinese: '国际问题' },
  { id: 402, bookId: 4, chapterNumber: 2, titleEnglish: 'Science', titleChinese: '科学' },
  { id: 403, bookId: 4, chapterNumber: 3, titleEnglish: 'Innovation', titleChinese: '创新' },
  { id: 404, bookId: 4, chapterNumber: 4, titleEnglish: 'Business', titleChinese: '商业' },
  { id: 405, bookId: 4, chapterNumber: 5, titleEnglish: 'Ethics', titleChinese: '伦理' },
  { id: 406, bookId: 4, chapterNumber: 6, titleEnglish: 'Psychology', titleChinese: '心理学' },
  { id: 407, bookId: 4, chapterNumber: 7, titleEnglish: 'Sociology', titleChinese: '社会学' },
  { id: 408, bookId: 4, chapterNumber: 8, titleEnglish: 'Law', titleChinese: '法律' },
  { id: 409, bookId: 4, chapterNumber: 9, titleEnglish: 'Medicine', titleChinese: '医学' },
  { id: 410, bookId: 4, chapterNumber: 10, titleEnglish: 'Research', titleChinese: '研究' },
  { id: 411, bookId: 4, chapterNumber: 11, titleEnglish: 'Future', titleChinese: '未来' },
  { id: 412, bookId: 4, chapterNumber: 12, titleEnglish: 'Review', titleChinese: '复习' },
] as const

/**
 * Get all chapters for a specific book.
 * Returns chapters sorted by chapter number.
 */
export function getChaptersByBook(bookId: number): Chapter[] {
  return CHAPTERS.filter((c) => c.bookId === bookId).sort(
    (a, b) => a.chapterNumber - b.chapterNumber
  )
}

/**
 * Get a single chapter by its ID.
 * Returns undefined if chapter not found.
 */
export function getChapter(chapterId: number): Chapter | undefined {
  return CHAPTERS.find((c) => c.id === chapterId)
}
