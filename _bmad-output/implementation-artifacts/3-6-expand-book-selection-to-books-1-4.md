# Story 3.6: Expand Book Selection to Books 1-4

Status: ready-for-dev

## Story

As a user,
I want the book selection screen to display Books 1-4 (instead of just Books 1-2),
So that I can access all available Dangdai textbook content.

## Acceptance Criteria

1. **Given** I am authenticated and on the Books tab
   **When** the screen loads
   **Then** I see Books 1, 2, 3, and 4 displayed as cards

2. **Given** the book cards are displayed
   **When** I view Books 3 and 4
   **Then** each book card shows the book title, cover image/color, lesson count, and progress summary
   **And** Books 1-2 show "15 lessons" and Books 3-4 show "12 lessons"

3. **Given** Books 3 and 4 are displayed
   **When** I view their visual styling
   **Then** Books 3 and 4 use distinct cover colors (orange, purple) as defined in `constants/books.ts`

4. **Given** I tap on Book 3 or Book 4
   **When** the navigation completes
   **Then** I am taken to the chapter list showing the correct number of chapters (12 for Books 3-4)

## Tasks / Subtasks

- [ ] Task 1: Verify constants/books.ts includes Books 3-4 (AC: #1, #3)
  - [ ] 1.1 Check `constants/books.ts` — Books 3 and 4 should already exist with correct data
  - [ ] 1.2 If missing, add Book 3 (id: 3, 12 lessons, orange color) and Book 4 (id: 4, 12 lessons, purple color)
  - [ ] 1.3 Verify cover colors match UX spec: Book 3 = orange (#F97316), Book 4 = purple (#A855F7)

- [ ] Task 2: Verify constants/chapters.ts includes Books 3-4 chapters (AC: #4)
  - [ ] 2.1 Check `constants/chapters.ts` — chapters for Books 3-4 should already exist
  - [ ] 2.2 If missing, add 12 chapters per book with chapter numbers, English titles, and Chinese titles
  - [ ] 2.3 Verify chapter IDs follow convention: bookId * 100 + chapterNumber (301-312, 401-412)

- [ ] Task 3: Update Book Selection screen if needed (AC: #1, #2)
  - [ ] 3.1 Check `app/(tabs)/books.tsx` — verify it renders ALL books from BOOKS constant (not hardcoded to 2)
  - [ ] 3.2 Verify BookCard component handles variable lesson counts correctly
  - [ ] 3.3 Verify progress summary displays correctly for Books 3-4 (e.g., "0/12 chapters")
  - [ ] 3.4 Ensure scrolling works with 4 book cards

- [ ] Task 4: Update Chapter List screen for 12-chapter books (AC: #4)
  - [ ] 4.1 Verify `app/chapter/[bookId].tsx` loads chapters dynamically (not hardcoded to 15)
  - [ ] 4.2 Verify chapter list displays correctly with 12 items
  - [ ] 4.3 Test navigation from Book 3/4 → chapter list → chapter detail

- [ ] Task 5: Write/update tests (AC: all)
  - [ ] 5.1 Test book selection screen renders 4 book cards
  - [ ] 5.2 Test Books 1-2 show "15 lessons" and Books 3-4 show "12 lessons"
  - [ ] 5.3 Test navigation to chapter list works for all 4 books
  - [ ] 5.4 Test chapter list shows correct number of chapters per book

## Dev Notes

### Architecture Context

The `constants/books.ts` and `constants/chapters.ts` files already contain data for Books 1-4. This story is primarily about ensuring the UI correctly displays all 4 books and handles the different lesson counts (12 vs 15).

### Expected Constants Structure

**constants/books.ts:**
```typescript
export const BOOKS: Book[] = [
  { id: 1, title: 'Book 1', titleChinese: '當代中文課程一', chapterCount: 15, color: '#06B6D4' },
  { id: 2, title: 'Book 2', titleChinese: '當代中文課程二', chapterCount: 15, color: '#22C55E' },
  { id: 3, title: 'Book 3', titleChinese: '當代中文課程三', chapterCount: 12, color: '#F97316' },
  { id: 4, title: 'Book 4', titleChinese: '當代中文課程四', chapterCount: 12, color: '#A855F7' },
];
```

### Chapter ID Convention

Chapter IDs follow `bookId * 100 + chapterNumber`:
- Book 1: 101-115 (15 chapters)
- Book 2: 201-215 (15 chapters)
- Book 3: 301-312 (12 chapters)
- Book 4: 401-412 (12 chapters)

### Existing Code to Check

**Key files to verify:**
1. `dangdai-mobile/constants/books.ts` — Must include 4 books
2. `dangdai-mobile/constants/chapters.ts` — Must include chapters for all 4 books
3. `dangdai-mobile/app/(tabs)/books.tsx` — Must render from BOOKS array (not hardcoded)
4. `dangdai-mobile/components/chapter/BookCard.tsx` — Must handle variable lesson counts
5. `dangdai-mobile/app/chapter/[bookId].tsx` — Must load chapters dynamically

### Visual Design

**Book Card Colors:**
| Book | Color | Hex |
|------|-------|-----|
| Book 1 | Teal | #06B6D4 |
| Book 2 | Green | #22C55E |
| Book 3 | Orange | #F97316 |
| Book 4 | Purple | #A855F7 |

**Card Layout:**
- Books displayed as cards in a scrollable list
- Each card: book cover color strip, title, Chinese title, lesson count, progress bar
- `pressStyle: { scale: 0.98 }` for tap feedback
- Progress: "X/N chapters" where N is 15 or 12

### Implementation Scope

This is a **small story** — the data likely already exists in constants. The main work is:
1. Verifying the UI handles 4 books correctly
2. Verifying lesson count display adapts to 12 vs 15
3. Adding/updating tests
4. Possibly adding Book 3/4 chapter data if missing from constants

### Anti-Patterns to Avoid

- **DO NOT** hardcode book count to 2 or 4 — render from BOOKS constant
- **DO NOT** hardcode lesson count to 15 — use book.chapterCount
- **DO NOT** use hardcoded hex colors in components — use theme tokens or book.color
- **DO NOT** change the chapter ID convention (bookId * 100 + chapterNumber)

### Dependencies

- **Depends on:** Story 3.1 (book selection screen), Story 3.2 (chapter list screen)
- **Blocks:** None (enhancement story)

### References

- [Source: epics.md#Story-3.6] — Story requirements
- [Source: architecture.md#Content-Coverage-Summary] — 54 lessons across 4 books (15+15+12+12)
- [Source: 3-1-book-selection-screen.md] — Book selection implementation
- [Source: 3-2-chapter-list-screen.md] — Chapter list implementation

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
