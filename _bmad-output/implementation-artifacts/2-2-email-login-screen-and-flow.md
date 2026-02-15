# Story 2.2: Email Login Screen and Flow

Status: done

## Story

As a returning user,
I want to sign in with my email and password,
So that I can continue my learning progress.

## Acceptance Criteria

1. **Given** I am on the login screen
   **When** I enter my registered email and correct password and tap "Sign In"
   **Then** I am authenticated via Supabase Auth
   **And** I am redirected to the dashboard
   **And** my session persists across app restarts (FR6)

2. **Given** I enter incorrect credentials
   **When** I tap "Sign In"
   **Then** I see an error message "Invalid email or password"

3. **Given** I have no account
   **When** I tap "Create Account"
   **Then** I am navigated to the signup screen

4. **Given** I am on the login screen
   **When** I tap "Forgot Password"
   **Then** I am navigated to the password reset flow

## Tasks / Subtasks

- [x] Task 1: Create login screen (AC: #1, #3, #4)
  - [x] 1.1 Create `app/(auth)/login.tsx` screen
  - [x] 1.2 Add navigation to signup screen
  - [x] 1.3 Add navigation to forgot password
  - [x] 1.4 Make login the default auth route

- [x] Task 2: Create LoginForm component (AC: #1, #2)
  - [x] 2.1 Create `components/auth/LoginForm.tsx`
  - [x] 2.2 Add email input field
  - [x] 2.3 Add password input field
  - [x] 2.4 Add Sign In button with loading state
  - [x] 2.5 Add links to signup and forgot password

- [x] Task 3: Implement login logic (AC: #1, #2)
  - [x] 3.1 Add `signIn` function to `hooks/useAuth.ts`
  - [x] 3.2 Call `supabase.auth.signInWithPassword()`
  - [x] 3.3 Handle success: redirect to dashboard
  - [x] 3.4 Handle invalid credentials error

- [x] Task 4: Configure auth routing (AC: #1)
  - [x] 4.1 Update root `_layout.tsx` with auth state check
  - [x] 4.2 Redirect unauthenticated users to login
  - [x] 4.3 Redirect authenticated users to dashboard

- [x] Task 5: Test login flow
  - [x] 5.1 Test successful login redirects to dashboard
  - [x] 5.2 Test invalid credentials shows error
  - [x] 5.3 Test navigation links work

## Dev Notes

### Architecture Requirements

**Route Structure:**
```
app/
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx             # This story (default route)
│   └── signup.tsx            # Story 2.1
├── (tabs)/
│   ├── index.tsx             # Dashboard (redirect target)
│   └── ...
└── _layout.tsx               # Root with auth check
```

### Supabase Auth Integration

**Login Function:**
```typescript
// Add to hooks/useAuth.ts
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw new Error('Invalid email or password');
  }
  
  router.replace('/(tabs)');
  return data;
};
```

**Auth State Check (Root Layout):**
```typescript
// app/_layout.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Route based on auth state
  // Use Redirect component or router.replace
}
```

### UI Requirements

**Login Form Layout:**
- Email input (top)
- Password input (below email)
- "Forgot Password?" link (below password, right-aligned)
- "Sign In" button (primary, full width)
- "Don't have an account? Sign Up" link (bottom)
- Optional: "Sign in with Apple" button (Story 2.3)

**Form States:**
- Default: inputs enabled, button enabled
- Loading: inputs disabled, button shows spinner
- Error: error message displayed below form

### Error Handling

**Supabase Auth Errors:**
```typescript
// Map Supabase errors to user-friendly messages
const getErrorMessage = (error: Error) => {
  if (error.message.includes('Invalid login credentials')) {
    return 'Invalid email or password';
  }
  if (error.message.includes('Email not confirmed')) {
    return 'Please verify your email first';
  }
  return 'Unable to sign in. Please try again.';
};
```

### Session Persistence

Session automatically persists via AsyncStorage (configured in Story 1.4):
- `autoRefreshToken: true` - Tokens refresh automatically
- `persistSession: true` - Session stored in AsyncStorage
- Auth state restored on app restart (Story 2.6 builds on this)

### Naming Conventions (MUST FOLLOW)

- **Components:** PascalCase (`LoginForm.tsx`)
- **Hooks:** camelCase with `use` prefix (`useAuth.ts`)
- **Routes:** lowercase with hyphens if needed

### Anti-Patterns to Avoid

- **DO NOT** log passwords or credentials
- **DO NOT** store plain text credentials
- **DO NOT** show specific "email not found" vs "wrong password" (security risk)
- **DO NOT** navigate before auth completes

### Dependencies

**Extends Files from Story 2.1:**
- `hooks/useAuth.ts` - Add `signIn` function
- `app/(auth)/_layout.tsx` - Already created

**Story Dependencies:**
- Depends on: Story 2.1 (auth routes, useAuth hook)
- Blocks: Story 2.6 (auth persistence builds on login)

### File Checklist

New files to create:
- [ ] `dangdai-mobile/app/(auth)/login.tsx`
- [ ] `dangdai-mobile/components/auth/LoginForm.tsx`

Files to modify:
- [ ] `dangdai-mobile/hooks/useAuth.ts` - Add signIn function
- [ ] `dangdai-mobile/app/_layout.tsx` - Add auth state check

### Testing Approach

```bash
# Manual testing steps:
1. Start fresh (clear AsyncStorage)
2. Navigate to login screen
3. Test valid login redirects to dashboard
4. Test invalid credentials shows error
5. Test navigation to signup works
6. Test navigation to forgot password works
7. Restart app - should stay logged in (Story 2.6 validates this)
```

### References

- [Source: architecture.md#Mobile-App-Organization] - Route structure
- [Source: architecture.md#Communication-Patterns] - Auth state management
- [Source: epics.md#Story-2.2] - Story requirements
- [Source: 2-1-email-registration-screen-and-flow.md] - useAuth hook

## Dev Agent Record

### Agent Model Used

Claude claude-opus-4-5 (via Claude Code CLI)

### Debug Log References

- Fixed TypeScript error by creating placeholder `forgot-password.tsx` route
- Updated existing tests (`export.test.ts`, `supabase.test.ts`, `signup.test.ts`) to work with new auth routing behavior
- Cleaned up stale compiled `.js` files that were causing build errors

### Completion Notes List

- Implemented `signIn` function in `useAuth.ts` with secure error handling (never reveals whether email exists)
- Created `LoginForm.tsx` component with email/password inputs, validation, loading state, and navigation links
- Updated `login.tsx` to use the new LoginForm component
- Added auth state checking in root `_layout.tsx` with `useProtectedRoute` hook
- Unauthenticated users are automatically redirected to login
- Authenticated users are automatically redirected to dashboard (tabs)
- Login is now the default auth route via `unstable_settings.initialRouteName`
- Created placeholder `forgot-password.tsx` for Story 2.5 navigation
- Added 8 comprehensive Playwright tests for login flow validation
- All 20 tests pass (login, signup, export, supabase integration)

**Code Review Fixes (2026-02-15):**
- Added `KeyboardAvoidingView` and `ScrollView` wrapper to `LoginForm.tsx` for better mobile keyboard UX
- Added `signOut` function to `useAuth.ts` hook for complete auth flow
- Updated File List to include all config files that were changed

### File List

**New files:**
- `dangdai-mobile/components/auth/LoginForm.tsx`
- `dangdai-mobile/app/(auth)/forgot-password.tsx` (placeholder for Story 2.5)
- `dangdai-mobile/tests/login.test.ts`
- `dangdai-mobile/eas.json` - EAS Build configuration
- `dangdai-mobile/eslint.config.mjs` - ESLint flat config
- `dangdai-mobile/playwright.config.js` - Playwright test configuration
- `dangdai-mobile/tamagui.build.js` - Tamagui build config
- `dangdai-mobile/tamagui.config.js` - Tamagui runtime config

**Modified files:**
- `dangdai-mobile/app/(auth)/login.tsx` - Full login screen implementation
- `dangdai-mobile/app/(auth)/_layout.tsx` - Added `unstable_settings` for initial route, added forgot-password screen
- `dangdai-mobile/app/_layout.tsx` - Added auth state checking and `useProtectedRoute` hook
- `dangdai-mobile/hooks/useAuth.ts` - Added `signIn` and `signOut` functions
- `dangdai-mobile/tests/export.test.ts` - Updated for auth routing
- `dangdai-mobile/tests/supabase.test.ts` - Updated for auth routing
- `dangdai-mobile/tests/signup.test.ts` - Updated selectors for DOM structure
- `dangdai-mobile/package.json` - Added dependencies
- `dangdai-mobile/yarn.lock` - Updated lockfile

## Change Log

- 2026-02-15: Story 2.2 implementation complete - Email login screen with auth routing and comprehensive tests
- 2026-02-15: Code review fixes - Added KeyboardAvoidingView to LoginForm, added signOut to useAuth, updated File List documentation
