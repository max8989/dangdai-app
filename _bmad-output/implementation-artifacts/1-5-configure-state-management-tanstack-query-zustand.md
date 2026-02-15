# Story 1.5: Configure State Management (TanStack Query + Zustand)

Status: done

## Story

As a developer,
I want to set up TanStack Query and Zustand in the mobile app,
So that server state and local state are managed according to architecture patterns.

## Acceptance Criteria

1. **Given** the mobile app scaffold exists
   **When** I install and configure TanStack Query v5 and Zustand v5
   **Then** both libraries are properly installed and configured

2. **Given** TanStack Query is installed
   **When** I configure the QueryClient
   **Then** QueryClient is configured in `lib/queryClient.ts` with proper defaults

3. **Given** QueryClient is configured
   **When** I wrap the app with QueryClientProvider
   **Then** QueryClientProvider wraps the app in root layout

4. **Given** TanStack Query is configured
   **When** I define query keys
   **Then** query keys are defined in `lib/queryKeys.ts` following consistent patterns

5. **Given** Zustand is installed
   **When** I create a sample store
   **Then** a sample Zustand store (`useSettingsStore`) is created following naming conventions

## Tasks / Subtasks

- [x] Task 1: Install dependencies (AC: #1)
  - [x] 1.1 Install TanStack Query v5: `yarn add @tanstack/react-query`
  - [x] 1.2 Install Zustand v5: `yarn add zustand`
  - [x] 1.3 Verify versions match architecture spec (v5.x for both)

- [x] Task 2: Configure QueryClient (AC: #2)
  - [x] 2.1 Create `lib/queryClient.ts`
  - [x] 2.2 Configure default options (staleTime, retry, etc.)
  - [x] 2.3 Export QueryClient instance

- [x] Task 3: Set up QueryClientProvider (AC: #3)
  - [x] 3.1 Import QueryClientProvider in `app/_layout.tsx`
  - [x] 3.2 Wrap app content with QueryClientProvider
  - [x] 3.3 Ensure proper provider ordering (inside TamaguiProvider)

- [x] Task 4: Create query keys structure (AC: #4)
  - [x] 4.1 Create `lib/queryKeys.ts`
  - [x] 4.2 Define query key factory pattern
  - [x] 4.3 Add keys for user, chapters, quiz, progress

- [x] Task 5: Create settings store (AC: #5)
  - [x] 5.1 Create `stores/` directory
  - [x] 5.2 Create `stores/useSettingsStore.ts`
  - [x] 5.3 Define settings state (theme, language, sound)
  - [ ] 5.4 Add persistence with AsyncStorage (optional for MVP) - Skipped: marked optional, not required for MVP

- [x] Task 6: Create placeholder stores
  - [x] 6.1 Create `stores/useQuizStore.ts` placeholder
  - [x] 6.2 Create `stores/useUserStore.ts` placeholder
  - [x] 6.3 Document store responsibilities in comments

### Review Follow-ups (AI)

- [ ] [AI-Review][MEDIUM] Add unit test framework (Jest/Vitest) and tests for Zustand stores - No unit test framework currently configured
- [ ] [AI-Review][LOW] Consider adding React Query DevTools for development debugging

## Dev Notes

### Critical Architecture Requirements

**State Management Strategy from Architecture:**
- **TanStack Query:** Server state (user profile, progress, quiz history)
- **Zustand:** Local state (current quiz state, UI preferences, theme)

### QueryClient Configuration

**Create `lib/queryClient.ts`:**

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data considered fresh for 5 minutes
      staleTime: 1000 * 60 * 5,
      
      // Keep unused data in cache for 30 minutes
      gcTime: 1000 * 60 * 30,
      
      // Retry failed requests once (per architecture spec)
      retry: 1,
      
      // Refetch on window focus (good for mobile app resume)
      refetchOnWindowFocus: true,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
    },
    mutations: {
      // Don't retry mutations by default
      retry: 0,
    },
  },
});
```

### Query Keys Pattern

**Create `lib/queryKeys.ts`:**

```typescript
// Consistent query key structure: [resource, ...identifiers]
// This pattern enables efficient cache invalidation

export const queryKeys = {
  // User data
  user: ['user'] as const,
  userProfile: (userId: string) => ['user', 'profile', userId] as const,
  
  // Books and chapters
  books: ['books'] as const,
  chapters: (bookId: number) => ['chapters', bookId] as const,
  chapter: (chapterId: number) => ['chapter', chapterId] as const,
  
  // Quiz data
  quizzes: ['quizzes'] as const,
  quiz: (quizId: string) => ['quiz', quizId] as const,
  quizHistory: (userId: string) => ['quizHistory', userId] as const,
  
  // Progress data
  progress: ['progress'] as const,
  userProgress: (userId: string) => ['progress', userId] as const,
  chapterProgress: (userId: string, chapterId: number) => 
    ['progress', userId, 'chapter', chapterId] as const,
  
  // Activity and streaks
  dailyActivity: (userId: string) => ['dailyActivity', userId] as const,
  streak: (userId: string) => ['streak', userId] as const,
} as const;

// Type helper for query key extraction
export type QueryKeys = typeof queryKeys;
```

### Root Layout Integration

**Update `app/_layout.tsx`:**

```typescript
import '../tamagui-web.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { TamaguiProvider } from 'tamagui';

import { queryClient } from '../lib/queryClient';
import { tamaguiConfig } from '../tamagui.config';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme!}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <QueryClientProvider client={queryClient}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </QueryClientProvider>
      </ThemeProvider>
    </TamaguiProvider>
  );
}
```

### Zustand Store Pattern

**Create `stores/useSettingsStore.ts`:**

```typescript
import { create } from 'zustand';

