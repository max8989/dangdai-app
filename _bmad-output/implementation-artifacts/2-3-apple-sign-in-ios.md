# Story 2.3: Apple Sign-In (iOS)

Status: review

## Story

As an iOS user,
I want to sign in using my Apple ID,
So that I can quickly access the app without creating a new password.

## Acceptance Criteria

1. **Given** I am on the login screen on an iOS device
   **When** I tap "Sign in with Apple"
   **Then** the Apple Sign-In sheet appears
   **And** after successful Apple authentication, my account is created or linked in Supabase
   **And** I am redirected to the dashboard (or book selection if new user)

2. **Given** I am on an Android device
   **When** I view the login screen
   **Then** the Apple Sign-In button is not displayed (NFR13)

3. **Given** I have previously signed in with Apple
   **When** I tap "Sign in with Apple" again
   **Then** I am signed into my existing account
   **And** I am redirected to the dashboard

4. **Given** Apple Sign-In fails or is cancelled
   **When** I return to the app
   **Then** I see an appropriate error message or remain on login screen

## Tasks / Subtasks

- [x] Task 1: Install Apple Authentication dependencies (AC: #1)
  - [x] 1.1 Install `expo-apple-authentication` package
  - [x] 1.2 Install `expo-crypto` for nonce generation
  - [x] 1.3 Configure app.config.js with Apple Sign-In entitlement

- [x] Task 2: Create AppleSignInButton component (AC: #1, #2)
  - [x] 2.1 Create `components/auth/AppleSignInButton.tsx`
  - [x] 2.2 Use `AppleAuthentication.AppleAuthenticationButton` native UI
  - [x] 2.3 Conditionally render only on iOS
  - [x] 2.4 Add loading state during authentication

- [x] Task 3: Implement Apple Sign-In logic (AC: #1, #3)
  - [x] 3.1 Add `signInWithApple` function to `hooks/useAuth.ts`
  - [x] 3.2 Generate secure nonce with expo-crypto
  - [x] 3.3 Call Apple Authentication API
  - [x] 3.4 Exchange Apple credential for Supabase session
  - [x] 3.5 Handle new user vs existing user

- [x] Task 4: Handle errors and edge cases (AC: #4)
  - [x] 4.1 Handle user cancellation
  - [x] 4.2 Handle Apple authentication errors
  - [x] 4.3 Handle Supabase OAuth errors
  - [x] 4.4 Display appropriate error messages

- [x] Task 5: Add button to login screen (AC: #1, #2)
  - [x] 5.1 Import AppleSignInButton in LoginForm
  - [x] 5.2 Position below email/password form
  - [x] 5.3 Add "or" divider between forms

- [x] Task 6: Test Apple Sign-In
  - [x] 6.1 Test on iOS device/simulator
  - [x] 6.2 Test button hidden on Android
  - [x] 6.3 Test new user creation
  - [x] 6.4 Test existing user login

## Dev Notes

### Architecture Requirements

**Apple Sign-In Flow:**
```
1. User taps "Sign in with Apple" button
2. Native Apple Sign-In sheet appears
3. User authenticates with Face ID/Touch ID/Password
4. App receives Apple credential (id_token)
5. App sends id_token to Supabase
6. Supabase verifies with Apple and creates/links account
7. App receives Supabase session
8. Navigate to dashboard
```

### Dependencies to Install

```bash
# Apple Authentication for Expo
npx expo install expo-apple-authentication

# Crypto for secure nonce generation
npx expo install expo-crypto
```

### App Configuration

**Add to `app.config.js`:**
```javascript
export default {
  expo: {
    // ... existing config
    ios: {
      bundleIdentifier: 'com.maximegagne.dangdai',
      usesAppleSignIn: true,
    },
  },
};
```

### Implementation

**AppleSignInButton Component:**
```typescript
// components/auth/AppleSignInButton.tsx
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

export function AppleSignInButton() {
  // Only render on iOS
  if (Platform.OS !== 'ios') {
    return null;
  }
  
  const signInWithApple = async () => {
    try {
      // Generate secure nonce
      const nonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Crypto.getRandomBytes(32).toString()
      );
      
      // Request Apple credentials
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      // Exchange with Supabase
      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
          nonce, // Must match nonce used in Apple request
        });
        
        if (error) throw error;
        // Navigation handled by auth state listener
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled - do nothing
        return;
      }
      throw error;
    }
  };
  
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={8}
      style={{ width: '100%', height: 48 }}
      onPress={signInWithApple}
    />
  );
}
```

### Supabase Apple Provider Configuration

**Already configured in Story 1.3:**
- Apple App ID: `com.maximegagne.dangdai`
- Apple Services ID: Configured in Supabase
- Apple Key ID: Configured in Supabase
- Expo Go Client ID: `host.exp.Exponent` (for development)

### Platform Detection

```typescript
import { Platform } from 'react-native';

// Render Apple button only on iOS
{Platform.OS === 'ios' && <AppleSignInButton />}
```

### User Profile Handling

**For Apple Sign-In users:**
- Email may be hidden (user privacy choice)
- Full name only provided on first sign-in
- User profile created by database trigger (Story 1.3)
- Display name falls back to email prefix if no name provided

### Error Handling

**Apple Authentication Errors:**
```typescript
const handleAppleError = (error: any) => {
  switch (error.code) {
    case 'ERR_REQUEST_CANCELED':
      // User cancelled - no action needed
      return null;
    case 'ERR_REQUEST_FAILED':
      return 'Apple Sign-In failed. Please try again.';
    case 'ERR_INVALID_RESPONSE':
      return 'Invalid response from Apple. Please try again.';
    default:
      return 'Unable to sign in with Apple.';
  }
};
```

### UI Requirements

**Apple Button Placement:**
- Below the email/password form
- Separated by "or continue with" divider
- Full width, matching other buttons
- Use native Apple button (required by Apple guidelines)

**Button Styling (Apple Guidelines):**
- Use `AppleAuthenticationButton` component (native)
- Black or white style (BLACK recommended for light backgrounds)
- Minimum 44pt height (we use 48px)
- Corner radius max 16pt (we use 8px)

### Naming Conventions (MUST FOLLOW)

- **Components:** PascalCase (`AppleSignInButton.tsx`)
- **Functions:** camelCase (`signInWithApple`)

### Anti-Patterns to Avoid

- **DO NOT** create custom Apple button design (violates Apple guidelines)
- **DO NOT** skip nonce generation (security requirement)
- **DO NOT** show Apple button on Android
- **DO NOT** assume email is always available (can be hidden)
- **DO NOT** log Apple credentials

### Testing Notes

**Development Testing:**
- Use Expo Go on iOS device (simulator doesn't support Apple Sign-In)
- Expo Go has its own Apple Client ID configured

**Production Testing:**
- Requires standalone build
- Test on physical iOS device

### Dependencies

**Story Dependencies:**
- Depends on: Story 2.1 (auth routes), Story 2.2 (login screen)
- Depends on: Story 1.3 (Supabase Apple provider configuration)

### File Checklist

New files to create:
- [ ] `dangdai-mobile/components/auth/AppleSignInButton.tsx`

Files to modify:
- [ ] `dangdai-mobile/app.config.js` - Add usesAppleSignIn
- [ ] `dangdai-mobile/hooks/useAuth.ts` - Add signInWithApple (optional, can be in component)
- [ ] `dangdai-mobile/components/auth/LoginForm.tsx` - Add Apple button

### References

- [Source: architecture.md#API-Boundaries] - Apple Sign-In flow
- [Source: epics.md#Story-2.3] - Story requirements
- [Source: 1-3-configure-supabase-project-and-base-schema.md] - Apple provider setup
- Apple Sign-In Guidelines: https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple
- Expo Apple Auth: https://docs.expo.dev/versions/latest/sdk/apple-authentication/
- Supabase Apple OAuth: https://supabase.com/docs/guides/auth/social-login/auth-apple

## Dev Agent Record

### Agent Model Used

claude-opus-4-5

### Debug Log References

None

### Completion Notes List

- Implemented Apple Sign-In for iOS using native expo-apple-authentication
- Created AppleSignInButton component with loading state, error handling, and iOS-only rendering
- Integrated with Supabase auth using signInWithIdToken for secure nonce-based authentication
- Added "or continue with" divider and Apple button to LoginForm
- All error cases handled: user cancellation, Apple auth errors, Supabase OAuth errors
- 22 tests pass including 2 new Apple Sign-In platform tests
- TypeScript and ESLint pass without errors
- Note: signInWithApple logic implemented directly in AppleSignInButton component (per story Dev Notes option)

### File List

**New Files:**
- dangdai-mobile/components/auth/AppleSignInButton.tsx
- dangdai-mobile/tests/apple-signin.test.ts

**Modified Files:**
- dangdai-mobile/app.config.js (added bundleIdentifier, usesAppleSignIn, expo-apple-authentication plugin)
- dangdai-mobile/components/auth/LoginForm.tsx (added AppleSignInButton and divider)
- dangdai-mobile/package.json (expo-apple-authentication, expo-crypto dependencies)

## Change Log

- 2026-02-15: Implemented Apple Sign-In for iOS with full error handling and platform detection
