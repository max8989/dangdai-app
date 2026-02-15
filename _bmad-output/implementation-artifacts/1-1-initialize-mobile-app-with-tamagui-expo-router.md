# Story 1.1: Initialize Mobile App with Tamagui Expo Router

Status: done

## Story

As a developer,
I want to scaffold the mobile app using the Tamagui Expo Router template,
So that I have a working foundation with routing, theming, and TypeScript configured.

## Acceptance Criteria

1. **Given** the project repository exists
   **When** I run `yarn create tamagui@latest --template expo-router`
   **Then** a new Expo app is created with Tamagui configured

2. **Given** the app is scaffolded
   **When** I run the app on iOS simulator and Android emulator
   **Then** the app runs successfully on both platforms without errors

3. **Given** the app is running
   **When** I navigate between screens
   **Then** file-based routing is functional via Expo Router

4. **Given** the project is created
   **When** I check TypeScript configuration
   **Then** TypeScript strict mode is enabled in `tsconfig.json`

## Tasks / Subtasks

- [x] Task 1: Scaffold the mobile app (AC: #1)
  - [x] 1.1 Ensure Yarn 4.4.0+ is available (required by create tamagui)
  - [x] 1.2 Run `yarn create tamagui@latest --template expo-router` in project root
  - [x] 1.3 Verify project structure matches expected Tamagui Expo Router template
  - [x] 1.4 Verify `tamagui.config.ts` exists with proper configuration

- [x] Task 2: Verify iOS simulator works (AC: #2) **[MANUAL TEST CONFIRMED]**
  - [x] 2.1 Run `yarn ios` to start iOS simulator
  - [x] 2.2 Verify app launches to home screen without errors
  - [x] 2.3 Verify Tamagui theming is applied (default theme visible)

- [x] Task 3: Verify Android emulator works (AC: #2) **[MANUAL TEST CONFIRMED]**
  - [x] 3.1 Run `yarn android` to start Android emulator
  - [x] 3.2 Verify app launches to home screen without errors
  - [x] 3.3 Verify Tamagui theming is applied (default theme visible)

- [x] Task 4: Verify file-based routing (AC: #3) **[MANUAL TEST CONFIRMED]**
  - [x] 4.1 Navigate to different screens using tab navigation
  - [x] 4.2 Verify routes match `app/` directory structure
  - [x] 4.3 Confirm `Stack` navigation works within the app

- [x] Task 5: Enable TypeScript strict mode (AC: #4)
  - [x] 5.1 Open `tsconfig.json`
  - [x] 5.2 Ensure `"strict": true` is set in compiler options
  - [x] 5.3 Run `yarn tsc --noEmit` to verify no type errors

- [x] Task 6: Clean up template and verify structure
  - [x] 6.1 Remove any unnecessary template demo code
  - [x] 6.2 Verify project structure aligns with architecture specification
  - [x] 6.3 Ensure `.gitignore` includes node_modules, .expo, etc.

## Dev Notes

### Critical Architecture Requirements

**Initialization Command:**
```bash
yarn create tamagui@latest --template expo-router
```

**Prerequisites:**
- Yarn 4.4.0 or greater is REQUIRED by the create-tamagui template
- Node.js LTS (20.x recommended)
- Xcode (for iOS simulator)
- Android Studio (for Android emulator)

### Expected Project Structure (from Architecture)

After scaffolding, the project should have this structure. The template provides most of this; you'll need to organize as you build out features:

```
dangdai-app/                     # or whatever name used during create
├── README.md
├── package.json
├── tsconfig.json               # Ensure strict: true
├── app.json                    # Expo config
├── tamagui.config.ts           # Tamagui theme configuration
├── metro.config.js             # Metro bundler with @tamagui/metro-plugin
├── babel.config.js
├── .gitignore
│
├── app/                        # Expo Router (file-based routing)
│   ├── _layout.tsx             # Root layout (TamaguiProvider, auth check)
│   ├── +not-found.tsx          # 404 screen
│   │
│   ├── (tabs)/                 # Tab navigator group
│   │   ├── _layout.tsx         # Tab bar configuration
│   │   ├── index.tsx           # Home/Dashboard
│   │   └── ...other tabs
│   │
│   └── modal.tsx               # Modal screen (template default)
│
├── components/                 # Shared components
│   └── ...
│
└── assets/                     # Images, fonts, sounds
    └── ...
```

### Tamagui Configuration

The template creates `tamagui.config.ts` which should look like:

```typescript
import { defaultConfig } from '@tamagui/config/v5'
import { createTamagui } from 'tamagui'

export const config = createTamagui(defaultConfig)

export default config

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
```

### Root Layout Pattern

The `app/_layout.tsx` should wrap the app with TamaguiProvider:

```typescript
import '../tamagui-web.css'

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native'
import { TamaguiProvider } from 'tamagui'

import { tamaguiConfig } from '../tamagui.config'

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme!}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </TamaguiProvider>
  )
}
```

### TypeScript Configuration

Ensure `tsconfig.json` has strict mode enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    // ... other options from template
  }
}
```

### Naming Conventions (MUST FOLLOW)

From Architecture specification:
- **Components:** PascalCase file & export (e.g., `QuizCard.tsx`)
- **Hooks:** camelCase with `use` prefix (e.g., `useQuizState.ts`)
- **Utilities:** camelCase (e.g., `formatDate.ts`)
- **Types/Interfaces:** PascalCase (e.g., `Quiz`, `UserProgress`)
- **Constants:** SCREAMING_SNAKE_CASE (e.g., `MAX_QUIZ_QUESTIONS`)
- **Zustand stores:** `use[Name]Store` (e.g., `useQuizStore`)

### Project Structure Notes

**Alignment with Architecture:**
- The Tamagui Expo Router template provides the core `app/` directory structure
- `components/`, `hooks/`, `stores/`, `lib/`, `types/` directories will be added in subsequent stories
- The template's default structure should be preserved; only add to it

**Files to Keep from Template:**
- `tamagui.config.ts` - Core theming configuration
- `metro.config.js` - Required for Tamagui compilation
- `babel.config.js` - Required for Tamagui
- `app/_layout.tsx` - Root layout with providers
- `app/(tabs)/_layout.tsx` - Tab navigation setup

**Files to Remove/Clean:**
- Demo-specific content in tab screens (replace with placeholder)
- Unnecessary example components (keep structure, clear content)

### Anti-Patterns to Avoid

- **DO NOT** use a different Expo template - MUST use `--template expo-router`
- **DO NOT** skip TypeScript strict mode configuration
- **DO NOT** modify the Tamagui config structure (extend, don't replace)
- **DO NOT** use npm instead of yarn (template requires yarn 4.4.0+)
- **DO NOT** rename the `app/` directory (Expo Router convention)

### Verification Commands

```bash
# After scaffolding, verify:
yarn install          # Install dependencies
yarn ios              # Test on iOS simulator
yarn android          # Test on Android emulator
yarn tsc --noEmit     # Verify TypeScript compiles
```

### References

- [Source: architecture.md#Starter-Template-Evaluation] - Template selection rationale
- [Source: architecture.md#Selected-Starters] - Initialization command and configuration
- [Source: architecture.md#Project-Structure-Boundaries] - Complete directory structure
- [Source: architecture.md#Implementation-Patterns] - Naming conventions
- [Source: epics.md#Story-1.1] - Story requirements and acceptance criteria

### External Documentation

- Tamagui Expo Guide: https://tamagui.dev/docs/guides/expo
- Expo Router Documentation: https://docs.expo.dev/router/introduction/
- Tamagui Create App: https://tamagui.dev/docs/guides/create-tamagui-app

## Dev Agent Record

### Agent Model Used

claude-opus-4-5 (anthropic/claude-opus-4-5)

### Debug Log References

- The `yarn create tamagui@latest` command failed due to git clone issues - worked around by manually cloning the tamagui repo and copying the expo-router starter template
- Fixed workspace:* dependencies in package.json to use npm versions (^1.121.10)
- Added missing peer dependencies: expo-constants, @types/node

### Completion Notes List

- **Task 1 Complete:** Scaffolded mobile app in `dangdai-mobile/` directory using Tamagui Expo Router template
- **Task 5 Complete:** TypeScript strict mode confirmed enabled in tsconfig.json, `yarn tsc --noEmit` passes
- **Task 6 Complete:** Cleaned up demo content, replaced with placeholder screens, verified .gitignore

**HALTED:** Tasks 2, 3, and 4 require manual verification on iOS simulator and Android emulator

### Implementation Plan

1. Enabled Yarn 4.7.0 via corepack
2. Cloned tamagui repo and copied expo-router starter template
3. Fixed package.json dependencies for standalone use (replaced workspace:* with npm versions)
4. Installed dependencies with yarn
5. Verified TypeScript strict mode enabled
6. Cleaned up demo code in tab screens and modal
7. Verified project structure matches architecture specification

### File List

**New Files:**
- dangdai-mobile/package.json
- dangdai-mobile/tsconfig.json
- dangdai-mobile/tsconfig.base.json
- dangdai-mobile/tamagui.config.ts
- dangdai-mobile/babel.config.js
- dangdai-mobile/metro.config.js
- dangdai-mobile/app.json
- dangdai-mobile/.gitignore
- dangdai-mobile/README.md
- dangdai-mobile/app/_layout.tsx
- dangdai-mobile/app/modal.tsx
- dangdai-mobile/app/+not-found.tsx
- dangdai-mobile/app/+html.tsx
- dangdai-mobile/app/(tabs)/_layout.tsx
- dangdai-mobile/app/(tabs)/index.tsx
- dangdai-mobile/app/(tabs)/two.tsx
- dangdai-mobile/components/Provider.tsx
- dangdai-mobile/components/CurrentToast.tsx
- dangdai-mobile/tamagui.build.ts
- dangdai-mobile/tamagui.generated.css
- dangdai-mobile/tamagui-web.css
- dangdai-mobile/playwright.config.ts
- dangdai-mobile/tests/export.test.ts
- dangdai-mobile/assets/ (directory with images)
- dangdai-mobile/yarn.lock

## Senior Developer Review (AI)

**Review Date:** 2026-02-15
**Reviewer:** Claude (claude-opus-4-5)
**Outcome:** Changes Applied

### Issues Found & Fixed

| Severity | Issue | Status |
|----------|-------|--------|
| HIGH | app.json used template defaults "expo-router-example" | FIXED |
| MEDIUM | Dev Notes showed v4, actual config uses v5 | FIXED (Dev Notes updated) |
| MEDIUM | Test file expected wrong heading text "Tamagui + Expo" | FIXED |
| MEDIUM | File List included gitignored Yarn PnP files | FIXED |
| LOW | +not-found.tsx used StyleSheet instead of Tamagui | FIXED |
| LOW | ToastControl component was unused dead code | FIXED (removed) |

### Architecture Updates

- Updated architecture.md to use `dangdai-mobile/` as the mobile app directory name (was `dangdai-app/`)
- Kept Tamagui config v5 (architecture aligned)

### Files Modified During Review

- dangdai-mobile/app.json (name/slug fixed)
- dangdai-mobile/tests/export.test.ts (heading text fixed)
- dangdai-mobile/app/+not-found.tsx (converted to Tamagui)
- dangdai-mobile/components/CurrentToast.tsx (removed unused ToastControl)
- _bmad-output/planning-artifacts/architecture.md (directory name updated)
- _bmad-output/implementation-artifacts/1-1-initialize-mobile-app-with-tamagui-expo-router.md (Dev Notes & File List fixed)

### Remaining Items

None - all tasks completed and manually verified.
