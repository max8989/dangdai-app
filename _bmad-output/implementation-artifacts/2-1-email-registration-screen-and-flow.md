# Story 2.1: Email Registration Screen and Flow

Status: ready-for-dev

## Story

As a new user,
I want to create an account using my email address,
So that I can start my personalized Chinese learning journey.

## Acceptance Criteria

1. **Given** I am on the signup screen
   **When** I enter a valid email and password and tap "Sign Up"
   **Then** my account is created via Supabase Auth
   **And** a user record is created in the `users` table
   **And** I am redirected to the book selection screen
   **And** I see a welcome message

2. **Given** I enter an email already in use
   **When** I tap "Sign Up"
   **Then** I see an error message "Email already registered"

3. **Given** I enter an invalid email format
   **When** I tap "Sign Up"
   **Then** I see an inline validation error

4. **Given** I enter a password that doesn't meet requirements
   **When** I tap "Sign Up"
   **Then** I see an inline validation error for password

5. **Given** I am on the signup screen
   **When** I tap "Already have an account? Sign In"
   **Then** I am navigated to the login screen

## Tasks / Subtasks

- [ ] Task 1: Create auth route group and signup screen (AC: #1, #5)
  - [ ] 1.1 Create `app/(auth)/_layout.tsx` with auth group layout
  - [ ] 1.2 Create `app/(auth)/signup.tsx` screen
  - [ ] 1.3 Add navigation link to login screen

- [ ] Task 2: Create SignupForm component (AC: #1, #2, #3, #4)
  - [ ] 2.1 Create `components/auth/SignupForm.tsx`
  - [ ] 2.2 Add email input with validation
  - [ ] 2.3 Add password input with requirements
  - [ ] 2.4 Add confirm password input
  - [ ] 2.5 Add Sign Up button with loading state
  - [ ] 2.6 Add link to login screen

- [ ] Task 3: Implement signup logic with Supabase (AC: #1, #2)
  - [ ] 3.1 Create `hooks/useAuth.ts` with signup function
  - [ ] 3.2 Call `supabase.auth.signUp()` with email/password
  - [ ] 3.3 Handle success: redirect to books screen
  - [ ] 3.4 Handle "email already registered" error
  - [ ] 3.5 Display welcome toast on success

- [ ] Task 4: Implement form validation (AC: #3, #4)
  - [ ] 4.1 Add email format validation
  - [ ] 4.2 Add password strength validation (min 8 chars)
  - [ ] 4.3 Add password confirmation match validation
  - [ ] 4.4 Display inline validation errors

- [ ] Task 5: Test signup flow
  - [ ] 5.1 Test successful registration creates user
  - [ ] 5.2 Test duplicate email shows error
  - [ ] 5.3 Test invalid inputs show validation

## Dev Notes

### Architecture Requirements

**Route Structure (Expo Router):**
```
app/
├── (auth)/                    # Auth flow (unauthenticated users)
│   ├── _layout.tsx           # Auth layout (no tabs)
│   ├── signup.tsx            # This story
│   └── login.tsx             # Story 2.2
├── (tabs)/                    # Main app (authenticated users)
│   └── ...
└── _layout.tsx               # Root layout with auth check
```

**Component Structure:**
```
components/
└── auth/
    ├── SignupForm.tsx        # This story
    ├── LoginForm.tsx         # Story 2.2
    └── AppleSignInButton.tsx # Story 2.3
```

### Supabase Auth Integration

**Signup Function:**
```typescript
// hooks/useAuth.ts
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

export function useAuth() {
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('Email already registered');
      }
      throw error;
    }
    
    // User profile auto-created by database trigger (Story 1.3)
    router.replace('/(tabs)/books');
    return data;
  };
  
  return { signUp };
}
```

**Existing Infrastructure:**
- Supabase client: `lib/supabase.ts` (Story 1.4)
- User table with auto-create trigger (Story 1.3)
- Email auth enabled in Supabase (Story 1.3)

### UI Requirements (from UX Spec)

**Form Layout:**
- Full-width inputs with Tamagui `Input` component
- Minimum 48px touch targets
- Clear labels above each input
- Inline validation errors below inputs
- Primary action button at bottom

**Colors/Styling:**
- Use Tamagui theme tokens
- Error text: `$red10` (not harsh red)
- Success: `$green10`
- Button: Primary theme button

### Validation Rules

| Field | Validation | Error Message |
|-------|------------|---------------|
| Email | Valid email format | "Please enter a valid email" |
| Password | Min 8 characters | "Password must be at least 8 characters" |
| Confirm Password | Matches password | "Passwords don't match" |

### Error Handling

**Supabase Error Codes:**
```typescript
// Common error mappings
const errorMessages: Record<string, string> = {
  'User already registered': 'Email already registered',
  'Invalid email': 'Please enter a valid email',
  'Password should be at least 6 characters': 'Password must be at least 8 characters',
};
```

### Naming Conventions (MUST FOLLOW)

- **Components:** PascalCase (`SignupForm.tsx`)
- **Hooks:** camelCase with `use` prefix (`useAuth.ts`)
- **Files:** PascalCase for components, camelCase for utilities

### Anti-Patterns to Avoid

- **DO NOT** store passwords locally
- **DO NOT** create user profile manually (trigger handles it)
- **DO NOT** use alert() for errors (use Toast or inline)
- **DO NOT** navigate without waiting for signup completion
- **DO NOT** expose password in error logs

### Dependencies

**Required Packages (already installed):**
- `@supabase/supabase-js` (Story 1.4)
- `expo-router` (Story 1.1)
- `tamagui` (Story 1.1)

**Story Dependencies:**
- Depends on: Story 1.3 (Supabase schema), Story 1.4 (Supabase client)
- Blocks: None (parallel with 2.2-2.6)

### File Checklist

New files to create:
- [ ] `dangdai-mobile/app/(auth)/_layout.tsx`
- [ ] `dangdai-mobile/app/(auth)/signup.tsx`
- [ ] `dangdai-mobile/components/auth/SignupForm.tsx`
- [ ] `dangdai-mobile/hooks/useAuth.ts`

### Testing Approach

```bash
# Manual testing steps:
1. Start app: yarn start
2. Navigate to signup screen
3. Test valid signup creates account
4. Test duplicate email shows error
5. Test invalid email shows validation
6. Test weak password shows validation
7. Verify redirect to books screen on success
```

### References

- [Source: architecture.md#Mobile-App-Organization] - Route structure
- [Source: architecture.md#Naming-Patterns] - Component naming
- [Source: epics.md#Story-2.1] - Story requirements
- [Source: 1-3-configure-supabase-project-and-base-schema.md] - User table trigger

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
