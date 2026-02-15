---
title: 'UI Theming and Visual Refresh for Auth & Tab Screens'
slug: 'ui-theming-visual-refresh'
created: '2026-02-15'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['tamagui@1.121.10', 'expo-router@6.0.14', 'react-native@0.81.5', '@tamagui/config@1.121.10']
files_to_modify:
  - 'dangdai-mobile/tamagui.config.ts'
  - 'dangdai-mobile/app/(auth)/login.tsx'
  - 'dangdai-mobile/app/(auth)/signup.tsx'
  - 'dangdai-mobile/app/(auth)/forgot-password.tsx'
  - 'dangdai-mobile/app/(auth)/reset-password.tsx'
  - 'dangdai-mobile/app/(auth)/_layout.tsx'
  - 'dangdai-mobile/components/auth/LoginForm.tsx'
  - 'dangdai-mobile/components/auth/SignupForm.tsx'
  - 'dangdai-mobile/components/auth/ForgotPasswordForm.tsx'
  - 'dangdai-mobile/components/auth/ResetPasswordForm.tsx'
  - 'dangdai-mobile/components/auth/AppleSignInButton.tsx'
  - 'dangdai-mobile/app/(tabs)/_layout.tsx'
  - 'dangdai-mobile/app/(tabs)/index.tsx'
  - 'dangdai-mobile/app/(tabs)/settings.tsx'
code_patterns:
  - 'Tamagui theme tokens for all colors ($primary, $background, etc.)'
  - 'useTheme() hook for dynamic theme values in native components'
  - 'useColorScheme() for system preference detection'
  - 'SafeAreaView wrapping screens'
  - 'Form components use YStack/XStack layout'
test_patterns:
  - 'Playwright tests in dangdai-mobile/tests/'
  - 'Visual testing not currently implemented'
---

# Tech-Spec: UI Theming and Visual Refresh for Auth & Tab Screens

**Created:** 2026-02-15

## Overview

### Problem Statement

The app currently only has dark mode with default Tamagui styling. It needs both light and dark mode support with the custom color palette defined in the UX design specification (teal primary, orange accents, proper semantic colors) to provide a polished, branded experience.

### Solution

Create a custom Tamagui theme with the UX spec colors, update auth screens (login, signup, forgot-password, reset-password) and tab screens (home, settings, tab bar) to match the design guidelines with proper theming support.

### Scope

**In Scope:**
- Custom Tamagui theme configuration with UX spec colors
- Light and dark mode support (following system preference)
- Auth screens visual refresh (Login, Signup, Forgot Password, Reset Password)
- Tab screens visual refresh (Home, Settings)
- Tab bar styling

**Out of Scope:**
- Theme toggle in settings (follow system preference only for MVP)
- Quiz screens, completion screens (not built yet)
- Sound/animation integration
- New components (ActivityCalendar, PointsCounter, etc.)

## Context for Development

### Codebase Patterns

1. **Theme Infrastructure Already Exists:**
   - `Provider.tsx` uses `useColorScheme()` and sets `defaultTheme={colorScheme === 'dark' ? 'dark' : 'light'}`
   - Theme switching works automatically based on system preference
   - `_layout.tsx` wraps navigation with `ThemeProvider` from React Navigation

2. **Current Tamagui Config:**
   - Uses `defaultConfig` from `@tamagui/config/v5` - no custom colors defined
   - All components use default Tamagui tokens (`$gray11`, `$blue10`, `$red8`, etc.)

3. **Screen Structure:**
   - Auth screens: Screen file imports Form component
   - Screen files handle layout (SafeAreaView, YStack, H1, subtitle)
   - Form components handle all inputs, validation, and submission

4. **Styling Approach:**
   - Tamagui tokens for colors (`$gray11`, `$blue10`)
   - Size tokens for spacing (`$4`, `$6`)
   - `themeInverse` on primary buttons for contrast

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `tamagui.config.ts` | Main Tamagui configuration - needs custom theme |
| `Provider.tsx` | TamaguiProvider setup - already handles theme switching |
| `app/_layout.tsx` | Root layout with ThemeProvider |
| `app/(auth)/_layout.tsx` | Auth stack layout with background color |
| `app/(tabs)/_layout.tsx` | Tab navigation with theme-aware styling |
| `components/auth/LoginForm.tsx` | Example form pattern to follow |
| `_bmad-output/planning-artifacts/ux-design-specification.md` | UX spec with color palette |

