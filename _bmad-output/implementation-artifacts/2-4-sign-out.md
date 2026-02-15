# Story 2.4: Sign Out

Status: ready-for-dev

## Story

As a user,
I want to sign out of my account,
So that I can secure my account or switch to a different account.

## Acceptance Criteria

1. **Given** I am signed in and on the settings screen
   **When** I tap "Sign Out"
   **Then** I am signed out via Supabase Auth
   **And** I am redirected to the login screen
   **And** my session is cleared from the device

2. **Given** I have signed out
   **When** I close and reopen the app
   **Then** I am presented with the login screen
   **And** I am not automatically signed back in

3. **Given** I tap "Sign Out"
   **When** a confirmation dialog appears (optional UX enhancement)
   **Then** I can confirm or cancel the action

## Tasks / Subtasks

- [ ] Task 1: Create settings screen (AC: #1)
  - [ ] 1.1 Create `app/(tabs)/settings.tsx` screen
  - [ ] 1.2 Add settings screen to tab navigator
  - [ ] 1.3 Add settings icon to tab bar

- [ ] Task 2: Add sign out option to settings (AC: #1, #3)
  - [ ] 2.1 Add "Sign Out" button/list item
  - [ ] 2.2 Style as destructive action
  - [ ] 2.3 Optional: Add confirmation dialog

- [ ] Task 3: Implement sign out logic (AC: #1, #2)
  - [ ] 3.1 Add `signOut` function to `hooks/useAuth.ts`
  - [ ] 3.2 Call `supabase.auth.signOut()`
  - [ ] 3.3 Clear local state (Zustand stores)
  - [ ] 3.4 Clear TanStack Query cache
  - [ ] 3.5 Navigate to login screen

- [ ] Task 4: Verify session clearing (AC: #2)
  - [ ] 4.1 Test session removed from AsyncStorage
  - [ ] 4.2 Test app restart shows login

- [ ] Task 5: Test sign out flow
  - [ ] 5.1 Test sign out redirects to login
  - [ ] 5.2 Test app restart after sign out
  - [ ] 5.3 Test user data is cleared

## Dev Notes

### Architecture Requirements

**Settings Screen Location:**
```
app/
├── (tabs)/
│   ├── _layout.tsx           # Tab navigator
│   ├── index.tsx             # Dashboard
│   ├── books.tsx             # Book selection
│   ├── progress.tsx          # Progress view
│   └── settings.tsx          # This story
```

### Sign Out Implementation

**Sign Out Function:**
```typescript
// hooks/useAuth.ts
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { queryClient } from '../lib/queryClient';

const signOut = async () => {
  // Sign out from Supabase (clears session from AsyncStorage)
  await supabase.auth.signOut();
  
  // Clear TanStack Query cache
  queryClient.clear();
  
  // Clear Zustand stores (if any user-specific data)
  // useUserStore.getState().reset();
  // useSettingsStore.getState().reset();
  
  // Navigate to login
  router.replace('/(auth)/login');
};
```

### Settings Screen Structure

```typescript
// app/(tabs)/settings.tsx
import { YStack, XStack, Text, Button, Separator } from 'tamagui';
import { useAuth } from '../../hooks/useAuth';

export default function SettingsScreen() {
  const { signOut, user } = useAuth();
  
  return (
    <YStack flex={1} padding="$4">
      {/* User Info Section */}
      <YStack marginBottom="$4">
        <Text fontSize="$4" color="$gray11">Signed in as</Text>
        <Text fontSize="$5" fontWeight="600">{user?.email}</Text>
      </YStack>
      
      <Separator />
      
      {/* Settings Options */}
      <YStack gap="$3" marginTop="$4">
        {/* Language, Theme, Sound settings - Story 9.x */}
      </YStack>
      
      <YStack flex={1} />
      
      {/* Sign Out Button */}
      <Button
        theme="red"
        onPress={signOut}
        marginTop="$4"
      >
        Sign Out
      </Button>
    </YStack>
  );
}
```

### Tab Navigator Update

**Add Settings Tab:**
```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Settings } from '@tamagui/lucide-icons';

export default function TabLayout() {
  return (
    <Tabs>
      {/* ... existing tabs */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings color={color} />,
        }}
      />
    </Tabs>
  );
}
```

### State Clearing

**What to Clear on Sign Out:**

| State Type | Location | Clear Method |
|------------|----------|--------------|
| Supabase Session | AsyncStorage | `supabase.auth.signOut()` |
| Server State Cache | TanStack Query | `queryClient.clear()` |
| User Preferences | Zustand stores | `store.getState().reset()` |

**Note:** Some settings (theme, language) may persist across accounts. Design stores accordingly.

### UI Requirements

**Sign Out Button:**
- Located at bottom of settings screen
- Red/destructive theme
- Clear label: "Sign Out"
- Full width button

**Optional Confirmation:**
```typescript
import { Alert } from 'react-native';

const handleSignOut = () => {
  Alert.alert(
    'Sign Out',
    'Are you sure you want to sign out?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]
  );
};
```

### Naming Conventions (MUST FOLLOW)

- **Screen files:** lowercase (`settings.tsx`)
- **Functions:** camelCase (`signOut`)
- **Components:** PascalCase

### Anti-Patterns to Avoid

- **DO NOT** leave cached user data after sign out
- **DO NOT** sign out without clearing local state
- **DO NOT** use `router.push` (use `router.replace` to prevent back navigation)
- **DO NOT** clear settings that should persist (theme preference)

### Dependencies

**Existing Infrastructure:**
- `lib/supabase.ts` - Supabase client (Story 1.4)
- `lib/queryClient.ts` - TanStack Query client (Story 1.5)
- `hooks/useAuth.ts` - Auth hook (Story 2.1, 2.2)

**Story Dependencies:**
- Depends on: Story 2.1, 2.2 (auth hook), Story 1.5 (query client)
- Blocks: None

### File Checklist

New files to create:
- [ ] `dangdai-mobile/app/(tabs)/settings.tsx`

Files to modify:
- [ ] `dangdai-mobile/app/(tabs)/_layout.tsx` - Add settings tab
- [ ] `dangdai-mobile/hooks/useAuth.ts` - Add signOut function

### Testing Approach

```bash
# Manual testing steps:
1. Sign in to app
2. Navigate to settings tab
3. Verify user email is displayed
4. Tap "Sign Out"
5. Verify redirect to login screen
6. Close and reopen app
7. Verify login screen appears (not dashboard)
8. Verify cannot navigate back to dashboard
```

### References

- [Source: architecture.md#Mobile-App-Organization] - Tab structure
- [Source: architecture.md#State-Management] - Zustand store clearing
- [Source: epics.md#Story-2.4] - Story requirements

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