// Settings state interface
interface SettingsState {
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Language (UI language, not Chinese content)
  language: 'en' | 'fr' | 'ja' | 'ko';
  
  // Sound effects
  soundEnabled: boolean;
  
  // Actions
  setTheme: (theme: SettingsState['theme']) => void;
  setLanguage: (language: SettingsState['language']) => void;
  toggleSound: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  // Default state
  theme: 'system',
  language: 'en',
  soundEnabled: true,
  
  // Actions
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
}));
```

### Quiz Store Placeholder

**Create `stores/useQuizStore.ts`:**

```typescript
import { create } from 'zustand';

// Quiz session state interface
interface QuizState {
  // Current quiz session
  currentQuizId: string | null;
  currentQuestion: number;
  answers: Record<number, string>;
  score: number;
  
  // Actions (to be implemented)
  startQuiz: (quizId: string) => void;
  setAnswer: (questionIndex: number, answer: string) => void;
  nextQuestion: () => void;
  addScore: (points: number) => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  // Initial state
  currentQuizId: null,
  currentQuestion: 0,
  answers: {},
  score: 0,
  
  // Actions
  startQuiz: (quizId) => set({
    currentQuizId: quizId,
    currentQuestion: 0,
    answers: {},
    score: 0,
  }),
  
  setAnswer: (questionIndex, answer) =>
    set((state) => ({
      answers: { ...state.answers, [questionIndex]: answer },
    })),
  
  nextQuestion: () =>
    set((state) => ({ currentQuestion: state.currentQuestion + 1 })),
  
  addScore: (points) =>
    set((state) => ({ score: state.score + points })),
  
  resetQuiz: () =>
    set({
      currentQuizId: null,
      currentQuestion: 0,
      answers: {},
      score: 0,
    }),
}));
```

### User Store Placeholder

**Create `stores/useUserStore.ts`:**

```typescript
import { create } from 'zustand';

// Cached user data for fast access
interface UserState {
  // Cached user profile
  userId: string | null;
  displayName: string | null;
  totalPoints: number;
  currentStreak: number;
  
  // Actions
  setUser: (user: Partial<UserState>) => void;
  updatePoints: (points: number) => void;
  updateStreak: (streak: number) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  // Initial state
  userId: null,
  displayName: null,
  totalPoints: 0,
  currentStreak: 0,
  
  // Actions
  setUser: (user) => set((state) => ({ ...state, ...user })),
  
  updatePoints: (points) => set({ totalPoints: points }),
  
  updateStreak: (streak) => set({ currentStreak: streak }),
  
  clearUser: () => set({
    userId: null,
    displayName: null,
    totalPoints: 0,
    currentStreak: 0,
  }),
}));
```

### Project Structure After This Story

```
dangdai-app/
├── lib/
│   ├── supabase.ts              # From Story 1-4
│   ├── api.ts                   # Placeholder
│   ├── queryKeys.ts             # Query key factory
│   └── queryClient.ts           # QueryClient configuration
│
├── stores/
│   ├── useSettingsStore.ts      # App settings (theme, language, sound)
│   ├── useQuizStore.ts          # Current quiz session state
│   └── useUserStore.ts          # Cached user data
│
├── app/
│   └── _layout.tsx              # Updated with QueryClientProvider
│
└── ... (existing structure)
```

### Naming Conventions (MUST FOLLOW)

From Architecture specification:
- **Zustand stores:** `use[Name]Store` (e.g., `useQuizStore`, `useSettingsStore`)
- **Query keys:** Consistent `[resource, ...identifiers]` pattern
- **Files:** camelCase (e.g., `queryClient.ts`, `useQuizStore.ts`)

### State Domain Separation

| Domain | Library | Examples |
|--------|---------|----------|
| Server State | TanStack Query | User profile, chapter progress, quiz history |
| Local UI State | Zustand | Current quiz answers, theme preference, UI state |
| Auth State | Supabase Auth | Session, tokens (managed by Supabase client) |

### TanStack Query Usage Pattern

```typescript
// Example hook usage (for future stories)
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { supabase } from '../lib/supabase';

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.userProfile(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });
}
```

### Zustand Usage Pattern

```typescript
// Example component usage (for future stories)
import { useSettingsStore } from '../stores/useSettingsStore';