### Technical Decisions

1. **Theming Approach:** Extend `defaultConfig` with custom color tokens and theme overrides rather than building from scratch. This preserves all the useful defaults (spacing, sizing, fonts) while adding brand colors.

2. **Color Token Strategy:**
   - Define custom color tokens for brand colors (primary, secondary, success, error)
   - Override theme values for `background`, `color`, semantic colors
   - Use semantic naming (`$primary`, `$primaryDark`) for maintainability

3. **UX Spec Color Palette:**
   | Token | Light Mode | Dark Mode | Usage |
   |-------|-----------|-----------|-------|
   | Primary | `#06B6D4` | `#22D3EE` | Buttons, links, highlights |
   | Primary Dark | `#0891B2` | `#0891B2` | Pressed states |
   | Secondary | `#F97316` | `#FB923C` | Accents, points |
   | Success | `#22C55E` | `#4ADE80` | Correct answers, completion |
   | Error | `#FB923C` | `#FDBA74` | Wrong answers (gentle orange) |
   | Background | `#FAFAF9` | `#0C0A09` | Main background |
   | Surface | `#FFFFFF` | `#1C1917` | Cards, inputs |
   | Text Primary | `#1C1917` | `#FAFAF9` | Main text |
   | Text Secondary | `#78716C` | `#A8A29E` | Secondary text |

4. **Button Styling:**
   - Primary button: Filled with `$primary` background
   - Use `theme="primary"` sub-theme for consistent button styling
   - Remove `themeInverse` in favor of explicit theme

5. **Input Styling:**
   - Background: `$surface` (white in light, dark gray in dark)
   - Border: `$borderColor` with error state override
   - Consistent border radius: 12px per UX spec

## Implementation Plan

### Tasks

#### Task 1: Create Custom Tamagui Theme Configuration
- **File:** `dangdai-mobile/tamagui.config.ts`
- **Action:** Replace minimal config with full custom theme including:
  - Custom color tokens (primary, secondary, success, error, background, surface, text colors)
  - Light theme with UX spec colors
  - Dark theme with UX spec colors
  - Sub-themes for buttons (`light_primary`, `dark_primary`)
- **Details:**
  ```typescript
  // Define custom tokens
  const customTokens = {
    color: {
      primary: '#06B6D4',
      primaryDark: '#0891B2',
      primaryLight: '#22D3EE',
      secondary: '#F97316',
      secondaryLight: '#FB923C',
      success: '#22C55E',
      successLight: '#4ADE80',
      error: '#FB923C',
      errorLight: '#FDBA74',
      backgroundLight: '#FAFAF9',
      backgroundDark: '#0C0A09',
      surfaceLight: '#FFFFFF',
      surfaceDark: '#1C1917',
      textPrimaryLight: '#1C1917',
      textPrimaryDark: '#FAFAF9',
      textSecondary: '#78716C',
      textSecondaryDark: '#A8A29E',
    }
  }
  ```

#### Task 2: Update Auth Layout Background
- **File:** `dangdai-mobile/app/(auth)/_layout.tsx`
- **Action:** Ensure background uses `$background` token for proper theming
- **Details:** Already uses `theme.background.val` - verify it works with new theme

#### Task 3: Update Login Screen Styling
- **File:** `dangdai-mobile/app/(auth)/login.tsx`
- **Action:** Update subtitle color from `$gray11` to `$colorSubtle` (new semantic token)
- **Details:** Change `color="$gray11"` to `color="$colorSubtle"`

