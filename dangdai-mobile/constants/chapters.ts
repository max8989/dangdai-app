/**
 * Chapter Definitions
 *
 * Static chapter metadata for Dangdai Chinese textbook series (Books 1-4).
 * Chapter counts: Book 1 (15), Book 2 (15), Book 3 (12), Book 4 (12).
 * Titles sourced from the official workbook_config.json (dangdai-rag/).
 *
 * Chapter ID convention: bookId * 100 + chapterNumber
 * Example: Book 1, Chapter 5 = 105
 */

import type { Chapter } from '../types/chapter'

export const CHAPTERS: readonly Chapter[] = [
  // Book 1 - 15 chapters (當代中文課程 第一冊)
  { id: 101, bookId: 1, chapterNumber: 1, titleEnglish: 'Welcome to Taiwan!', titleChinese: '歡迎你來臺灣！' },
  { id: 102, bookId: 1, chapterNumber: 2, titleEnglish: 'My Family', titleChinese: '我的家人' },
  { id: 103, bookId: 1, chapterNumber: 3, titleEnglish: 'What Do You Do on Weekends?', titleChinese: '週末做什麼？' },
  { id: 104, bookId: 1, chapterNumber: 4, titleEnglish: 'How Much Is It in Total?', titleChinese: '請問一共多少錢？' },
  { id: 105, bookId: 1, chapterNumber: 5, titleEnglish: 'Beef Noodles Are Delicious', titleChinese: '牛肉麵真好吃' },
  { id: 106, bookId: 1, chapterNumber: 6, titleEnglish: 'Their School Is on a Mountain', titleChinese: '他們學校在山上' },
  { id: 107, bookId: 1, chapterNumber: 7, titleEnglish: 'Going to KTV at 9 AM', titleChinese: '早上九點去KTV' },
  { id: 108, bookId: 1, chapterNumber: 8, titleEnglish: 'Taking the Train to Tainan', titleChinese: '坐火車去臺南' },
  { id: 109, bookId: 1, chapterNumber: 9, titleEnglish: 'Where to Go on Vacation?', titleChinese: '放假去哪裡玩？' },
  { id: 110, bookId: 1, chapterNumber: 10, titleEnglish: 'Taiwanese Fruit Is Delicious', titleChinese: '臺灣的水果很好吃' },
  { id: 111, bookId: 1, chapterNumber: 11, titleEnglish: 'I Want to Rent an Apartment', titleChinese: '我要租房子' },
  { id: 112, bookId: 1, chapterNumber: 12, titleEnglish: 'How Long Have You Studied Chinese in Taiwan?', titleChinese: '你在臺灣學多久的中文？' },
  { id: 113, bookId: 1, chapterNumber: 13, titleEnglish: 'Happy Birthday', titleChinese: '生日快樂' },
  { id: 114, bookId: 1, chapterNumber: 14, titleEnglish: 'The Weather Is So Cold!', titleChinese: '天氣這麼冷！' },
  { id: 115, bookId: 1, chapterNumber: 15, titleEnglish: "I'm Not Feeling Well", titleChinese: '我很不舒服' },

  // Book 2 - 15 chapters (當代中文課程 第二冊)
  { id: 201, bookId: 2, chapterNumber: 1, titleEnglish: 'How Do I Get to Shida?', titleChinese: '請問，到師大怎麼走？' },
  { id: 202, bookId: 2, chapterNumber: 2, titleEnglish: "Let's Take the MRT!", titleChinese: '還是坐捷運吧！' },
  { id: 203, bookId: 2, chapterNumber: 3, titleEnglish: 'Your Chinese Has Improved', titleChinese: '你的中文進步了' },
  { id: 204, bookId: 2, chapterNumber: 4, titleEnglish: 'I Work Part-Time Teaching French', titleChinese: '我打工，我教法文' },
  { id: 205, bookId: 2, chapterNumber: 5, titleEnglish: 'Attending a Wedding Banquet', titleChinese: '吃喜酒' },
  { id: 206, bookId: 2, chapterNumber: 6, titleEnglish: 'I Plan to Move Near the School', titleChinese: '我打算搬到學校附近' },
  { id: 207, bookId: 2, chapterNumber: 7, titleEnglish: 'The Garbage Truck Is Here!', titleChinese: '垃圾車來了！' },
  { id: 208, bookId: 2, chapterNumber: 8, titleEnglish: 'Learning Kung Fu', titleChinese: '學功夫' },
  { id: 209, bookId: 2, chapterNumber: 9, titleEnglish: 'That City Is Beautiful', titleChinese: '那個城市好漂亮' },
  { id: 210, bookId: 2, chapterNumber: 10, titleEnglish: 'Welcome to My Home to Make Dumplings', titleChinese: '歡迎到我家來包餃子' },
  { id: 211, bookId: 2, chapterNumber: 11, titleEnglish: 'Taiwan Has So Many Fun Places', titleChinese: '台灣好玩的地方真多' },
  { id: 212, bookId: 2, chapterNumber: 12, titleEnglish: 'How to Eat Healthily?', titleChinese: '怎麼吃才健康？' },
  { id: 213, bookId: 2, chapterNumber: 13, titleEnglish: 'I Lost My Phone', titleChinese: '我的手機掉了' },
  { id: 214, bookId: 2, chapterNumber: 14, titleEnglish: "I'm Starting to Look for a Job", titleChinese: '我要開始找工作了' },
  { id: 215, bookId: 2, chapterNumber: 15, titleEnglish: 'Celebrating Chinese New Year', titleChinese: '過春節' },

  // Book 3 - 12 chapters (當代中文課程 第三冊)
  { id: 301, bookId: 3, chapterNumber: 1, titleEnglish: 'School Has Started', titleChinese: '開學了' },
  { id: 302, bookId: 3, chapterNumber: 2, titleEnglish: 'Starting at 20% Off', titleChinese: '打八折起' },
  { id: 303, bookId: 3, chapterNumber: 3, titleEnglish: 'Did You Bring Your Jacket?', titleChinese: '外套帶了沒有？' },
  { id: 304, bookId: 3, chapterNumber: 4, titleEnglish: "I Love Taiwan's Hospitality", titleChinese: '我愛台灣的人情味' },
  { id: 305, bookId: 3, chapterNumber: 5, titleEnglish: "What's Trending Now?", titleChinese: '現在流行什麼？' },
  { id: 306, bookId: 3, chapterNumber: 6, titleEnglish: 'Stay a Night in the Countryside!', titleChinese: '到鄉下住一晚！' },
  { id: 307, bookId: 3, chapterNumber: 7, titleEnglish: 'My Closest Family', titleChinese: '我最親的家人' },
  { id: 308, bookId: 3, chapterNumber: 8, titleEnglish: 'I Want to Be Myself', titleChinese: '我想做自己' },
  { id: 309, bookId: 3, chapterNumber: 9, titleEnglish: 'The Era of Online Shopping', titleChinese: '網購時代' },
  { id: 310, bookId: 3, chapterNumber: 10, titleEnglish: 'I Was Hospitalized', titleChinese: '我住院了' },
  { id: 311, bookId: 3, chapterNumber: 11, titleEnglish: 'Taiwan Stories', titleChinese: '台灣故事' },
  { id: 312, bookId: 3, chapterNumber: 12, titleEnglish: "I'm Going to Vote", titleChinese: '我要去投票' },

  // Book 4 - 12 chapters (當代中文課程 第四冊)
  { id: 401, bookId: 4, chapterNumber: 1, titleEnglish: 'Seventeen or Twenty-Five?', titleChinese: '十七歲還是二十五歲？' },
  { id: 402, bookId: 4, chapterNumber: 2, titleEnglish: 'A Feast for the Eyes and Ears', titleChinese: '眼睛、耳朵的饗宴' },
  { id: 403, bookId: 4, chapterNumber: 3, titleEnglish: 'Cloud Technology', titleChinese: '雲端科技' },
  { id: 404, bookId: 4, chapterNumber: 4, titleEnglish: 'Where Should the Bed Go?', titleChinese: '床該擺哪裡？' },
  { id: 405, bookId: 4, chapterNumber: 5, titleEnglish: 'Having Dreams Is Beautiful', titleChinese: '有夢最美' },
  { id: 406, bookId: 4, chapterNumber: 6, titleEnglish: 'Earthquake', titleChinese: '天搖地動' },
  { id: 407, bookId: 4, chapterNumber: 7, titleEnglish: 'University Student Matters', titleChinese: '大學生的事' },
  { id: 408, bookId: 4, chapterNumber: 8, titleEnglish: 'Their Choices', titleChinese: '他們的選擇' },
  { id: 409, bookId: 4, chapterNumber: 9, titleEnglish: 'More Taiwan Stories', titleChinese: '再談台灣故事' },
  { id: 410, bookId: 4, chapterNumber: 10, titleEnglish: 'Job Application', titleChinese: '應徵' },
  { id: 411, bookId: 4, chapterNumber: 11, titleEnglish: 'A Melting Pot of Cultures and Races', titleChinese: '文化、種族的大熔爐' },
  { id: 412, bookId: 4, chapterNumber: 12, titleEnglish: 'Looking Forward to a Bright Future', titleChinese: '期待美好的未來' },
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
