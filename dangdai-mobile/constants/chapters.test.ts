/**
 * Chapter Constants Tests
 *
 * Tests for chapter data integrity and helper functions.
 * Verifies correct chapter counts per book (15, 15, 12, 12).
 */

import { CHAPTERS, getChaptersByBook, getChapter } from './chapters'

describe('CHAPTERS constant', () => {
  describe('chapter counts', () => {
    it('has exactly 54 total chapters', () => {
      expect(CHAPTERS).toHaveLength(54)
    })

    it('has 15 chapters for Book 1', () => {
      const book1Chapters = CHAPTERS.filter((c) => c.bookId === 1)
      expect(book1Chapters).toHaveLength(15)
    })

    it('has 15 chapters for Book 2', () => {
      const book2Chapters = CHAPTERS.filter((c) => c.bookId === 2)
      expect(book2Chapters).toHaveLength(15)
    })

    it('has 12 chapters for Book 3', () => {
      const book3Chapters = CHAPTERS.filter((c) => c.bookId === 3)
      expect(book3Chapters).toHaveLength(12)
    })

    it('has 12 chapters for Book 4', () => {
      const book4Chapters = CHAPTERS.filter((c) => c.bookId === 4)
      expect(book4Chapters).toHaveLength(12)
    })
  })

  describe('chapter structure', () => {
    it('each chapter has required fields', () => {
      CHAPTERS.forEach((chapter) => {
        expect(chapter).toHaveProperty('id')
        expect(chapter).toHaveProperty('bookId')
        expect(chapter).toHaveProperty('chapterNumber')
        expect(chapter).toHaveProperty('titleEnglish')
        expect(chapter).toHaveProperty('titleChinese')
      })
    })

    it('chapter IDs are unique', () => {
      const ids = CHAPTERS.map((c) => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('chapter IDs follow bookId*100 + chapterNumber pattern', () => {
      CHAPTERS.forEach((chapter) => {
        expect(chapter.id).toBe(chapter.bookId * 100 + chapter.chapterNumber)
      })
    })

    it('chapter numbers are sequential within each book', () => {
      for (let bookId = 1; bookId <= 4; bookId++) {
        const bookChapters = CHAPTERS.filter((c) => c.bookId === bookId).sort(
          (a, b) => a.chapterNumber - b.chapterNumber
        )

        bookChapters.forEach((chapter, index) => {
          expect(chapter.chapterNumber).toBe(index + 1)
        })
      }
    })
  })

  describe('chapter titles', () => {
    it('English titles are non-empty strings', () => {
      CHAPTERS.forEach((chapter) => {
        expect(typeof chapter.titleEnglish).toBe('string')
        expect(chapter.titleEnglish.length).toBeGreaterThan(0)
      })
    })

    it('Chinese titles are non-empty strings', () => {
      CHAPTERS.forEach((chapter) => {
        expect(typeof chapter.titleChinese).toBe('string')
        expect(chapter.titleChinese.length).toBeGreaterThan(0)
      })
    })
  })
})

describe('getChaptersByBook', () => {
  it('returns 15 chapters for Book 1', () => {
    const chapters = getChaptersByBook(1)
    expect(chapters).toHaveLength(15)
    chapters.forEach((chapter) => {
      expect(chapter.bookId).toBe(1)
    })
  })

  it('returns 15 chapters for Book 2', () => {
    const chapters = getChaptersByBook(2)
    expect(chapters).toHaveLength(15)
    chapters.forEach((chapter) => {
      expect(chapter.bookId).toBe(2)
    })
  })

  it('returns 12 chapters for Book 3', () => {
    const chapters = getChaptersByBook(3)
    expect(chapters).toHaveLength(12)
    chapters.forEach((chapter) => {
      expect(chapter.bookId).toBe(3)
    })
  })

  it('returns 12 chapters for Book 4', () => {
    const chapters = getChaptersByBook(4)
    expect(chapters).toHaveLength(12)
    chapters.forEach((chapter) => {
      expect(chapter.bookId).toBe(4)
    })
  })

  it('returns empty array for non-existent book', () => {
    const chapters = getChaptersByBook(999)
    expect(chapters).toHaveLength(0)
  })

  it('returns chapters in chapter number order', () => {
    const chapters = getChaptersByBook(1)
    for (let i = 1; i < chapters.length; i++) {
      expect(chapters[i].chapterNumber).toBeGreaterThan(
        chapters[i - 1].chapterNumber
      )
    }
  })
})

describe('getChapter', () => {
  it('returns chapter by ID', () => {
    const chapter = getChapter(101)
    expect(chapter).toBeDefined()
    expect(chapter?.id).toBe(101)
    expect(chapter?.bookId).toBe(1)
    expect(chapter?.chapterNumber).toBe(1)
  })

  it('returns undefined for non-existent chapter', () => {
    const chapter = getChapter(999)
    expect(chapter).toBeUndefined()
  })

  it('can find first chapter of each book', () => {
    expect(getChapter(101)?.titleEnglish).toBeDefined()
    expect(getChapter(201)?.titleEnglish).toBeDefined()
    expect(getChapter(301)?.titleEnglish).toBeDefined()
    expect(getChapter(401)?.titleEnglish).toBeDefined()
  })

  it('can find last chapter of each book', () => {
    expect(getChapter(115)?.titleEnglish).toBeDefined() // Book 1, chapter 15
    expect(getChapter(215)?.titleEnglish).toBeDefined() // Book 2, chapter 15
    expect(getChapter(312)?.titleEnglish).toBeDefined() // Book 3, chapter 12
    expect(getChapter(412)?.titleEnglish).toBeDefined() // Book 4, chapter 12
  })
})
