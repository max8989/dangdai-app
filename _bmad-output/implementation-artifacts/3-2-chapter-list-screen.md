# Story 3.2: Chapter List Screen

Status: ready-for-dev

## Story

As a user,
I want to view all chapters within a selected book,
So that I can see what content is available and choose what to study.

## Acceptance Criteria

1. **Given** I have selected a book
   **When** the chapter list screen loads
   **Then** I see all chapters for that book displayed in a scrollable list
   **And** each chapter shows: chapter number, chapter title (English), chapter title (Chinese)
   **And** a back button returns me to the book selection screen

2. **Given** I am viewing Book 1
   **When** the chapter list loads
   **Then** I see 15 chapters listed

3. **Given** I am viewing Book 2
   **When** the chapter list loads
   **Then** I see 15 chapters listed

4. **Given** I am viewing Book 3
   **When** the chapter list loads
   **Then** I see 12 chapters listed

5. **Given** I am viewing Book 4
   **When** the chapter list loads
   **Then** I see 12 chapters listed

6. **Given** I tap on a chapter
   **When** I select the chapter
   **Then** I can start a quiz for that chapter (navigation to quiz screen)

## Tasks / Subtasks

- [ ] Task 1: Create ChapterListItem component (AC: #1)
  - [ ] 1.1 Create `components/chapter/ChapterListItem.tsx`
  - [ ] 1.2 Display chapter number badge
  - [ ] 1.3 Display English title
  - [ ] 1.4 Display Chinese title
  - [ ] 1.5 Add press handler for navigation

- [ ] Task 2: Create Chapter List screen (AC: #1, #2, #3, #4, #5)
  - [ ] 2.1 Create `app/chapter/[bookId].tsx` dynamic route
  - [ ] 2.2 Parse bookId from route params
  - [ ] 2.3 Display screen header with book title
  - [ ] 2.4 Implement back navigation
  - [ ] 2.5 Render scrollable chapter list

- [ ] Task 3: Define chapter data (AC: #2, #3, #4, #5)
  - [ ] 3.1 Create `constants/chapters.ts` with all chapter definitions
  - [ ] 3.2 Include chapter titles in English and Chinese
  - [ ] 3.3 Organize by book (15, 15, 12, 12 chapters)

- [ ] Task 4: Create useChapters hook (AC: #1)
  - [ ] 4.1 Create `hooks/useChapters.ts`
  - [ ] 4.2 Filter chapters by bookId
  - [ ] 4.3 Add to queryKeys

- [ ] Task 5: Implement chapter selection (AC: #6)
  - [ ] 5.1 Add onPress handler to ChapterListItem
  - [ ] 5.2 Navigate to `/quiz/[chapterId]` route
  - [ ] 5.3 Pass chapter context to quiz screen

- [ ] Task 6: Test chapter list flow
  - [ ] 6.1 Test Book 1 shows 15 chapters
  - [ ] 6.2 Test Book 2 shows 15 chapters
  - [ ] 6.3 Test Book 3 shows 12 chapters
  - [ ] 6.4 Test Book 4 shows 12 chapters
  - [ ] 6.5 Test back navigation works
  - [ ] 6.6 Test chapter selection navigates to quiz

## Dev Notes

### Architecture Requirements

**File Structure:**
```
dangdai-mobile/
├── app/
│   └── chapter/
│       └── [bookId].tsx           # This story - Chapter list screen
├── components/
│   └── chapter/
│       ├── BookCard.tsx           # From Story 3.1
│       └── ChapterListItem.tsx    # This story
├── hooks/
│   └── useChapters.ts             # This story
├── constants/
│   ├── books.ts                   # From Story 3.1
│   └── chapters.ts                # This story - Chapter definitions
└── types/
    └── chapter.ts                 # Extended types
```

### Chapter Data Structure

**Chapter Definitions:**
```typescript
// constants/chapters.ts
import { Chapter } from '../types/chapter';

export const CHAPTERS: Chapter[] = [
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
];

export function getChaptersByBook(bookId: number): Chapter[] {
  return CHAPTERS.filter(c => c.bookId === bookId);
}

export function getChapter(chapterId: number): Chapter | undefined {
  return CHAPTERS.find(c => c.id === chapterId);
}
```

**Note:** These are placeholder titles. Replace with actual Dangdai textbook chapter titles when available.

### Type Definitions

**Extended types/chapter.ts:**
```typescript
// types/chapter.ts
export interface Book {
  id: number;
  title: string;
  titleChinese: string;
  chapterCount: number;
  coverColor: string;
}

export interface Chapter {
  id: number;           // Unique ID (e.g., 101 for Book 1 Chapter 1)
  bookId: number;
  chapterNumber: number;
  titleEnglish: string;
  titleChinese: string;
}

export interface BookProgress {
  bookId: number;
  chaptersCompleted: number;
  totalChapters: number;
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

### ChapterListItem Component

**Implementation:**
```typescript
// components/chapter/ChapterListItem.tsx
import { Card, XStack, YStack, Text, Circle } from 'tamagui';
import { ChevronRight } from '@tamagui/lucide-icons';
import { Chapter } from '../../types/chapter';

interface ChapterListItemProps {
  chapter: Chapter;
  onPress: () => void;
}

export function ChapterListItem({ chapter, onPress }: ChapterListItemProps) {
  return (
    <Card
      elevate
      bordered
      padding="$3"
      borderRadius="$3"
      pressStyle={{ scale: 0.98 }}
      onPress={onPress}
      animation="quick"
    >
      <XStack gap="$3" alignItems="center">
        {/* Chapter Number Badge */}
        <Circle
          size={44}
          backgroundColor="$gray4"
        >
          <Text fontSize={18} fontWeight="600" color="$gray12">
            {chapter.chapterNumber}
          </Text>
        </Circle>
        
        {/* Chapter Info */}
        <YStack flex={1} gap="$1">
          <Text fontSize={16} fontWeight="500">
            {chapter.titleEnglish}
          </Text>
          <Text fontSize={14} color="$gray11">
            {chapter.titleChinese}
          </Text>
        </YStack>
        
        <ChevronRight size={20} color="$gray10" />
      </XStack>
    </Card>
  );
}
```

### Chapter List Screen

**Implementation:**
```typescript
// app/chapter/[bookId].tsx
import { YStack, Text, ScrollView, XStack, Button } from 'tamagui';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { ChapterListItem } from '../../components/chapter/ChapterListItem';
import { getChaptersByBook } from '../../constants/chapters';
import { BOOKS } from '../../constants/books';

export default function ChapterListScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const router = useRouter();
  
  const bookIdNum = parseInt(bookId ?? '1', 10);
  const book = BOOKS.find(b => b.id === bookIdNum);
  const chapters = getChaptersByBook(bookIdNum);
  
  const handleChapterPress = (chapterId: number) => {
    router.push(`/quiz/${chapterId}`);
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: book?.title ?? 'Chapters',
          headerLeft: () => (
            <Button
              chromeless
              icon={<ChevronLeft size={24} />}
              onPress={() => router.back()}
            />
          ),
        }}
      />
      
      <YStack flex={1} backgroundColor="$background">
        {/* Book Header */}
        <YStack padding="$4" backgroundColor="$background">
          <Text fontSize={14} color="$gray11">
            {book?.titleChinese}
          </Text>
          <Text fontSize={16} color="$gray11" marginTop="$2">
            {chapters.length} chapters
          </Text>
        </YStack>
        
        {/* Chapter List */}
        <ScrollView>
          <YStack padding="$4" gap="$3">
            {chapters.map((chapter) => (
              <ChapterListItem
                key={chapter.id}
                chapter={chapter}
                onPress={() => handleChapterPress(chapter.id)}
              />
            ))}
          </YStack>
        </ScrollView>
      </YStack>
    </>
  );
}
```

### useChapters Hook

**Implementation:**
```typescript
// hooks/useChapters.ts
import { useMemo } from 'react';
import { getChaptersByBook, getChapter } from '../constants/chapters';
import { Chapter } from '../types/chapter';

export function useChapters(bookId: number): Chapter[] {
  return useMemo(() => getChaptersByBook(bookId), [bookId]);
}

export function useChapter(chapterId: number): Chapter | undefined {
  return useMemo(() => getChapter(chapterId), [chapterId]);
}
```

**Note:** Since chapters are static data, no TanStack Query needed. Simple memoized lookup is sufficient.

### Visual Design Requirements

**From UX Spec:**
- ChapterListItem border radius: 12px (use $3)
- Chapter number badge: 44px circle, gray background
- Minimum touch target: 48px (badge provides this)
- Typography: Body (16px) for English title, Caption (14px) for Chinese

**Color Tokens:**
- $gray4 for number badge background
- $gray11 for Chinese title
- $gray12 for chapter number
- $gray10 for chevron icon

### Navigation Flow

```
Books Tab → BookCard press → /chapter/[bookId] → ChapterListItem press → /quiz/[chapterId]
                                     ↑
                                Back button returns here
```

### Screen Header Pattern

Use Expo Router's Stack.Screen to configure header:
```typescript
<Stack.Screen
  options={{
    headerShown: true,
    headerTitle: book?.title ?? 'Chapters',
    headerLeft: () => <BackButton />,
  }}
/>
```

### Naming Conventions (MUST FOLLOW)

- **Components:** PascalCase (`ChapterListItem.tsx`)
- **Screens:** lowercase with brackets for dynamic (`[bookId].tsx`)
- **Hooks:** camelCase with `use` prefix (`useChapters.ts`)
- **Constants:** PascalCase exports (`CHAPTERS`)
- **Helper Functions:** camelCase (`getChaptersByBook`)

### Anti-Patterns to Avoid

- **DO NOT** fetch chapters from API (use static constants)
- **DO NOT** hardcode chapter counts (use CHAPTERS array length)
- **DO NOT** show loading skeleton for static data
- **DO NOT** use inline onPress handlers with complex logic

### Dependencies

**Required Infrastructure:**
- Expo Router dynamic routes
- Tamagui components (Card, Text, XStack, YStack)
- Story 3.1 (books.ts constants, chapter.ts types)

**Story Dependencies:**
- Depends on: Story 3.1 (types and constants structure)
- Depends on: Story 1.4 (basic app setup)

### File Checklist

New files to create:
- [ ] `dangdai-mobile/app/chapter/[bookId].tsx`
- [ ] `dangdai-mobile/components/chapter/ChapterListItem.tsx`
- [ ] `dangdai-mobile/hooks/useChapters.ts`
- [ ] `dangdai-mobile/constants/chapters.ts`

Files to modify:
- [ ] `dangdai-mobile/types/chapter.ts` - Ensure Chapter interface exists

### Testing Approach

```bash
# Test 1: Chapter Count per Book
1. Navigate to Books tab
2. Tap Book 1 → Verify 15 chapters listed
3. Go back, tap Book 2 → Verify 15 chapters listed
4. Go back, tap Book 3 → Verify 12 chapters listed
5. Go back, tap Book 4 → Verify 12 chapters listed

# Test 2: Chapter Display
1. Navigate to Book 1 chapter list
2. Verify: Each chapter shows number, English title, Chinese title
3. Verify: Chapters are in order (1-15)

# Test 3: Back Navigation
1. Navigate to Book 1 chapter list
2. Tap back button
3. Verify: Returns to Books tab

# Test 4: Chapter Selection
1. Navigate to Book 1 chapter list
2. Tap Chapter 5
3. Verify: Navigates to quiz screen for Chapter 5
```

### References

- [Source: architecture.md#Structure-Patterns] - App folder structure
- [Source: ux-design-specification.md#Component-Strategy] - ChapterListItem spec
- [Source: ux-design-specification.md#User-Journey-Flows] - Chapter navigation flow
- [Source: epics.md#Story-3.2] - Story requirements
- [Source: 3-1-book-selection-screen.md] - Related book types

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