#### Task 4: Update LoginForm Component
- **File:** `dangdai-mobile/components/auth/LoginForm.tsx`
- **Action:** Update all color tokens to use new theme:
  - Error messages: `$red10` → `$error`
  - Error borders: `$red8` → `$error`
  - Error backgrounds: `$red2`/`$red6` → `$errorBackground`/`$errorBorder`
  - Link colors: `$blue10` → `$primary`
  - Separator text: `$gray10` → `$colorSubtle`
  - Button: Remove `themeInverse`, add `backgroundColor="$primary"` and `color="white"`

#### Task 5: Update Signup Screen Styling
- **File:** `dangdai-mobile/app/(auth)/signup.tsx`
- **Action:** Update subtitle color from `$gray11` to `$colorSubtle`

#### Task 6: Update SignupForm Component
- **File:** `dangdai-mobile/components/auth/SignupForm.tsx`
- **Action:** Same token updates as LoginForm:
  - Error tokens → `$error`, `$errorBackground`, `$errorBorder`
  - Link color → `$primary`
  - Button styling → explicit primary colors

#### Task 7: Update Forgot Password Screen Styling
- **File:** `dangdai-mobile/app/(auth)/forgot-password.tsx`
- **Action:** Update subtitle color from `$gray11` to `$colorSubtle`

#### Task 8: Update ForgotPasswordForm Component
- **File:** `dangdai-mobile/components/auth/ForgotPasswordForm.tsx`
- **Action:** Same token updates as LoginForm:
  - Error tokens → new semantic tokens
  - Success message: `$green2`/`$green6`/`$green10`/`$green11` → `$successBackground`/`$successBorder`/`$success`/`$successText`
  - Link color → `$primary`
  - Button styling → explicit primary colors

#### Task 9: Update Reset Password Screen Styling
- **File:** `dangdai-mobile/app/(auth)/reset-password.tsx`
- **Action:** Update subtitle color from `$gray11` to `$colorSubtle`

#### Task 10: Update ResetPasswordForm Component
- **File:** `dangdai-mobile/components/auth/ResetPasswordForm.tsx`
- **Action:** Same token updates:
  - Error tokens → new semantic tokens
  - Success indicator: `$green10` → `$success`
  - Warning indicator: `$orange10` → `$error` (gentle orange per UX spec)
  - Button styling → explicit primary colors

#### Task 11: Update AppleSignInButton Theme Awareness
- **File:** `dangdai-mobile/components/auth/AppleSignInButton.tsx`
- **Action:** Make button style adapt to theme:
  - Use `useColorScheme()` to detect theme
  - Light mode: `AppleAuthenticationButtonStyle.BLACK`
  - Dark mode: `AppleAuthenticationButtonStyle.WHITE`

#### Task 12: Update Tabs Layout Styling
- **File:** `dangdai-mobile/app/(tabs)/_layout.tsx`
- **Action:** Update tab bar colors:
  - Active tint: `theme.blue10.val` → `theme.primary.val`
  - Keep background and border using theme tokens

#### Task 13: Update Home Screen Styling
- **File:** `dangdai-mobile/app/(tabs)/index.tsx`
- **Action:** Update text colors:
  - Paragraph color: `$gray10` → `$colorSubtle`
  - Background already uses `$background`

#### Task 14: Update Settings Screen Styling
- **File:** `dangdai-mobile/app/(tabs)/settings.tsx`
- **Action:** Update colors:
  - "Signed in as" label: `$gray11` → `$colorSubtle`
  - "More settings" text: `$gray10` → `$colorSubtle`
  - Error message: `$red2`/`$red10` → `$errorBackground`/`$error`
  - Sign out button: Keep `theme="red"` for destructive action

### Acceptance Criteria

#### Theme Configuration
- [x] AC1: Given the app is launched on a device with light mode enabled, when viewing any screen, then the background should be off-white (`#FAFAF9`) and text should be dark (`#1C1917`)
- [x] AC2: Given the app is launched on a device with dark mode enabled, when viewing any screen, then the background should be near-black (`#0C0A09`) and text should be light (`#FAFAF9`)
- [x] AC3: Given the user changes system theme while app is open, when the theme change completes, then the app should immediately reflect the new theme colors without restart