function SettingsScreen() {
  const { theme, setTheme, soundEnabled, toggleSound } = useSettingsStore();
  
  return (
    <View>
      <Switch value={soundEnabled} onValueChange={toggleSound} />
      {/* ... */}
    </View>
  );
}
```

### Anti-Patterns to Avoid

- **DO NOT** use Redux - use TanStack Query + Zustand per architecture
- **DO NOT** store server data in Zustand - use TanStack Query
- **DO NOT** create multiple QueryClient instances
- **DO NOT** name stores without `use` prefix (e.g., `quizStore`)
- **DO NOT** put complex query logic in components - use custom hooks
- **DO NOT** skip TypeScript interfaces for store state

### Verification Steps

```bash
# Verify dependencies installed with correct versions
yarn list @tanstack/react-query  # Should be v5.x
yarn list zustand                # Should be v5.x

# Verify app runs without errors
yarn start

# Verify no TypeScript errors
yarn tsc --noEmit
```

### Dependencies from Epic 1

- **Depends on:** Story 1-1 (app scaffold), Story 1-4 (Supabase client)
- **Blocks:** All quiz and data fetching features in later epics

### References

- [Source: architecture.md#State-Management-Mobile] - State strategy
- [Source: architecture.md#Communication-Patterns] - Query keys pattern
- [Source: architecture.md#Zustand-Store-Pattern] - Store structure
- [Source: epics.md#Story-1.5] - Story requirements

### External Documentation

- TanStack Query v5: https://tanstack.com/query/latest
- Zustand v5: https://github.com/pmndrs/zustand
- TanStack Query React Native: https://tanstack.com/query/latest/docs/framework/react/react-native

## Dev Agent Record

### Agent Model Used

claude-opus-4-5 (anthropic/claude-opus-4-5)

### Debug Log References

- TypeScript compilation: `yarn tsc --noEmit` - PASSED
- Web build: `yarn build:web` - PASSED (exported to dist/)

### Completion Notes List

- Installed TanStack Query v5.90.21 and Zustand v5.0.11
- Configured QueryClient with architecture-specified defaults (5min staleTime, 30min gcTime, retry: 1)
- Integrated QueryClientProvider into Provider.tsx (inside TamaguiProvider, wrapping ToastProvider)
- Created query keys factory in lib/queryKeys.ts with consistent [resource, ...identifiers] pattern
- Created useSettingsStore with theme, language, and sound settings
- Created useQuizStore placeholder for quiz session state management
- Created useUserStore placeholder for cached user data
- All stores follow use[Name]Store naming convention per architecture spec
- AsyncStorage persistence (Task 5.4) was marked optional for MVP and skipped

### Change Log

- 2026-02-15: Initial implementation of state management (TanStack Query + Zustand)
  - Added @tanstack/react-query@^5.90.21 and zustand@^5.0.11
  - Created lib/queryClient.ts with QueryClient configuration
  - Updated lib/queryKeys.ts with query key factory pattern
  - Updated components/Provider.tsx with QueryClientProvider integration
  - Created stores/useSettingsStore.ts, useQuizStore.ts, useUserStore.ts
- 2026-02-15: Code review fixes applied (claude-opus-4-5)
  - Added stores/index.ts barrel export for cleaner imports
  - Enhanced lib/queryClient.ts with global onError handlers using QueryCache/MutationCache
  - Added review follow-up items for unit tests and DevTools

### File List

- dangdai-mobile/package.json (modified - added dependencies)
- dangdai-mobile/yarn.lock (modified - dependency lockfile)
- dangdai-mobile/lib/queryClient.ts (modified - implemented QueryClient with global error handlers)
- dangdai-mobile/lib/queryKeys.ts (modified - implemented query key factory)
- dangdai-mobile/components/Provider.tsx (modified - added QueryClientProvider)
- dangdai-mobile/stores/index.ts (new - barrel export for stores)
- dangdai-mobile/stores/useSettingsStore.ts (new - settings store)
- dangdai-mobile/stores/useQuizStore.ts (new - quiz session store)
- dangdai-mobile/stores/useUserStore.ts (new - user cache store)

### Senior Developer Review (AI)

**Reviewer:** claude-opus-4-5
**Date:** 2026-02-15
**Outcome:** APPROVED with improvements applied

**Review Summary:**
- All 5 Acceptance Criteria verified as implemented
- All tasks marked [x] confirmed as actually done
- 2 MEDIUM issues fixed: barrel export added, QueryClient error handlers added
- 2 LOW issues documented as follow-up items (unit tests, DevTools)

**Issues Fixed:**
1. Created `stores/index.ts` barrel export for cleaner imports
2. Added global `onError` handlers to QueryClient using QueryCache/MutationCache

**Remaining Follow-ups:**
- Unit test framework not configured - tests for stores deferred
- React Query DevTools not added - optional for development
