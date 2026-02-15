# Story 2.2: Email Login Screen and Flow

Status: ready-for-dev

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

- [ ] Task 1: Create login screen (AC: #1, #3, #4)
  - [ ] 1.1 Create `app/(auth)/login.tsx` screen
  - [ ] 1.2 Add navigation to signup screen
  - [ ] 1.3 Add navigation to forgot password
  - [ ] 1.4 Make login the default auth route

- [ ] Task 2: Create LoginForm component (AC: #1, #2)
  - [ ] 2.1 Create `components/auth/LoginForm.tsx`
  - [ ] 2.2 Add email input field
  - [ ] 2.3 Add password input field
  - [ ] 2.4 Add Sign In button with loading state
  - [ ] 2.5 Add links to signup and forgot password

- [ ] Task 3: Implement login logic (AC: #1, #2)
  - [ ] 3.1 Add `signIn` function to `hooks/useAuth.ts`
  - [ ] 3.2 Call `supabase.auth.signInWithPassword()`
  - [ ] 3.3 Handle success: redirect to dashboard
  - [ ] 3.4 Handle invalid credentials error

- [ ] Task 4: Configure auth routing (AC: #1)
  - [ ] 4.1 Update root `_layout.tsx` with auth state check
  - [ ] 4.2 Redirect unauthenticated users to login
  - [ ] 4.3 Redirect authenticated users to dashboard

- [ ] Task 5: Test login flow
  - [ ] 5.1 Test successful login redirects to dashboard
  - [ ] 5.2 Test invalid credentials shows error
  - [ ] 5.3 Test navigation links work

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
