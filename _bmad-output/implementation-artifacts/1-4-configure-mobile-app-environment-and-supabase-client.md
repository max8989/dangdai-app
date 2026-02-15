# Story 1.4: Configure Mobile App Environment and Supabase Client

Status: ready-for-dev

## Story

As a developer,
I want to configure environment variables and the Supabase client in the mobile app,
So that the app can communicate with Supabase for auth and data.

## Acceptance Criteria

1. **Given** the mobile app scaffold exists
   **When** I configure `.env.local` with Supabase credentials
   **Then** environment variables are properly loaded

2. **Given** environment variables are configured
   **When** I initialize the Supabase client
   **Then** the Supabase JS client is initialized in `lib/supabase.ts`

3. **Given** the Supabase client is configured
   **When** I access environment variables
   **Then** they are accessible via `expo-constants`

4. **Given** the app is running
   **When** I test the Supabase connection
   **Then** the app successfully connects to Supabase (verified via console log)

## Tasks / Subtasks

- [ ] Task 1: Set up environment variables (AC: #1)
  - [ ] 1.1 Create `.env.local` file in mobile app root
  - [ ] 1.2 Add Supabase URL and anon key
  - [ ] 1.3 Create `.env.example` as template (without real values)
  - [ ] 1.4 Verify `.gitignore` excludes `.env.local`

- [ ] Task 2: Configure expo-constants (AC: #3)
  - [ ] 2.1 Install expo-constants if not present
  - [ ] 2.2 Update `app.json` or `app.config.js` for environment variable exposure
  - [ ] 2.3 Verify EXPO_PUBLIC_ prefix variables are accessible

- [ ] Task 3: Create Supabase client (AC: #2)
  - [ ] 3.1 Install @supabase/supabase-js
  - [ ] 3.2 Create `lib/supabase.ts` with client initialization
  - [ ] 3.3 Configure AsyncStorage for session persistence
  - [ ] 3.4 Export typed Supabase client

- [ ] Task 4: Create lib directory structure (AC: #2)
  - [ ] 4.1 Create `lib/` directory if not exists
  - [ ] 4.2 Create placeholder for `lib/api.ts` (Python backend client)
  - [ ] 4.3 Create placeholder for `lib/queryKeys.ts`
  - [ ] 4.4 Create placeholder for `lib/queryClient.ts`

- [ ] Task 5: Test Supabase connection (AC: #4)
  - [ ] 5.1 Add connection test in app startup
  - [ ] 5.2 Log successful connection to console
  - [ ] 5.3 Handle connection errors gracefully
  - [ ] 5.4 Remove test code after verification (or make conditional on DEBUG)

## Dev Notes

### Critical Architecture Requirements

**Environment Variable Naming:**
- Expo requires `EXPO_PUBLIC_` prefix for client-accessible variables
- Never expose sensitive keys (service role) to client

### Environment Variables Setup

**Create `.env.local`:**
```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Python Backend API (for later stories)
EXPO_PUBLIC_API_URL=http://localhost:8000
```

**Create `.env.example`:**
```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Python Backend API
EXPO_PUBLIC_API_URL=http://localhost:8000
```

### Supabase Client Implementation

**Create `lib/supabase.ts`:**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for React Native
  },
});

// Type exports for database (will be generated later)
export type { Database } from '../types/supabase';
```

### Required Dependencies

Install these packages:

```bash
# Supabase client
yarn add @supabase/supabase-js

# AsyncStorage for session persistence (React Native)
yarn add @react-native-async-storage/async-storage

# Expo constants (usually already installed with Expo)
yarn add expo-constants
```

### App Config for Environment Variables

If using `app.config.js` (recommended for dynamic config):

```javascript
// app.config.js
export default {
  expo: {
    name: "dangdai-app",
    slug: "dangdai-app",
    // ... other config
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
    },
  },
};
```

Alternative access via Constants:

```typescript
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
```

### Connection Test Implementation

**Add to `app/_layout.tsx` for testing (temporary):**

```typescript
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  useEffect(() => {
    // Test Supabase connection (remove after verification)
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('users').select('count');
        if (error) {
          console.log('Supabase connection test - Error:', error.message);
        } else {
          console.log('Supabase connection test - Success!');
        }
      } catch (err) {
        console.log('Supabase connection test - Exception:', err);
      }
    };
    
    if (__DEV__) {
      testConnection();
    }
  }, []);

  // ... rest of layout
}
```

### Project Structure After This Story

```
dangdai-app/
├── .env.local                    # Real environment variables (gitignored)
├── .env.example                  # Template for environment variables
├── app.config.js                 # Expo config with env var exposure
│
├── lib/
│   ├── supabase.ts              # Supabase client initialization
│   ├── api.ts                   # Placeholder for Python backend client
│   ├── queryKeys.ts             # Placeholder for TanStack Query keys
│   └── queryClient.ts           # Placeholder for QueryClient config
│
├── types/
│   └── supabase.ts              # Placeholder for generated types
│
└── ... (existing structure)
```

### Naming Conventions (MUST FOLLOW)

From Architecture specification:
- **Utilities:** camelCase (`supabase.ts`, `formatDate.ts`)
- **Types:** PascalCase (`Database`, `User`)
- **Environment variables:** SCREAMING_SNAKE_CASE with `EXPO_PUBLIC_` prefix

### Security Considerations

**NEVER do these:**
- Commit `.env.local` with real credentials
- Use service role key in mobile app
- Log sensitive credentials
- Expose API keys in error messages

**ALWAYS do these:**
- Use anon key for client-side operations
- Store sessions securely via AsyncStorage
- Validate environment variables exist at startup
- Use RLS policies (configured in Story 1-3)

### Expo Environment Variable Behavior

| Variable Prefix | Accessible In | Use Case |
|-----------------|---------------|----------|
| `EXPO_PUBLIC_` | Client code | Supabase URL, anon key |
| No prefix | Build time only | Secrets for EAS Build |

### AsyncStorage Configuration

AsyncStorage is required for React Native session persistence:

```typescript
// The Supabase client uses AsyncStorage for:
// - Storing refresh tokens
// - Persisting user sessions across app restarts
// - Managing auth state

// This is configured in the client options:
auth: {
  storage: AsyncStorage,
  persistSession: true,
}
```

### Anti-Patterns to Avoid

- **DO NOT** hardcode Supabase credentials in source code
- **DO NOT** use `supabase-js` v1 syntax (use v2+)
- **DO NOT** skip AsyncStorage configuration (sessions won't persist)
- **DO NOT** set `detectSessionInUrl: true` in React Native
- **DO NOT** create multiple Supabase client instances
- **DO NOT** commit `.env.local` to git

### Verification Commands

```bash
# Verify environment variables are loaded
yarn start
# Check console for "Supabase connection test - Success!"

# Verify dependencies installed
yarn list @supabase/supabase-js
yarn list @react-native-async-storage/async-storage
```

### Dependencies from Epic 1

- **Depends on:** Story 1-1 (mobile app scaffold), Story 1-3 (Supabase configured)
- **Blocks:** Story 1-5 (state management needs client for data fetching)

### References

- [Source: architecture.md#Mobile-App-Organization] - lib/ directory structure
- [Source: architecture.md#API-Boundaries] - Mobile → Supabase communication
- [Source: architecture.md#Development-Workflow-Integration] - Environment files
- [Source: epics.md#Story-1.4] - Story requirements

### External Documentation

- Supabase JS v2: https://supabase.com/docs/reference/javascript/introduction
- Supabase React Native: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
- Expo Environment Variables: https://docs.expo.dev/guides/environment-variables/

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
