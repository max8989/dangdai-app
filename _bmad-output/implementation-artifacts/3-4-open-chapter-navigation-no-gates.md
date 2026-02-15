# Story 3.4: Open Chapter Navigation (No Gates)

Status: ready-for-dev

## Story

As a user,
I want to select any chapter freely without restrictions,
So that I can study the content that matches my current learning needs.

## Acceptance Criteria

1. **Given** I am on the chapter list screen
   **When** I tap on any chapter (regardless of completion status of other chapters)
   **Then** I can start a quiz for that chapter
   **And** no "unlock" or "complete previous chapters first" message is shown

2. **Given** I have never used the app before
   **When** I navigate to Book 2, Chapter 10
   **Then** I can immediately start a quiz for that chapter

3. **Given** I tap on a chapter
   **When** the chapter screen loads
   **Then** I see options to start vocabulary or grammar quiz
   **And** I can choose which quiz type to take

4. **Given** I have partially completed a chapter (any progress)
   **When** I tap on that chapter
   **Then** I can retake quizzes to improve my score
   **And** my previous progress is preserved

5. **Given** I have mastered a chapter (80%+)
   **When** I tap on that chapter
   **Then** I can still take quizzes for practice
   **And** "Mastered" status remains visible

## Tasks / Subtasks

- [ ] Task 1: Create Chapter Detail screen (AC: #1, #3)
  - [ ] 1.1 Create `app/quiz/[chapterId].tsx` (or chapter detail route)
  - [ ] 1.2 Display chapter title and info
  - [ ] 1.3 Add "Start Vocabulary Quiz" button
  - [ ] 1.4 Add "Start Grammar Quiz" button
  - [ ] 1.5 Show current progress if any

- [ ] Task 2: Ensure no gating logic (AC: #1, #2)
  - [ ] 2.1 Verify ChapterListItem has no lock/unlock logic
  - [ ] 2.2 Verify navigation accepts any chapterId
  - [ ] 2.3 Remove any conditional rendering based on prerequisites

- [ ] Task 3: Support retaking quizzes (AC: #4)
  - [ ] 3.1 Display current progress on chapter screen
  - [ ] 3.2 Allow starting new quiz regardless of existing progress
  - [ ] 3.3 Show "Retake" or "Practice" label if mastered

- [ ] Task 4: Preserve mastered status (AC: #5)
  - [ ] 4.1 Show "Mastered" badge on chapter screen when 80%+
  - [ ] 4.2 Don't reduce mastery status on lower scores
  - [ ] 4.3 Allow continued practice with no penalty

- [ ] Task 5: Test open navigation
  - [ ] 5.1 Test new user can access any chapter
  - [ ] 5.2 Test no unlock messages appear
  - [ ] 5.3 Test retaking mastered chapters works
  - [ ] 5.4 Test quiz type selection works

## Dev Notes

### Architecture Requirements

**File Structure:**
```
dangdai-mobile/
├── app/
│   ├── chapter/
│   │   └── [bookId].tsx           # Chapter list (Story 3.2)
│   └── quiz/
│       └── [chapterId].tsx        # This story - Chapter detail/quiz start
└── components/
    └── chapter/
        └── ChapterDetailCard.tsx  # Optional: Quiz type selection
```

### Open Navigation Philosophy

**Design Principle:** No gates, no locks, no prerequisites.

The NTNU Dangdai curriculum is familiar to users - they can jump to any chapter based on their current study needs. This aligns with the UX principle of "flexible learning" and respects user autonomy.

**What NOT to implement:**
- Lock icons on chapters
- "Complete Chapter X first" messages
- Sequential unlock requirements
- Progress-based access control

### Chapter Detail Screen

**Implementation:**
```typescript
// app/quiz/[chapterId].tsx
import { YStack, Text, XStack, Button, Card, H2 } from 'tamagui';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft, BookOpen, MessageSquare, Trophy } from '@tamagui/lucide-icons';
import { getChapter } from '../../constants/chapters';
import { BOOKS } from '../../constants/books';
import { useChapterProgress } from '../../hooks/useChapterProgress';
import { useAuth } from '../../providers/AuthProvider';

export default function ChapterDetailScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const chapterIdNum = parseInt(chapterId ?? '0', 10);
  const chapter = getChapter(chapterIdNum);
  const book = chapter ? BOOKS.find(b => b.id === chapter.bookId) : null;
  
  // Get progress for this specific chapter
  const { data: progressMap } = useChapterProgress(chapter?.bookId ?? 0);
  const progress = progressMap?.[chapterIdNum];
  const percentage = progress?.completionPercentage ?? 0;
  const isMastered = percentage >= 80;
  
  if (!chapter) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Text>Chapter not found</Text>
      </YStack>
    );
  }
  
  const handleStartQuiz = (quizType: 'vocabulary' | 'grammar') => {
    // Navigate to quiz loading screen with type
    // Note: Actual quiz generation is Epic 4
    router.push({
      pathname: '/quiz/loading',
      params: {
        chapterId: chapterIdNum.toString(),
        bookId: chapter.bookId.toString(),
        quizType,
      },
    });
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: `Chapter ${chapter.chapterNumber}`,
          headerLeft: () => (
            <Button
              chromeless
              icon={<ChevronLeft size={24} />}
              onPress={() => router.back()}
            />
          ),
        }}
      />
      
      <YStack flex={1} backgroundColor="$background" padding="$4">
        {/* Chapter Info */}
        <YStack gap="$2" marginBottom="$6">
          <Text fontSize={12} color="$gray10">
            {book?.title} - {book?.titleChinese}
          </Text>
          <H2 fontSize={28} fontWeight="bold">
            {chapter.titleEnglish}
          </H2>
          <Text fontSize={20} color="$gray11">
            {chapter.titleChinese}
          </Text>
        </YStack>
        
        {/* Progress Card (if any progress exists) */}
        {percentage > 0 && (
          <Card bordered padding="$4" marginBottom="$4" borderRadius="$4">
            <XStack alignItems="center" gap="$3">
              {isMastered ? (
                <>
                  <Trophy size={24} color="$green11" />
                  <YStack flex={1}>
                    <Text fontWeight="600" color="$green11">Mastered</Text>
                    <Text fontSize={14} color="$gray11">
                      You've achieved 80%+ on this chapter
                    </Text>
                  </YStack>
                </>
              ) : (
                <>
                  <YStack flex={1}>
                    <Text fontWeight="500">Current Progress</Text>
                    <Text fontSize={14} color="$gray11">
                      {percentage}% complete
                    </Text>
                  </YStack>
                </>
              )}
            </XStack>
          </Card>
        )}
        
        {/* Quiz Type Selection */}
        <YStack gap="$4">
          <Text fontSize={16} fontWeight="500" marginBottom="$2">
            {isMastered ? 'Practice Again' : 'Start Learning'}
          </Text>
          
          {/* Vocabulary Quiz Button */}
          <Card
            elevate
            bordered
            padding="$4"
            borderRadius="$4"
            pressStyle={{ scale: 0.98 }}
            onPress={() => handleStartQuiz('vocabulary')}
            animation="quick"
          >
            <XStack alignItems="center" gap="$3">
              <YStack
                width={48}
                height={48}
                backgroundColor="$blue4"
                borderRadius="$3"
                justifyContent="center"
                alignItems="center"
              >
                <BookOpen size={24} color="$blue11" />
              </YStack>
              <YStack flex={1}>
                <Text fontSize={18} fontWeight="600">
                  Vocabulary Quiz
                </Text>
                <Text fontSize={14} color="$gray11">
                  Practice characters, pinyin, and meanings
                </Text>
              </YStack>
            </XStack>
          </Card>
          
          {/* Grammar Quiz Button */}
          <Card
            elevate
            bordered
            padding="$4"
            borderRadius="$4"
            pressStyle={{ scale: 0.98 }}
            onPress={() => handleStartQuiz('grammar')}
            animation="quick"
          >
            <XStack alignItems="center" gap="$3">
              <YStack
                width={48}
                height={48}
                backgroundColor="$purple4"
                borderRadius="$3"
                justifyContent="center"
                alignItems="center"
              >
                <MessageSquare size={24} color="$purple11" />
              </YStack>
              <YStack flex={1}>
                <Text fontSize={18} fontWeight="600">
                  Grammar Quiz
                </Text>
                <Text fontSize={14} color="$gray11">
                  Practice sentence patterns and structure
                </Text>
              </YStack>
            </XStack>
          </Card>
        </YStack>
        
        {/* Helper Text for New Users */}
        {percentage === 0 && (
          <Text fontSize={12} color="$gray10" marginTop="$6" textAlign="center">
            Start with vocabulary to learn new words, or try grammar for sentence practice
          </Text>
        )}
      </YStack>
    </>
  );
}
```

### Navigation Flow

```
Books Tab
    ↓ tap book
Chapter List (/chapter/[bookId])
    ↓ tap any chapter (NO GATES)
Chapter Detail (/quiz/[chapterId])
    ↓ tap quiz type
Quiz Loading → Quiz Screen (Epic 4)
```

### No Gating Implementation

**ChapterListItem Requirements (from Story 3.2/3.3):**
```typescript
// components/chapter/ChapterListItem.tsx
// IMPORTANT: No gating logic whatsoever

interface ChapterListItemProps {
  chapter: Chapter;
  progress?: ChapterProgress | null;
  onPress: () => void;  // Always callable, no conditions
}

export function ChapterListItem({ chapter, progress, onPress }: ChapterListItemProps) {
  // NO: if (!unlocked) return <LockedChapter />
  // NO: const canAccess = checkPrerequisites(chapter)
  // NO: onPress={canAccess ? onPress : undefined}
  
  return (
    <Card
      onPress={onPress}  // Always enabled
      // ... rest of component
    />
  );
}
```

### Retaking Quizzes Logic

**Progress Preservation Rules:**
1. Taking a new quiz creates a new `quiz_attempts` record
2. `chapter_progress.completion_percentage` is the BEST score, not average
3. Mastered status (80%+) is never downgraded
4. Users can practice infinitely with no penalty

**Database Behavior (Epic 6):**
```sql
-- When user completes a quiz, update only if new score is higher
UPDATE chapter_progress
SET completion_percentage = GREATEST(completion_percentage, NEW_SCORE),
    mastered_at = CASE 
      WHEN NEW_SCORE >= 80 AND mastered_at IS NULL THEN now()
      ELSE mastered_at
    END,
    updated_at = now()
WHERE user_id = $user_id AND chapter_id = $chapter_id;
```

### Quiz Type Options

**Vocabulary Quiz:**
- Tests: Character ↔ Pinyin ↔ Meaning
- Question types: "What does this mean?", "What is the pinyin?", "Which character?"
- From Epic 4, Story 4.3

**Grammar Quiz:**
- Tests: Sentence completion, pattern recognition
- Question types: Fill in blank, correct sentence order
- From Epic 4, Story 4.7

**Note:** Actual quiz implementation is in Epic 4. This story creates the navigation and type selection UI.

### Quiz Loading Placeholder

**Temporary Route (until Epic 4):**
```typescript
// app/quiz/loading.tsx (placeholder)
import { YStack, Text, Spinner } from 'tamagui';
import { useLocalSearchParams } from 'expo-router';

export default function QuizLoadingScreen() {
  const { chapterId, bookId, quizType } = useLocalSearchParams();
  
  return (
    <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
      <Spinner size="large" color="$primary" />
      <Text>Preparing {quizType} quiz...</Text>
      <Text fontSize={12} color="$gray10">
        Chapter {chapterId} (Book {bookId})
      </Text>
      <Text fontSize={12} color="$gray10" marginTop="$4">
        Quiz generation will be implemented in Epic 4
      </Text>
    </YStack>
  );
}
```

### Visual Design Requirements

**From UX Spec:**
- Quiz type cards: 12px border radius, elevate shadow
- Icon containers: 48x48px with semantic background colors
- Typography: H2 for chapter title, Body Large for quiz titles
- Touch targets: Entire card is tappable (min 48px height)

**Color Tokens:**
- Vocabulary: `$blue4` background, `$blue11` icon
- Grammar: `$purple4` background, `$purple11` icon
- Mastered badge: `$green11` for Trophy icon and text

### Naming Conventions (MUST FOLLOW)

- **Screens:** lowercase with brackets (`[chapterId].tsx`)
- **Components:** PascalCase (`ChapterDetailCard.tsx`)
- **Quiz types:** lowercase strings (`'vocabulary'`, `'grammar'`)

### Anti-Patterns to Avoid

- **DO NOT** add any chapter locking logic
- **DO NOT** check prerequisites before navigation
- **DO NOT** show "unlock" or "locked" indicators
- **DO NOT** prevent navigation based on progress
- **DO NOT** downgrade mastery status on retakes

### Dependencies

**Required Infrastructure:**
- Expo Router dynamic routes
- useChapterProgress hook (Story 3.3)
- Chapter constants (Story 3.2)

**Story Dependencies:**
- Depends on: Story 3.2 (chapter data structure)
- Depends on: Story 3.3 (progress display)
- Enables: Epic 4 (quiz screens will replace loading placeholder)

### File Checklist

New files to create:
- [ ] `dangdai-mobile/app/quiz/[chapterId].tsx` (Chapter detail / quiz start)
- [ ] `dangdai-mobile/app/quiz/loading.tsx` (Placeholder for Epic 4)

Files to verify (no gating):
- [ ] `dangdai-mobile/components/chapter/ChapterListItem.tsx` - No lock logic
- [ ] `dangdai-mobile/app/chapter/[bookId].tsx` - No access control

### Testing Approach

```bash
# Test 1: New User Open Access
1. Sign in as new user (no progress)
2. Navigate to Books → Book 2
3. Tap Chapter 10 (not Chapter 1)
4. Verify: Chapter detail screen appears
5. Verify: No "unlock" or "locked" message

# Test 2: Quiz Type Selection
1. Navigate to any chapter
2. Verify: "Vocabulary Quiz" and "Grammar Quiz" options visible
3. Tap Vocabulary Quiz
4. Verify: Navigates to quiz loading screen

# Test 3: Retaking Quizzes
1. Complete a quiz (when Epic 4 available)
2. Return to same chapter
3. Verify: Can start quiz again
4. Verify: Previous progress visible but not blocking

# Test 4: Mastered Chapter Access
1. Navigate to a mastered chapter (80%+)
2. Verify: "Mastered" badge displayed
3. Verify: Can still start vocabulary or grammar quiz
4. Verify: "Practice Again" label shown

# Test 5: No Gating Anywhere
1. Navigate through all books and chapters
2. Verify: No chapter shows lock icon
3. Verify: All chapters are tappable
4. Verify: No prerequisite warnings appear
```

### References

- [Source: prd.md#FR9] - User can select any chapter (open navigation, no gates)
- [Source: ux-design-specification.md#User-Journey-Flows] - Chapter navigation flow
- [Source: ux-design-specification.md#Experience-Principles] - Flexible learning
- [Source: epics.md#Story-3.4] - Story requirements
- [Source: 3-2-chapter-list-screen.md] - Chapter list navigation
- [Source: 3-3-chapter-completion-status-display.md] - Progress display

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
