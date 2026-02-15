# Story 3.1: Book Selection Screen

Status: ready-for-dev

## Story

As a user,
I want to view available textbooks (Books 1-4),
So that I can choose which book to study from.

## Acceptance Criteria

1. **Given** I am authenticated and on the Books tab
   **When** the screen loads
   **Then** I see Book 1, Book 2, Book 3, and Book 4 displayed as cards
   **And** each book card shows the book title, cover image, and progress summary (e.g., "3/15 chapters")
   **And** screen navigation completes within 500ms (NFR2)

2. **Given** I tap on a book card
   **When** the navigation completes
   **Then** I am taken to the chapter list for that book

3. **Given** I have completed some chapters in a book
   **When** I view the book card
   **Then** I see accurate progress (e.g., "5/15 chapters completed")
   **And** a visual progress bar reflects the completion percentage

4. **Given** I have not started any chapters in a book
   **When** I view the book card
   **Then** I see "0/X chapters" with empty progress bar

## Tasks / Subtasks

- [ ] Task 1: Create BookCard component (AC: #1, #3, #4)
  - [ ] 1.1 Create `components/chapter/BookCard.tsx`
  - [ ] 1.2 Implement book cover with color and number display
  - [ ] 1.3 Add title and progress summary text
  - [ ] 1.4 Add progress bar with Tamagui Progress component
  - [ ] 1.5 Style with playful design per UX spec (12px border radius)

- [ ] Task 2: Create Books screen (AC: #1)
  - [ ] 2.1 Create `app/(tabs)/books.tsx` screen
  - [ ] 2.2 Implement book list layout (scrollable vertical list)
  - [ ] 2.3 Add screen header "Books"
  - [ ] 2.4 Use BookCard components for each book

- [ ] Task 3: Define book data types (AC: #1)
  - [ ] 3.1 Create `types/chapter.ts` with Book and Chapter interfaces
  - [ ] 3.2 Define static book metadata (title, chapter count, cover color)
  - [ ] 3.3 Create `constants/books.ts` with book definitions

- [ ] Task 4: Implement book progress fetching (AC: #3, #4)
  - [ ] 4.1 Create `hooks/useBooks.ts` with TanStack Query
  - [ ] 4.2 Query chapter_progress table grouped by book_id
  - [ ] 4.3 Calculate chapters completed per book
  - [ ] 4.4 Add query key to `lib/queryKeys.ts`

- [ ] Task 5: Implement navigation to chapter list (AC: #2)
  - [ ] 5.1 Add onPress handler to BookCard
  - [ ] 5.2 Navigate to `/chapter/[bookId]` route
  - [ ] 5.3 Verify navigation completes < 500ms

- [ ] Task 6: Test book selection flow
  - [ ] 6.1 Test all books display correctly
  - [ ] 6.2 Test progress displays accurately
  - [ ] 6.3 Test navigation to chapter list works

## Dev Notes

### Architecture Requirements

**File Structure:**
```
dangdai-mobile/
├── app/
│   └── (tabs)/
│       └── books.tsx              # This story - Books tab screen
├── components/
│   └── chapter/
│       └── BookCard.tsx           # Book selection card component
├── hooks/
│   └── useBooks.ts                # Book progress data hook
├── types/
│   └── chapter.ts                 # Book and Chapter types
├── constants/
│   └── books.ts                   # Static book definitions
└── lib/
    └── queryKeys.ts               # Add books query key
```

### Book Data Structure

**Static Book Definitions:**
```typescript
// constants/books.ts
export const BOOKS = [
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
] as const;
```

**Type Definitions:**
```typescript
// types/chapter.ts
export interface Book {
  id: number;
  title: string;
  titleChinese: string;
  chapterCount: number;
  coverColor: string;
}

export interface BookProgress {
  bookId: number;
  chaptersCompleted: number;
  totalChapters: number;
}

export interface Chapter {
  id: number;
  bookId: number;
  chapterNumber: number;
  titleEnglish: string;
  titleChinese: string;
}

export interface ChapterProgress {
  id: string;
  userId: string;
  chapterId: number;
  bookId: number;
  completionPercentage: number;
  masteredAt: string | null;
  updatedAt: string;
}
```

### BookCard Component

**Implementation:**
```typescript
// components/chapter/BookCard.tsx
import { Card, XStack, YStack, Text, Progress } from 'tamagui';
import { ChevronRight } from '@tamagui/lucide-icons';

interface BookCardProps {
  book: Book;
  progress: BookProgress;
  onPress: () => void;
}

export function BookCard({ book, progress, onPress }: BookCardProps) {
  const progressPercent = (progress.chaptersCompleted / progress.totalChapters) * 100;
  
  return (
    <Card
      elevate
      bordered
      padding="$4"
      borderRadius="$4"
      pressStyle={{ scale: 0.98 }}
      onPress={onPress}
      animation="quick"
    >
      <XStack gap="$4" alignItems="center">
        {/* Book Cover */}
        <YStack
          width={60}
          height={80}
          backgroundColor={book.coverColor}
          borderRadius="$2"
          justifyContent="center"
          alignItems="center"
        >
          <Text color="white" fontSize={24} fontWeight="bold">
            {book.id}
          </Text>
        </YStack>
        
        {/* Book Info */}
        <YStack flex={1} gap="$2">
          <Text fontSize={18} fontWeight="600">
            {book.title}
          </Text>
          <Text fontSize={14} color="$gray11">
            {book.titleChinese}
          </Text>
          <XStack alignItems="center" gap="$2">
            <Progress value={progressPercent} flex={1}>
              <Progress.Indicator animation="bouncy" />
            </Progress>
            <Text fontSize={12} color="$gray10">
              {progress.chaptersCompleted}/{progress.totalChapters}
            </Text>
          </XStack>
        </YStack>
        
        <ChevronRight size={24} color="$gray10" />
      </XStack>
    </Card>
  );
}
```

### Books Screen

**Implementation:**
```typescript
// app/(tabs)/books.tsx
import { YStack, Text, ScrollView } from 'tamagui';
import { useRouter } from 'expo-router';
import { BookCard } from '../../components/chapter/BookCard';
import { useBooks } from '../../hooks/useBooks';
import { BOOKS } from '../../constants/books';

export default function BooksScreen() {
  const router = useRouter();
  const { data: progress, isLoading } = useBooks();
  
  const handleBookPress = (bookId: number) => {
    router.push(`/chapter/${bookId}`);
  };
  
  return (
    <YStack flex={1} backgroundColor="$background">
      <YStack padding="$4" paddingTop="$6">
        <Text fontSize={28} fontWeight="bold">Books</Text>
      </YStack>
      
      <ScrollView>
        <YStack padding="$4" gap="$4">
          {BOOKS.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              progress={progress?.[book.id] ?? {
                bookId: book.id,
                chaptersCompleted: 0,
                totalChapters: book.chapterCount,
              }}
              onPress={() => handleBookPress(book.id)}
            />
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
```

### useBooks Hook

**Implementation:**
```typescript
// hooks/useBooks.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { queryKeys } from '../lib/queryKeys';
import { BOOKS } from '../constants/books';

export function useBooks() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.books(user?.id ?? ''),
    queryFn: async () => {
      if (!user) return {};
      
      // Query chapter_progress grouped by book_id
      const { data, error } = await supabase
        .from('chapter_progress')
        .select('book_id, completion_percentage')
        .eq('user_id', user.id)
        .gte('completion_percentage', 80); // Only count mastered chapters
      
      if (error) throw error;
      
      // Group by book and count completed chapters
      const progressByBook: Record<number, number> = {};
      data?.forEach((row) => {
        progressByBook[row.book_id] = (progressByBook[row.book_id] ?? 0) + 1;
      });
      
      // Build progress object for each book
      return BOOKS.reduce((acc, book) => {
        acc[book.id] = {
          bookId: book.id,
          chaptersCompleted: progressByBook[book.id] ?? 0,
          totalChapters: book.chapterCount,
        };
        return acc;
      }, {} as Record<number, BookProgress>);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

### Query Keys

**Add to queryKeys.ts:**
```typescript
// lib/queryKeys.ts
export const queryKeys = {
  // ... existing keys
  books: (userId: string) => ['books', userId] as const,
  chapters: (bookId: number) => ['chapters', bookId] as const,
  chapter: (chapterId: number) => ['chapter', chapterId] as const,
};
```

### Database Schema Reference

**chapter_progress table (from Story 6.1):**
```sql
CREATE TABLE chapter_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  chapter_id INTEGER NOT NULL,
  book_id INTEGER NOT NULL,
  completion_percentage INTEGER DEFAULT 0,
  mastered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);
```

**Note:** If chapter_progress table doesn't exist yet, the query will return empty results and all books show 0/X progress. This is expected behavior for new users.

### Visual Design Requirements

**From UX Spec:**
- Card border radius: 12px
- Minimum touch target: 48x48px
- Progress bar with bouncy animation
- Book cover colors: Use semantic theme colors
- Typography: Body Large (18px) for book title

**Color Tokens:**
- $blue9, $green9, $orange9, $purple9 for book covers
- $gray11 for secondary text
- $gray10 for chevron icon

### Performance Requirements

**NFR2: Screen navigation < 500ms**
- Use `animation="quick"` on Card for snappy press feedback
- Preload chapter list data (optional optimization)

### Naming Conventions (MUST FOLLOW)

- **Components:** PascalCase (`BookCard.tsx`)
- **Hooks:** camelCase with `use` prefix (`useBooks.ts`)
- **Types:** PascalCase interfaces (`Book`, `BookProgress`)
- **Constants:** SCREAMING_SNAKE_CASE for exports (`BOOKS`)
- **Query Keys:** camelCase function names (`queryKeys.books`)

### Anti-Patterns to Avoid

- **DO NOT** hardcode chapter counts in component (use constants)
- **DO NOT** fetch chapter data on book screen (only fetch progress)
- **DO NOT** use inline styles (use Tamagui props)
- **DO NOT** block render while loading (show cards with 0 progress)

### Dependencies

**Required Infrastructure:**
- Supabase client (Story 1.4) - `lib/supabase.ts`
- TanStack Query (Story 1.5) - QueryClientProvider in _layout
- Tab navigation (existing) - `app/(tabs)/_layout.tsx`

**Story Dependencies:**
- Depends on: Story 1.4 (Supabase client)
- Depends on: Story 1.5 (TanStack Query setup)
- Depends on: Story 2.6 (AuthProvider for user context)

**Note:** Story 6.1 (chapter_progress table) may not exist yet. Query should handle empty results gracefully.

### File Checklist

New files to create:
- [ ] `dangdai-mobile/app/(tabs)/books.tsx`
- [ ] `dangdai-mobile/components/chapter/BookCard.tsx`
- [ ] `dangdai-mobile/hooks/useBooks.ts`
- [ ] `dangdai-mobile/types/chapter.ts`
- [ ] `dangdai-mobile/constants/books.ts`

Files to modify:
- [ ] `dangdai-mobile/lib/queryKeys.ts` - Add books query key

### Testing Approach

```bash
# Test 1: Books Display
1. Sign in to app
2. Navigate to Books tab
3. Verify: 4 book cards visible (Book 1-4)
4. Verify: Each card shows title, Chinese title, progress

# Test 2: Progress Display
1. Complete a chapter test (when Epic 4+ implemented)
2. Navigate to Books tab
3. Verify: Progress updates to reflect completion

# Test 3: Navigation
1. Tap on Book 1 card
2. Verify: Navigates to chapter list for Book 1
3. Verify: Navigation completes < 500ms

# Test 4: Empty State
1. New user with no progress
2. Verify: All books show "0/X chapters"
3. Verify: Empty progress bars displayed
```

### References

- [Source: architecture.md#Structure-Patterns] - Component organization
- [Source: architecture.md#Communication-Patterns] - TanStack Query patterns
- [Source: ux-design-specification.md#Component-Strategy] - BookCard component spec
- [Source: ux-design-specification.md#Visual-Design-Foundation] - Color and typography
- [Source: epics.md#Story-3.1] - Story requirements
- [Source: 2-6-auth-state-persistence-and-session-management.md] - AuthProvider usage

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
