# Story 1.1b: Configure Tamagui Theme, Sub-Themes & Animation Presets

Status: review

## Story

As a developer,
I want to configure the Tamagui theme system with semantic tokens, sub-themes, and animation presets,
So that all UI components have a consistent design foundation with light/dark mode, contextual color contexts, and standardized animations.

## Acceptance Criteria

1. **Theme Tokens** - Light and dark themes define the full Tamagui semantic token set (`background`, `backgroundHover`, `backgroundPress`, `backgroundFocus`, `backgroundStrong`, `color`, `colorHover`, `colorPress`, `borderColor`, `borderColorHover`, `borderColorFocus`, `placeholderColor`) plus custom tokens (`surface`, `colorSubtle`). Brand color tokens (`primary`, `primaryDark`, `primaryLight`, `secondary`, `success`, `error`, `warning`) and semantic color context tokens (`successBackground`, `successBorder`, `successText`, etc.) are defined.

2. **Sub-Themes** - `primary`, `success`, `error`, `warning` sub-themes exist for both `light_` and `dark_` parents. Wrapping a component in `<Theme name="success">` correctly remaps `$background`, `$color`, `$borderColor` to success context colors. A visual test/demo screen demonstrates all 4 sub-themes rendering in both light and dark mode.

3. **Animation Presets** - `@tamagui/animations-moti` is installed and configured as the animation driver. `react-native-reanimated` and `moti` peer dependencies are installed. 5 named animation presets defined in `createAnimations()`:
   - `quick`: `damping: 20, stiffness: 250, mass: 1.2`
   - `bouncy`: `damping: 10, stiffness: 200, mass: 0.9`
   - `medium`: `damping: 15, stiffness: 150, mass: 1.0`
   - `slow`: `damping: 20, stiffness: 60, mass: 1.2`
   - `lazy`: from defaultConfig
   A component using `animation="bouncy"` with `enterStyle={{ opacity: 0, scale: 0.5 }}` animates correctly on mount.

4. **Design Tokens** - Spacing scale (`xs=4, sm=8, md=16, lg=24, xl=32, 2xl=48`), border radius (`sm=8, md=12, full=9999`), and font families (body=Inter, heading=Inter via `createFont()`) are configured. Media queries `$xs`, `$sm`, `$gtXs` available from defaultConfig.

5. **Verification** - App renders with correct theme colors in both light and dark mode. `<Theme name="primary"><Button>Test</Button></Theme>` renders a teal-background button with white text. `AnimatePresence` with `enterStyle`/`exitStyle` correctly animates a test component in and out. No hardcoded hex values exist in any component file (only `$tokenName` references).

## Tasks / Subtasks

