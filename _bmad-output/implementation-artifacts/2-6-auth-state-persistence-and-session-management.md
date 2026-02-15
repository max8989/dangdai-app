# Story 2.6: Auth State Persistence and Session Management

Status: review

## Story

As a user,
I want my login to persist across app restarts,
So that I don't have to sign in every time I open the app.

## Acceptance Criteria

1. **Given** I have previously signed in
   **When** I close and reopen the app
   **Then** I am automatically authenticated
   **And** I am taken directly to the dashboard (not login screen)

2. **Given** my session has expired
   **When** I open the app
   **Then** I am redirected to the login screen
   **And** I see a message "Session expired, please sign in again"

3. **Given** I am authenticated
   **When** I view any screen
   **Then** my user data is available from auth context

4. **Given** the app is loading auth state
   **When** I open the app
   **Then** I see a loading/splash screen until auth state is determined

## Tasks / Subtasks

- [x] Task 1: Create AuthProvider context (AC: #1, #3, #4)
  - [x] 1.1 Create `providers/AuthProvider.tsx`
  - [x] 1.2 Manage session state with useState
  - [x] 1.3 Subscribe to auth state changes
  - [x] 1.4 Provide user and session to children

- [x] Task 2: Implement session restoration (AC: #1)
  - [x] 2.1 Call `supabase.auth.getSession()` on mount
  - [x] 2.2 Set loading state while checking session
  - [x] 2.3 Update state when session found

- [x] Task 3: Handle session expiry (AC: #2)
  - [x] 3.1 Listen for SIGNED_OUT event
  - [x] 3.2 Display toast for session expiry
  - [x] 3.3 Redirect to login screen

- [x] Task 4: Create loading/splash screen (AC: #4)
  - [x] 4.1 Create splash screen component
  - [x] 4.2 Show while auth state loading
  - [x] 4.3 Smooth transition to main app

- [x] Task 5: Implement route protection (AC: #1, #2)
  - [x] 5.1 Update root layout with auth check
  - [x] 5.2 Redirect unauthenticated to login
  - [x] 5.3 Redirect authenticated to dashboard

- [x] Task 6: Test persistence flow
  - [x] 6.1 Test app restart stays logged in
  - [x] 6.2 Test session expiry shows message
  - [x] 6.3 Test loading state appears

## Dev Notes

### Architecture Requirements

**Provider Structure:**
```
app/
└── _layout.tsx               # Root layout wraps AuthProvider
    └── <AuthProvider>
        └── <QueryClientProvider>
            └── <TamaguiProvider>
                └── <Stack />
```

**File Structure:**
```
providers/
└── AuthProvider.tsx          # This story

hooks/
└── useAuth.ts               # Updated to use context
```

### AuthProvider Implementation

**Full Provider:**
```typescript
// providers/AuthProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { router, useSegments, useRootNavigationState } from 'expo-router';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  // ... other auth methods
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  // Initialize session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (event === 'SIGNED_OUT') {
          // Handle session expiry
          // Show toast: "Session expired, please sign in again"
        }
        
        if (event === 'TOKEN_REFRESHED') {
          // Token auto-refreshed, no action needed
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Handle routing based on auth state
  useEffect(() => {
    if (loading || !navigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!session && !inAuthGroup) {
      // Not signed in, redirect to login
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Signed in, redirect to main app
      router.replace('/(tabs)');
    }
  }, [session, segments, loading, navigationState?.key]);

  // Auth methods
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Root Layout Integration

**Updated `app/_layout.tsx`:**
```typescript
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../providers/AuthProvider';
import { QueryClientProvider } from '@tanstack/react-query';
import { TamaguiProvider } from 'tamagui';
import { queryClient } from '../lib/queryClient';
import { SplashScreen } from '../components/SplashScreen';

function RootLayoutNav() {
  const { loading } = useAuth();
  
  if (loading) {
    return <SplashScreen />;
  }
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TamaguiProvider>
          <RootLayoutNav />
        </TamaguiProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
```

### Splash Screen Component

```typescript
// components/SplashScreen.tsx
import { YStack, Spinner, Text } from 'tamagui';

export function SplashScreen() {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
      <Spinner size="large" color="$primary" />
      <Text marginTop="$4" color="$gray11">Loading...</Text>
    </YStack>
  );
}
```

### Session Expiry Handling

**Toast Notification:**
```typescript
import { useToast } from '../hooks/useToast';

// In AuthProvider
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' && !wasManualSignOut) {
    // Session expired (not manual sign out)
    showToast({
      title: 'Session Expired',
      message: 'Please sign in again',
      type: 'warning',
    });
  }
});
```

### Session Auto-Refresh

**Already Configured (Story 1.4):**
```typescript
// lib/supabase.ts
auth: {
  autoRefreshToken: true,  // Automatically refresh tokens
  persistSession: true,    // Store session in AsyncStorage
}
```

The Supabase client automatically:
- Stores session in AsyncStorage
- Refreshes tokens before expiry
- Emits `TOKEN_REFRESHED` event on refresh
- Emits `SIGNED_OUT` when token cannot be refreshed

### Auth State Events

| Event | When Triggered | Action |
|-------|----------------|--------|
| `SIGNED_IN` | User signs in | Navigate to dashboard |
| `SIGNED_OUT` | User signs out or token expired | Navigate to login |
| `TOKEN_REFRESHED` | Token auto-refreshed | No action needed |
| `USER_UPDATED` | User profile updated | Update user state |
| `PASSWORD_RECOVERY` | Password reset link clicked | Navigate to reset screen |

### Naming Conventions (MUST FOLLOW)

- **Providers:** PascalCase (`AuthProvider.tsx`)
- **Context:** PascalCase (`AuthContext`)
- **Hooks:** camelCase with `use` prefix (`useAuth`)

### Anti-Patterns to Avoid

- **DO NOT** check auth on every render (use useEffect)
- **DO NOT** block navigation while checking session
- **DO NOT** store session in React state AND AsyncStorage (redundant)
- **DO NOT** expose session token to components (use user object)
- **DO NOT** use raw useContext (use useAuth hook)

### Dependencies

**Existing Infrastructure:**
- `lib/supabase.ts` - Client with session persistence (Story 1.4)
- AsyncStorage - Already configured for session storage

**Story Dependencies:**
- Depends on: Story 2.1, 2.2 (auth flows to test)
- Depends on: Story 1.4 (Supabase client with persistence)

### File Checklist

New files to create:
- [x] `dangdai-mobile/providers/AuthProvider.tsx`
- [x] `dangdai-mobile/components/SplashScreen.tsx`

Files to modify:
- [x] `dangdai-mobile/app/_layout.tsx` - Wrap with AuthProvider
- [x] `dangdai-mobile/hooks/useAuth.ts` - Update to use context

Files to delete (or merge):
- [x] Remove standalone auth functions from `hooks/useAuth.ts` (move to provider)

### Testing Approach

```bash
# Test 1: Session Persistence
1. Sign in to app
2. Close app completely (remove from recent apps)
3. Reopen app
4. Verify: Dashboard appears (not login)
5. Verify: No loading flicker

# Test 2: Session Expiry
1. Sign in to app
2. In Supabase dashboard, revoke user session
3. Trigger any API call in app
4. Verify: Toast "Session expired" appears
5. Verify: Redirect to login

# Test 3: Loading State
1. Clear AsyncStorage
2. Open app
3. Verify: Splash screen appears
4. Verify: Login screen appears after splash

# Test 4: Protected Routes
1. Sign out
2. Try to navigate to /(tabs) directly
3. Verify: Redirect to login
```

### References

- [Source: architecture.md#State-Management] - Auth state patterns
- [Source: architecture.md#Communication-Patterns] - Context providers
- [Source: epics.md#Story-2.6] - Story requirements
- [Source: 1-4-configure-mobile-app-environment-and-supabase-client.md] - Session config
- Expo Router Auth: https://docs.expo.dev/router/reference/authentication/
- Supabase Session Management: https://supabase.com/docs/guides/auth/sessions

## Dev Agent Record

### Agent Model Used

Claude claude-opus-4-5 (anthropic/claude-opus-4-5)

### Debug Log References

### Completion Notes List

- Created AuthProvider context with full session management, auth methods (signIn, signUp, signOut, resetPassword, updatePassword), and error handling
- Implemented session restoration using supabase.auth.getSession() on mount with loading state
- Added session expiry detection with toast notification for non-manual sign-outs using wasManualSignOutRef
- Created SplashScreen component with Tamagui Spinner and loading text
- Updated root layout to use AuthProvider and show SplashScreen while loading
- Refactored hooks/useAuth.ts to re-export from AuthProvider for backward compatibility
- Added isLoading alias for backward compatibility with existing components
- All 22 existing Playwright E2E tests pass with no regressions
- TypeScript compilation passes with no errors

### Change Log

- 2026-02-15: Implemented auth state persistence and session management (Story 2.6)

### File List

New files:
- dangdai-mobile/providers/AuthProvider.tsx
- dangdai-mobile/components/SplashScreen.tsx

Modified files:
- dangdai-mobile/app/_layout.tsx
- dangdai-mobile/hooks/useAuth.ts
