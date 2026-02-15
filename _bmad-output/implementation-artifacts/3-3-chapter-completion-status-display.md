# Story 3.3: Chapter Completion Status Display

Status: review

## Story

As a user,
I want to see chapter completion status at a glance,
So that I know my progress and which chapters need more work.

## Acceptance Criteria

1. **Given** I am on the chapter list screen
   **When** I view a chapter that I have not started
   **Then** the chapter shows "0%" or "Not started" indicator
   **And** the chapter badge is gray (neutral state)

2. **Given** I have partially completed a chapter
   **When** I view that chapter in the list
   **Then** the chapter shows the completion percentage (e.g., "45%")
   **And** a progress indicator reflects the percentage

3. **Given** I have mastered a chapter (80%+)
   **When** I view that chapter in the list
   **Then** the chapter shows a checkmark and "Mastered" or "100%" indicator
   **And** the chapter badge shows success state (green)

4. **Given** progress data is loading
   **When** the chapter list is displayed
   **Then** I see a skeleton or default state while loading
   **And** chapters update once progress data is available

## Tasks / Subtasks

- [x] Task 1: Extend ChapterListItem with progress states (AC: #1, #2, #3)
  - [x] 1.1 Add `progress` prop to ChapterListItem
  - [x] 1.2 Implement "Not started" state (gray badge)
  - [x] 1.3 Implement "In progress" state (percentage + progress indicator)
  - [x] 1.4 Implement "Mastered" state (green badge + checkmark)
  - [x] 1.5 Add progress bar or ring indicator

- [x] Task 2: Create useChapterProgress hook (AC: #1, #2, #3, #4)
  - [x] 2.1 Create `hooks/useChapterProgress.ts`
  - [x] 2.2 Query chapter_progress table for user's chapters
  - [x] 2.3 Return progress by chapterId
  - [x] 2.4 Handle loading state
  - [x] 2.5 Add query key to queryKeys.ts

- [x] Task 3: Integrate progress into Chapter List screen (AC: #1, #2, #3)
  - [x] 3.1 Fetch progress data for selected book
  - [x] 3.2 Pass progress to each ChapterListItem
  - [x] 3.3 Handle missing progress (default to 0%)

- [x] Task 4: Create ChapterListSkeleton component (AC: #4)
  - [x] 4.1 Create `components/chapter/ChapterListSkeleton.tsx`
  - [x] 4.2 Show skeleton while progress loading
  - [x] 4.3 Match ChapterListItem layout

- [x] Task 5: Test progress display
  - [x] 5.1 Test not started chapters show 0%
  - [x] 5.2 Test in-progress chapters show correct %
  - [x] 5.3 Test mastered chapters show checkmark
  - [x] 5.4 Test loading state displays correctly

## Dev Notes

### Architecture Requirements

**File Structure:**
```
dangdai-mobile/
├── components/
│   └── chapter/
│       ├── ChapterListItem.tsx       # Enhanced with progress
│       └── ChapterListSkeleton.tsx   # This story
├── hooks/
│   └── useChapterProgress.ts         # This story
└── lib/
    └── queryKeys.ts                  # Add chapterProgress key
```

### Progress State Definitions

**Progress Thresholds:**
```typescript
// Status derived from completion_percentage
const getChapterStatus = (percentage: number): ChapterStatus => {
  if (percentage === 0) return 'not-started';
  if (percentage < 80) return 'in-progress';
  return 'mastered';
};

type ChapterStatus = 'not-started' | 'in-progress' | 'mastered';
```

### Enhanced ChapterListItem Component

**Implementation:**
```typescript
// components/chapter/ChapterListItem.tsx
import { Card, XStack, YStack, Text, Circle, Progress } from 'tamagui';
import { ChevronRight, Check } from '@tamagui/lucide-icons';
import { Chapter, ChapterProgress } from '../../types/chapter';

interface ChapterListItemProps {
  chapter: Chapter;
  progress?: ChapterProgress | null;
  onPress: () => void;
}

export function ChapterListItem({ chapter, progress, onPress }: ChapterListItemProps) {
  const percentage = progress?.completionPercentage ?? 0;
  const status = getChapterStatus(percentage);
  
  const badgeConfig = {
    'not-started': {
      backgroundColor: '$gray4',
      textColor: '$gray12',
      icon: null,
    },
    'in-progress': {
      backgroundColor: '$blue4',
      textColor: '$blue11',
      icon: null,
    },
    'mastered': {
      backgroundColor: '$green4',
      textColor: '$green11',
      icon: <Check size={20} color="$green11" />,
    },
  };
  
  const config = badgeConfig[status];
  
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
        {/* Chapter Number Badge with Status */}
        <Circle
          size={44}
          backgroundColor={config.backgroundColor}
        >
          {config.icon || (
            <Text fontSize={18} fontWeight="600" color={config.textColor}>
              {chapter.chapterNumber}
            </Text>
          )}
        </Circle>
        
        {/* Chapter Info */}
        <YStack flex={1} gap="$1">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize={16} fontWeight="500">
              {chapter.titleEnglish}
            </Text>
            <Text fontSize={12} color={status === 'mastered' ? '$green11' : '$gray10'}>
              {status === 'mastered' ? 'Mastered' : `${percentage}%`}
            </Text>
          </XStack>
          <Text fontSize={14} color="$gray11">
            {chapter.titleChinese}
          </Text>
          
          {/* Progress Bar (only for in-progress) */}
          {status === 'in-progress' && (
            <Progress value={percentage} size="$1" marginTop="$2">
              <Progress.Indicator animation="bouncy" backgroundColor="$blue9" />
            </Progress>
          )}
        </YStack>
        
        <ChevronRight size={20} color="$gray10" />
      </XStack>
    </Card>
  );
}

function getChapterStatus(percentage: number): 'not-started' | 'in-progress' | 'mastered' {
  if (percentage === 0) return 'not-started';
  if (percentage < 80) return 'mastered'; // 80% threshold for mastery
  return 'mastered';
}
```

**Fix for getChapterStatus logic:**
```typescript
function getChapterStatus(percentage: number): 'not-started' | 'in-progress' | 'mastered' {
  if (percentage === 0) return 'not-started';
  if (percentage >= 80) return 'mastered';  // 80%+ = mastered
  return 'in-progress';                      // 1-79% = in progress
}
```

### useChapterProgress Hook

**Implementation:**
```typescript
// hooks/useChapterProgress.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { queryKeys } from '../lib/queryKeys';
import { ChapterProgress } from '../types/chapter';

interface ChapterProgressMap {
  [chapterId: number]: ChapterProgress;
}

export function useChapterProgress(bookId: number) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.chapterProgress(user?.id ?? '', bookId),
    queryFn: async (): Promise<ChapterProgressMap> => {
      if (!user) return {};
      
      const { data, error } = await supabase
        .from('chapter_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', bookId);
      
      if (error) throw error;
      
      // Convert array to map by chapterId
      return (data ?? []).reduce((acc, row) => {
        acc[row.chapter_id] = {
          id: row.id,
          userId: row.user_id,
          chapterId: row.chapter_id,
          bookId: row.book_id,
          completionPercentage: row.completion_percentage,
          masteredAt: row.mastered_at,
          updatedAt: row.updated_at,
        };
        return acc;
      }, {} as ChapterProgressMap);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes - progress changes frequently
  });
}
```

### Query Keys Update

**Add to queryKeys.ts:**
```typescript
// lib/queryKeys.ts
export const queryKeys = {
  // ... existing keys
  books: (userId: string) => ['books', userId] as const,
  chapters: (bookId: number) => ['chapters', bookId] as const,
  chapterProgress: (userId: string, bookId: number) => 
    ['chapterProgress', userId, bookId] as const,
};
```

### Updated Chapter List Screen

**Integration:**
```typescript
// app/chapter/[bookId].tsx
import { YStack, Text, ScrollView, XStack, Button } from 'tamagui';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { ChapterListItem } from '../../components/chapter/ChapterListItem';
import { ChapterListSkeleton } from '../../components/chapter/ChapterListSkeleton';
import { getChaptersByBook } from '../../constants/chapters';
import { BOOKS } from '../../constants/books';
import { useChapterProgress } from '../../hooks/useChapterProgress';

export default function ChapterListScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const router = useRouter();
  
  const bookIdNum = parseInt(bookId ?? '1', 10);
  const book = BOOKS.find(b => b.id === bookIdNum);
  const chapters = getChaptersByBook(bookIdNum);
  
  const { data: progressMap, isLoading } = useChapterProgress(bookIdNum);
  
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
            {isLoading ? (
              <ChapterListSkeleton count={chapters.length} />
            ) : (
              chapters.map((chapter) => (
                <ChapterListItem
                  key={chapter.id}
                  chapter={chapter}
                  progress={progressMap?.[chapter.id] ?? null}
                  onPress={() => handleChapterPress(chapter.id)}
                />
              ))
            )}
          </YStack>
        </ScrollView>
      </YStack>
    </>
  );
}
```

### ChapterListSkeleton Component

**Implementation:**
```typescript
// components/chapter/ChapterListSkeleton.tsx
import { Card, XStack, YStack, Circle } from 'tamagui';

interface ChapterListSkeletonProps {
  count?: number;
}

export function ChapterListSkeleton({ count = 5 }: ChapterListSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          bordered
          padding="$3"
          borderRadius="$3"
          opacity={0.5}
        >
          <XStack gap="$3" alignItems="center">
            {/* Badge Skeleton */}
            <Circle
              size={44}
              backgroundColor="$gray4"
            />
            
            {/* Content Skeleton */}
            <YStack flex={1} gap="$2">
              <YStack
                height={16}
                width="60%"
                backgroundColor="$gray4"
                borderRadius="$2"
              />
              <YStack
                height={14}
                width="40%"
                backgroundColor="$gray4"
                borderRadius="$2"
              />
            </YStack>
          </XStack>
        </Card>
      ))}
    </>
  );
}
```

### Database Schema Reference

**chapter_progress table (from Epic 6):**
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

-- RLS Policy
ALTER TABLE chapter_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON chapter_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON chapter_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON chapter_progress
  FOR UPDATE USING (auth.uid() = user_id);
```

**Note:** If chapter_progress table doesn't exist yet, the query returns empty results and all chapters show "Not started". This is expected for MVP until Epic 6 is implemented.

### Visual Design Requirements

**Progress States Visual:**

| State | Badge | Progress Text | Visual Indicator |
|-------|-------|---------------|------------------|
| Not Started | Gray circle with number | "0%" | No progress bar |
| In Progress | Blue circle with number | "45%" | Blue progress bar |
| Mastered | Green circle with checkmark | "Mastered" | No bar (implied 100%) |

**Color Tokens:**
- Not started: `$gray4` badge, `$gray12` number
- In progress: `$blue4` badge, `$blue11` text, `$blue9` progress bar
- Mastered: `$green4` badge, `$green11` checkmark and text

### Edge Cases

1. **No progress data exists**: All chapters show "Not started" (0%)
2. **User not authenticated**: Hook returns empty object, all chapters 0%
3. **Partial data**: Missing chapters default to 0%
4. **Network error**: Show cached data or retry indicator

### Performance Considerations

- Use `staleTime: 2 minutes` - Progress may update frequently
- Query by bookId to limit data fetched
- Map structure enables O(1) lookup per chapter

### Naming Conventions (MUST FOLLOW)

- **Components:** PascalCase (`ChapterListItem.tsx`, `ChapterListSkeleton.tsx`)
- **Hooks:** camelCase with `use` prefix (`useChapterProgress.ts`)
- **Query Keys:** camelCase function (`queryKeys.chapterProgress`)
- **Types:** PascalCase (`ChapterProgress`, `ChapterProgressMap`)

### Anti-Patterns to Avoid

- **DO NOT** fetch progress on every render (use TanStack Query caching)
- **DO NOT** show error state for missing progress (default to 0%)
- **DO NOT** use different skeleton for each state (one consistent skeleton)
- **DO NOT** animate skeleton aggressively (subtle or static is fine)

### Dependencies

**Required Infrastructure:**
- Supabase client with chapter_progress table access
- TanStack Query v5 (Story 1.5)
- AuthProvider for user context (Story 2.6)

**Story Dependencies:**
- Depends on: Story 3.2 (ChapterListItem base component)
- Depends on: Story 2.6 (useAuth for user ID)
- Soft dependency: Story 6.1 (chapter_progress table) - graceful degradation if missing

### File Checklist

New files to create:
- [ ] `dangdai-mobile/hooks/useChapterProgress.ts`
- [ ] `dangdai-mobile/components/chapter/ChapterListSkeleton.tsx`

Files to modify:
- [ ] `dangdai-mobile/components/chapter/ChapterListItem.tsx` - Add progress states
- [ ] `dangdai-mobile/app/chapter/[bookId].tsx` - Integrate progress fetching
- [ ] `dangdai-mobile/lib/queryKeys.ts` - Add chapterProgress key
- [ ] `dangdai-mobile/types/chapter.ts` - Ensure ChapterProgress interface

### Testing Approach

```bash
# Test 1: Not Started State
1. Navigate to chapter list for a book
2. View chapter with no quiz attempts
3. Verify: Shows "0%" and gray badge

# Test 2: In Progress State
1. Complete a quiz with <80% score (when Epic 4 implemented)
2. Navigate to chapter list
3. Verify: Shows percentage and blue progress bar

# Test 3: Mastered State
1. Complete chapter test with 80%+ score
2. Navigate to chapter list
3. Verify: Shows checkmark and "Mastered" in green

# Test 4: Loading State
1. Clear cache or refresh
2. Navigate to chapter list
3. Verify: Skeleton appears briefly
4. Verify: Skeleton replaced with actual data

# Test 5: New User (No Progress)
1. Sign in as new user with no progress
2. Navigate to any chapter list
3. Verify: All chapters show "0%" / "Not started"
```

### References

- [Source: architecture.md#Communication-Patterns] - TanStack Query patterns
- [Source: ux-design-specification.md#Component-Strategy] - ChapterListItem states
- [Source: ux-design-specification.md#UX-Consistency-Patterns] - Loading/empty states
- [Source: epics.md#Story-3.3] - Story requirements
- [Source: 3-2-chapter-list-screen.md] - ChapterListItem base implementation

## Dev Agent Record

### Agent Model Used

claude-opus-4-5

### Debug Log References

None - implementation proceeded smoothly with no blocking issues.

### Completion Notes List

- Implemented chapter completion status display with three progress states: not-started (0%), in-progress (1-79%), and mastered (80%+)
- ChapterListItem enhanced with progress prop, dynamic badge colors (gray/blue/green), checkmark icon for mastered state, and progress bar for in-progress state
- Created useChapterProgress hook using TanStack Query to fetch chapter_progress from Supabase, mapped by chapterId for O(1) lookup
- Added ChapterListSkeleton component for loading state that matches ChapterListItem layout
- Integrated progress fetching into Chapter List screen with skeleton loading state
- Updated queryKeys.ts with chapterProgress key pattern: ['chapterProgress', userId, bookId]
- Hook gracefully handles missing chapter_progress table (Epic 6 dependency) by returning empty object
- All 84 unit tests pass with no regressions
- TypeScript compiles with no errors

### Change Log

- 2026-02-15: Implemented Story 3.3 - Chapter Completion Status Display (all acceptance criteria satisfied)

### File List

**New Files:**
- dangdai-mobile/hooks/useChapterProgress.ts
- dangdai-mobile/hooks/useChapterProgress.test.ts
- dangdai-mobile/components/chapter/ChapterListSkeleton.tsx
- dangdai-mobile/components/chapter/ChapterListSkeleton.test.tsx

**Modified Files:**
- dangdai-mobile/components/chapter/ChapterListItem.tsx (added progress prop and states)
- dangdai-mobile/components/chapter/ChapterListItem.test.tsx (added progress state tests)
- dangdai-mobile/app/chapter/[bookId].tsx (integrated progress hook and skeleton)
- dangdai-mobile/lib/queryKeys.ts (updated chapterProgress key)
