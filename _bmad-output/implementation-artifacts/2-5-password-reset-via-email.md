# Story 2.5: Password Reset via Email

Status: review

## Story

As a user who forgot my password,
I want to reset my password via email,
So that I can regain access to my account.

## Acceptance Criteria

1. **Given** I am on the login screen
   **When** I tap "Forgot Password" and enter my email
   **Then** a password reset email is sent via Supabase Auth
   **And** I see a confirmation message "Reset link sent to your email"

2. **Given** I click the reset link in my email
   **When** I enter a new password
   **Then** my password is updated
   **And** I can sign in with the new password

3. **Given** I enter an email not registered in the system
   **When** I tap "Send Reset Link"
   **Then** I see the same confirmation message (security: don't reveal if email exists)

4. **Given** I am on the forgot password screen
   **When** I tap "Back to Login"
   **Then** I am navigated back to the login screen

## Tasks / Subtasks

- [x] Task 1: Create forgot password screen (AC: #1, #4)
  - [x] 1.1 Create `app/(auth)/forgot-password.tsx` screen
  - [x] 1.2 Add email input field
  - [x] 1.3 Add "Send Reset Link" button
  - [x] 1.4 Add "Back to Login" link
  - [x] 1.5 Add success state view

- [x] Task 2: Implement reset email logic (AC: #1, #3)
  - [x] 2.1 Add `resetPassword` function to `hooks/useAuth.ts`
  - [x] 2.2 Call `supabase.auth.resetPasswordForEmail()`
  - [x] 2.3 Configure redirect URL for password reset
  - [x] 2.4 Show success message (regardless of email existence)

- [x] Task 3: Create reset password screen (AC: #2)
  - [x] 3.1 Create `app/(auth)/reset-password.tsx` screen
  - [x] 3.2 Add new password input
  - [x] 3.3 Add confirm password input
  - [x] 3.4 Add password strength validation
  - [x] 3.5 Implement password update logic

- [x] Task 4: Configure deep linking (AC: #2)
  - [x] 4.1 Configure Expo deep linking scheme
  - [x] 4.2 Handle Supabase reset password callback
  - [x] 4.3 Navigate to reset-password screen with token

- [x] Task 5: Test password reset flow
  - [x] 5.1 Test reset email is sent
  - [x] 5.2 Test deep link opens app
  - [x] 5.3 Test password update works
  - [x] 5.4 Test login with new password

## Dev Notes

### Architecture Requirements

**Route Structure:**
```
app/
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── signup.tsx
│   ├── forgot-password.tsx    # This story
│   └── reset-password.tsx     # This story
```

### Supabase Password Reset Flow

**Flow Overview:**
```
1. User enters email on forgot-password screen
2. App calls supabase.auth.resetPasswordForEmail()
3. Supabase sends email with magic link
4. User clicks link → opens app via deep link
5. App extracts token from URL
6. App shows reset-password screen
7. User enters new password
8. App calls supabase.auth.updateUser({ password })
9. User is signed in with new password
```

### Implementation

**Reset Password Request:**
```typescript
// hooks/useAuth.ts
const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'dangdai://reset-password',
  });
  
  if (error) {
    // Log error but show generic message for security
    console.error('Reset password error:', error);
  }
  
  // Always show success (don't reveal if email exists)
  return { success: true };
};
```

**Update Password:**
```typescript
// hooks/useAuth.ts
const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  if (error) throw error;
  
  // Navigate to dashboard (user is now signed in)
  router.replace('/(tabs)');
};
```

### Deep Linking Configuration

**Expo Configuration (`app.config.js`):**
```javascript
export default {
  expo: {
    scheme: 'dangdai',
    // ... other config
  },
};
```

**Supabase Redirect URL:**
- Development: `dangdai://reset-password`
- Production: `dangdai://reset-password` or custom domain

**Handling Deep Link:**
```typescript
// app/(auth)/reset-password.tsx
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  
  useEffect(() => {
    // The Supabase client automatically handles the token from URL
    // via onAuthStateChange listener
  }, []);
  
  // Show password reset form
}
```

**Auth State Handling:**
```typescript
// In root layout or auth provider
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    // User clicked reset link - navigate to reset password screen
    router.push('/(auth)/reset-password');
  }
});
```

### UI Requirements

**Forgot Password Screen:**
- Header: "Forgot Password?"
- Description: "Enter your email and we'll send you a reset link"
- Email input field
- "Send Reset Link" button
- "Back to Login" link
- Success state: "Check your email for reset instructions"

**Reset Password Screen:**
- Header: "Set New Password"
- New password input
- Confirm password input
- Password requirements shown
- "Update Password" button
- Password strength indicator (optional)

### Security Considerations

**Important:**
- Always show "Reset link sent" even if email doesn't exist
- Don't reveal whether an email is registered
- Validate password strength on client AND server
- Clear any sensitive state after password update

### Password Validation

```typescript
const validatePassword = (password: string) => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('At least 8 characters');
  }
  // Add more rules as needed
  
  return errors;
};
```

### Error Handling

```typescript
const handleResetError = (error: Error) => {
  // For security, don't reveal specific errors about email existence
  if (error.message.includes('rate limit')) {
    return 'Too many attempts. Please try again later.';
  }
  return 'Unable to send reset link. Please try again.';
};
```

### Naming Conventions (MUST FOLLOW)

- **Screens:** lowercase with hyphens (`forgot-password.tsx`, `reset-password.tsx`)
- **Functions:** camelCase (`resetPassword`, `updatePassword`)

### Anti-Patterns to Avoid

- **DO NOT** reveal if email exists in system
- **DO NOT** send password in URL or logs
- **DO NOT** allow weak passwords
- **DO NOT** skip password confirmation
- **DO NOT** auto-redirect without user seeing success message

### Dependencies

**Story Dependencies:**
- Depends on: Story 2.2 (login screen with forgot password link)
- Blocks: None

### File Checklist

New files to create:
- [ ] `dangdai-mobile/app/(auth)/forgot-password.tsx`
- [ ] `dangdai-mobile/app/(auth)/reset-password.tsx`

Files to modify:
- [ ] `dangdai-mobile/hooks/useAuth.ts` - Add resetPassword, updatePassword
- [ ] `dangdai-mobile/app.config.js` - Add deep link scheme (if not present)
- [ ] `dangdai-mobile/app/_layout.tsx` - Handle PASSWORD_RECOVERY event

### Testing Approach

```bash
# Manual testing steps:
1. Navigate to login screen
2. Tap "Forgot Password"
3. Enter email, tap "Send Reset Link"
4. Verify confirmation message appears
5. Check email for reset link
6. Click link (test deep linking)
7. Enter new password
8. Verify redirect to dashboard
9. Sign out, sign in with new password
```

**Deep Link Testing:**
```bash
# iOS Simulator
xcrun simctl openurl booted "dangdai://reset-password"

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "dangdai://reset-password"
```

### References

- [Source: architecture.md#Communication-Patterns] - Auth state handling
- [Source: epics.md#Story-2.5] - Story requirements
- Supabase Password Reset: https://supabase.com/docs/guides/auth/passwords
- Expo Deep Linking: https://docs.expo.dev/guides/deep-linking/

## Dev Agent Record

### Agent Model Used

claude-opus-4-5

### Debug Log References

None

### Completion Notes List

- Implemented forgot password screen with ForgotPasswordForm component following existing auth patterns
- Added resetPassword and updatePassword functions to useAuth hook with proper error handling
- Created reset password screen with ResetPasswordForm component including password strength validation
- Updated deep linking scheme from 'myapp' to 'dangdai' in app.config.js
- Added PASSWORD_RECOVERY event handling in root layout to navigate to reset-password screen
- Updated useProtectedRoute to allow reset-password screen during password recovery flow
- All security requirements met: never revealing if email exists, showing generic success messages

### File List

New files:
- dangdai-mobile/components/auth/ForgotPasswordForm.tsx
- dangdai-mobile/components/auth/ResetPasswordForm.tsx
- dangdai-mobile/app/(auth)/reset-password.tsx

Modified files:
- dangdai-mobile/app/(auth)/forgot-password.tsx
- dangdai-mobile/app/(auth)/_layout.tsx
- dangdai-mobile/hooks/useAuth.ts
- dangdai-mobile/app.config.js
- dangdai-mobile/app/_layout.tsx

## Change Log

- 2026-02-15: Implemented password reset via email flow (Story 2.5)