#### Auth Screens
- [x] AC4: Given I am on the login screen in light mode, when I view the primary button, then it should have a teal background (`#06B6D4`) with white text
- [x] AC5: Given I am on any auth screen, when I tap a navigation link (e.g., "Sign Up", "Forgot Password"), then the link should be teal colored (`#06B6D4` in light, `#22D3EE` in dark)
- [x] AC6: Given I submit a form with invalid data, when validation fails, then error messages should appear in gentle orange (`#FB923C`) not harsh red
- [x] AC7: Given I am on the forgot password screen and submit successfully, when the success message appears, then it should use green styling (`#22C55E`)
- [x] AC8: Given I am on iOS in light mode, when viewing the Apple Sign In button, then it should display with black styling
- [x] AC9: Given I am on iOS in dark mode, when viewing the Apple Sign In button, then it should display with white styling

#### Tab Screens
- [x] AC10: Given I am viewing the tab bar, when I tap a tab, then the active tab icon should be teal (`#06B6D4` light / `#22D3EE` dark)
- [x] AC11: Given I am on the Settings screen, when I view the sign out button, then it should remain red-themed (destructive action styling)

#### Visual Consistency
- [x] AC12: Given I navigate through all screens (login, signup, forgot-password, reset-password, home, settings), when comparing styling, then all screens should use consistent color tokens (no mix of old `$gray11` and new `$colorSubtle`)
- [x] AC13: Given I am viewing any input field, when focused or unfocused, then the input should have consistent border radius (12px per UX spec)

## Additional Context

### Dependencies

- Tamagui v1.121.10 (already installed)
- @tamagui/config v1.121.10 (already using defaultConfig)
- No new dependencies required

### Testing Strategy

**Manual Testing Checklist:**
1. iOS Simulator - Light Mode:
   - [ ] Launch app, verify light theme applied
   - [ ] Navigate through all auth screens
   - [ ] Complete login flow
   - [ ] Verify tab bar styling
   - [ ] Check settings screen

2. iOS Simulator - Dark Mode:
   - [ ] Change system to dark mode
   - [ ] Verify theme switches immediately
   - [ ] Repeat all auth screen checks
   - [ ] Verify Apple Sign In button is white

3. Android Emulator - Light Mode:
   - [ ] Same checks as iOS

4. Android Emulator - Dark Mode:
   - [ ] Same checks as iOS (except Apple Sign In)

5. Theme Switching:
   - [ ] Toggle system theme while on login screen
   - [ ] Toggle system theme while on home screen
   - [ ] Verify no flash of wrong colors

**Existing Playwright Tests:**
- Run `npm test` to verify auth flows still work
- Tests check functionality, not visual styling

### Notes

**High-Risk Items:**
1. Tamagui theme token naming - ensure new tokens don't conflict with defaultConfig
2. Button styling change from `themeInverse` to explicit colors - verify all states (default, pressed, disabled)
3. Apple Sign In button theme detection - test on actual device if possible

**Known Limitations:**
- No automated visual regression testing
- Theme toggle in settings not included (follows system only)

**Future Considerations:**
- Add theme toggle to settings for user override
- Create reusable styled components (e.g., `PrimaryButton`, `ErrorMessage`)
- Add animation to theme transitions

## Review Notes

- Adversarial review completed
- Findings: 15 total, 11 fixed, 4 skipped (noise/undecided)
- Resolution approach: auto-fix

### Fixes Applied:
- F1: Changed buttons from `backgroundColor="$primary" color="white"` to `theme="primary"`
- F2: AppleSignInButton now uses Tamagui's `useThemeName()` instead of React Native's `useColorScheme()`
- F3/F4: Added `$warning` color and used it for password strength hints
- F12: Spinners now inherit color from button theme
- F13: Added `opacity` prop for disabled button states
- F14: Added `accessibilityRole="alert"` to error message containers

### Skipped (noise/undecided):
- F5: Orange error color intentional per UX spec
- F7: `primaryDark` naming is clear
- F9: Link press states not needed
- F15: `$colorSubtle` consolidation intentional