- [x] Task 1: Install animation dependencies (AC: #3)
  - [x] 1.1 Install `@tamagui/animations-moti` and `moti` packages
  - [x] 1.2 Verify `react-native-reanimated` already installed (from Story 1.1)
  - [x] 1.3 Verify babel.config.js has `react-native-reanimated/plugin` (add if missing)
  - [x] 1.4 Run `yarn install` and confirm no dependency conflicts

- [x] Task 2: Configure animation presets in tamagui.config.ts (AC: #3)
  - [x] 2.1 Import `createAnimations` from `@tamagui/animations-moti`
  - [x] 2.2 Define 5 named spring presets (`quick`, `bouncy`, `medium`, `slow`, `lazy`)
  - [x] 2.3 Pass `animations` to `createTamagui()` config
  - [x] 2.4 Verify TypeScript types resolve correctly

- [x] Task 3: Configure custom tokens (space, radius, fonts) (AC: #4)
  - [x] 3.1 Define custom spacing tokens (`xs=4, sm=8, md=16, lg=24, xl=32, 2xl=48`)
  - [x] 3.2 Define custom radius tokens (`sm=8, md=12, full=9999`)
  - [x] 3.3 Configure Inter font family using `createFont()` for body and heading
  - [x] 3.4 Verify media queries `$xs`, `$sm`, `$gtXs` from defaultConfig still available

- [x] Task 4: Add missing sub-themes (success, error, warning) (AC: #2)
  - [x] 4.1 Define `light_success` and `dark_success` sub-themes with correct token remapping
  - [x] 4.2 Define `light_error` and `dark_error` sub-themes
  - [x] 4.3 Define `light_warning` and `dark_warning` sub-themes
  - [x] 4.4 Verify existing `light_primary` and `dark_primary` still work correctly

- [x] Task 5: Create theme verification demo screen (AC: #2, #5)
  - [x] 5.1 Create `app/(tabs)/theme-demo.tsx` (temporary dev screen)
  - [x] 5.2 Render all 4 sub-themes with example Button/Card in both light/dark mode
  - [x] 5.3 Render animated component using `animation="bouncy"` + `enterStyle`
  - [x] 5.4 Render `AnimatePresence` toggle to test enter/exit animations
  - [x] 5.5 Verify `<Theme name="primary"><Button>Test</Button></Theme>` renders teal bg + white text

- [x] Task 6: Verify and clean up (AC: #1, #5)
  - [x] 6.1 Run `yarn tsc --noEmit` to confirm no type errors
  - [x] 6.2 Run linter to check for any issues
  - [x] 6.3 Grep all component files for hardcoded hex values (should be none)
  - [ ] 6.4 Test app launch on iOS simulator (manual verification)
  - [ ] 6.5 Test app launch on Android emulator (manual verification)

## Dev Notes

### Current State (from Story 1.1)

The `tamagui.config.ts` already has:
- Light and dark themes with full semantic token sets (background, color, borderColor, etc.)
- Custom tokens: `surface`, `colorSubtle`
- Brand colors: `primary`, `primaryDark`, `primaryLight`, `secondary`, `success`, `error`, `warning`
- Semantic color context tokens (`successBackground`, `successBorder`, `successText`, etc.)
- Sub-themes: `light_primary` and `dark_primary` ONLY

**What's MISSING (this story adds):**
1. Animation driver (`@tamagui/animations-moti` not installed/configured)
2. Named animation presets (quick, bouncy, medium, slow, lazy)
3. Sub-themes for `success`, `error`, `warning` (only `primary` exists)
4. Custom space/radius/font tokens (currently using defaultConfig tokens)
5. Verification/demo screen

### Critical Architecture Requirements

**File to modify:** `dangdai-mobile/tamagui.config.ts`

**Animation driver import pattern (from Context7 docs):**

```typescript
import { createAnimations } from '@tamagui/animations-moti'

const animations = createAnimations({
  quick: {
    type: 'spring',
    damping: 20,
    stiffness: 250,
    mass: 1.2,
  },
  bouncy: {
    type: 'spring',
    damping: 10,
    stiffness: 200,
    mass: 0.9,
  },
  medium: {
    type: 'spring',
    damping: 15,
    stiffness: 150,
    mass: 1.0,
  },
  slow: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
    mass: 1.2,
  },
  lazy: {
    type: 'spring',
    damping: 18,
    stiffness: 50,
  },
})
```

Then pass to `createTamagui({ ...defaultConfig, animations, ... })`.

**Sub-theme pattern:** Sub-themes use `parentTheme_subTheme` naming convention. Each sub-theme must remap the core semantic tokens (`background`, `backgroundHover`, `backgroundPress`, `color`, `colorHover`, `colorPress`, `borderColor`, `borderColorHover`, `borderColorPress`). When `<Theme name="success">` wraps a component, all `$background`/`$color`/`$borderColor` references auto-resolve to the success sub-theme values.

**Sub-theme values (from UX spec + architecture):**

```typescript
// light_success
{
  background: '#DCFCE7',
  backgroundHover: '#BBF7D0',
  backgroundPress: '#86EFAC',
  color: '#166534',
  colorHover: '#14532D',
  colorPress: '#14532D',
  borderColor: '#BBF7D0',
  borderColorHover: '#86EFAC',
  borderColorPress: '#22C55E',
}

// light_error (gentle orange, NOT red)
{
  background: '#FFF7ED',
  backgroundHover: '#FED7AA',
  backgroundPress: '#FDBA74',
  color: '#C2410C',
  colorHover: '#9A3412',
  colorPress: '#9A3412',
  borderColor: '#FED7AA',
  borderColorHover: '#FDBA74',
  borderColorPress: '#FB923C',
}

// light_warning
{
  background: '#FFFBEB',
  backgroundHover: '#FDE68A',
  backgroundPress: '#FCD34D',
  color: '#92400E',
  colorHover: '#78350F',
  colorPress: '#78350F',
  borderColor: '#FDE68A',
  borderColorHover: '#FCD34D',
  borderColorPress: '#F59E0B',
}
```

Dark mode variants invert: use darker backgrounds with lighter text/borders.

**Custom tokens pattern:**

```typescript
import { createTokens } from 'tamagui'

// Merge with defaultConfig tokens
tokens: {
  ...defaultConfig.tokens,
  space: {
    ...defaultConfig.tokens.space,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  radius: {
    ...defaultConfig.tokens.radius,
    sm: 8,
    md: 12,
    full: 9999,
  },
}
```

**Font configuration with createFont():**

```typescript
import { createFont } from 'tamagui'

const interFont = createFont({
  family: 'Inter',
  size: { 1: 12, 2: 14, 3: 16, 4: 18, 5: 20, 6: 24, 7: 32 },
  weight: { 4: '400', 5: '500', 6: '600', 7: '700' },
  letterSpacing: { 4: 0, 5: -0.2 },
  lineHeight: { 1: 17, 2: 20, 3: 22, 4: 25, 5: 28, 6: 33, 7: 44 },
})
```

### Dependency Info

**Already installed (verified in package.json):**
- `react-native-reanimated: ~4.1.1`
- `tamagui: ^1.121.10`
- `@tamagui/config: ^1.121.10`
- `@tamagui/font-inter: ^1.121.10`

**Must install:**
- `@tamagui/animations-moti` - the Reanimated-based animation driver
- `moti` - peer dependency required by @tamagui/animations-moti

**babel.config.js requirement:** Must include `'react-native-reanimated/plugin'` as the LAST plugin. Check if already present from Story 1.1.

### Anti-Patterns to AVOID

1. **DO NOT** use `@tamagui/animations-react-native` driver -- architecture mandates `@tamagui/animations-moti` for off-JS-thread performance
2. **DO NOT** hardcode hex values in component files -- always use `$tokenName` references
3. **DO NOT** use `Dimensions.get('window')` for responsive layouts -- use Tamagui `$xs`/`$sm` media query props
4. **DO NOT** use inline spring configs on components -- use named presets (`animation="quick"`)
5. **DO NOT** set `backgroundColor="$success"` on individual elements for feedback states -- wrap in `<Theme name="success">` instead
6. **DO NOT** remove or modify existing `light_primary`/`dark_primary` sub-themes
7. **DO NOT** replace defaultConfig tokens entirely -- merge/extend them
8. **DO NOT** use imperative animation code (Animated.View + useAnimatedStyle) for component transitions -- use Tamagui declarative props
9. **DO NOT** forget to define BOTH light_ and dark_ variants for each sub-theme

### Enforcement Rules (from Architecture)

All components MUST:
- Use `$background`, `$color`, `$borderColor` token references for all colors
- Use `<Theme name="...">` wrappers for contextual color contexts (success, error, primary, warning)
- Use `animation="quick"` (or other preset name) for all animations
- Use `enterStyle`/`exitStyle`/`pressStyle` for declarative animations
- Use `AnimatePresence` for mount/unmount animations
- Use `$xs`/`$sm` media query props for responsive adjustments

### Previous Story Intelligence (Story 1.1)

**Learnings:**
- `yarn create tamagui@latest` failed; template was manually cloned. The project is already scaffolded and working.
- Tamagui config uses v5 API (`@tamagui/config/v5`)
- Fixed workspace:* deps replaced with npm versions `^1.121.10`
- TypeScript strict mode is enabled
- `react-native-reanimated` is already installed (v4.1.1) as part of the Expo template

**Files created in 1.1 relevant to this story:**
- `dangdai-mobile/tamagui.config.ts` -- **primary file to modify**
- `dangdai-mobile/babel.config.js` -- may need reanimated plugin
- `dangdai-mobile/components/Provider.tsx` -- wraps TamaguiProvider
- `dangdai-mobile/app/_layout.tsx` -- root layout with TamaguiProvider

**Git intelligence (most recent commit):**
- `c5307ee update tamagui configs` -- updated architecture.md and epics.md with Tamagui theme/animation architecture details
- Config files are at Tamagui v1.121.10

### Project Structure Notes

- Config file: `dangdai-mobile/tamagui.config.ts` (already exists, extend it)
- Demo screen: `dangdai-mobile/app/(tabs)/theme-demo.tsx` (new, temporary for verification)
- Package install: run from `dangdai-mobile/` directory
- Test with: `npx tsc --noEmit` from `dangdai-mobile/`

### References

- [Source: architecture.md#Tamagui-Theme-Animation-Architecture] - Animation driver, presets, sub-theme arch, token spec
- [Source: architecture.md#Enforcement-Guidelines] - 13 enforcement rules including Tamagui-specific
- [Source: ux-design-specification.md#Design-System-Foundation] - Color system, typography, spacing
- [Source: ux-design-specification.md#Sub-Theme-Strategy] - Sub-theme purpose, values, usage pattern
- [Source: ux-design-specification.md#Animation-Patterns] - Animation presets, usage per component
- [Source: ux-design-specification.md#Component-Strategy] - styled() variants, AnimatePresence patterns
- [Source: epics.md#Story-1.1b] - Full acceptance criteria

## Dev Agent Record

### Agent Model Used

claude-opus-4-6 (anthropic/claude-opus-4-6)

### Debug Log References

- Jest transformIgnorePatterns updated to include `moti` (ESM module incompatible with Jest CJS transform)
- defaultConfig v5 media queries use `xs`/`sm`/`maxXs` pattern; `gtXs` added as custom media query (minWidth: 461)
- Subtasks 6.4/6.5 (iOS/Android simulator launch) require manual verification

### Completion Notes List

- **Task 1**: Installed `@tamagui/animations-moti@^1.121.10` and `moti@^0.30.0`. Verified `react-native-reanimated@~4.1.1` already present, `babel.config.js` already has reanimated plugin as last entry.
- **Task 2**: Configured 5 named animation presets (quick, bouncy, medium, slow, lazy) using `createAnimations` from `@tamagui/animations-moti`. Passed animations to `createTamagui()`.
- **Task 3**: Added custom spacing tokens (xs=4, sm=8, md=16, lg=24, xl=32, 2xl=48), radius tokens (sm=8, md=12, full=9999), Inter font via `createFont()` for body and heading, and `gtXs` media query.
- **Task 4**: Added light/dark sub-themes for success, error, and warning. Each sub-theme remaps background, color, and borderColor tokens. Existing primary sub-themes preserved unchanged.
- **Task 5**: Created `app/(tabs)/theme-demo.tsx` with SubThemeCard for all 4 sub-themes, bouncy animation demo, AnimatePresence toggle, primary button verification, and token spacing verification. Added tab navigation entry.
- **Task 6**: TypeScript check passes (0 errors). ESLint passes (1 warn-level `any` in theme-demo.tsx). No hardcoded hex values in component files. Full test suite: 166/166 tests pass, 11/11 suites pass.

### Change Log

- 2026-02-20: Implemented Story 1.1b - Configured Tamagui theme system with animations, sub-themes, custom tokens, and demo screen.
- 2026-02-20: Addressed code review findings - 3 items resolved: font face mapping for native weights (medium), unused import (low), __DEV__ guard on demo tab (low).

### File List

- `dangdai-mobile/tamagui.config.ts` (modified) - Added animation driver, custom tokens/fonts with face mapping, success/error/warning sub-themes, gtXs media query
- `dangdai-mobile/app/_layout.tsx` (modified) - Loaded all Inter font weights (Regular, Medium, SemiBold, Bold) for native face mapping
- `dangdai-mobile/tamagui.config.test.ts` (new) - 14 unit tests for config: animations, theme tokens, sub-themes, custom tokens
- `dangdai-mobile/app/(tabs)/theme-demo.tsx` (new) - Theme verification demo screen with sub-theme cards, animation demos
- `dangdai-mobile/app/(tabs)/theme-demo.test.tsx` (new) - 6 unit tests for theme demo screen rendering
- `dangdai-mobile/app/(tabs)/_layout.tsx` (modified) - Added theme-demo tab with Palette icon
- `dangdai-mobile/package.json` (modified) - Added @tamagui/animations-moti, moti dependencies
- `dangdai-mobile/yarn.lock` (modified) - Updated lock file with new dependencies
- `dangdai-mobile/jest.config.js` (modified) - Added moti to transformIgnorePatterns
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified) - Updated story status
- `_bmad-output/implementation-artifacts/1-1b-configure-tamagui-theme-animation-presets.md` (modified) - Updated task checkboxes, dev record, status
