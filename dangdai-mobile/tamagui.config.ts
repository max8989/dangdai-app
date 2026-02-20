import { defaultConfig } from '@tamagui/config/v5'
import { createAnimations } from '@tamagui/animations-moti'
import { createFont, createTamagui } from 'tamagui'

// ─── Animation Presets (AC #3) ────────────────────────────────────────────────
// Using @tamagui/animations-moti for off-JS-thread Reanimated-based performance
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

// ─── Font Configuration (AC #4) ──────────────────────────────────────────────
const interFont = createFont({
  family: 'Inter',
  size: { 1: 12, 2: 14, 3: 16, 4: 18, 5: 20, 6: 24, 7: 32 },
  weight: { 4: '400', 5: '500', 6: '600', 7: '700' },
  letterSpacing: { 4: 0, 5: -0.2 },
  lineHeight: { 1: 17, 2: 20, 3: 22, 4: 25, 5: 28, 6: 33, 7: 44 },
})

// ─── Custom Color Values (from UX spec) ──────────────────────────────────────
const colors = {
  // Primary - Teal
  primary: '#06B6D4',
  primaryDark: '#0891B2',
  primaryLight: '#22D3EE',
  // Secondary - Orange
  secondary: '#F97316',
  secondaryLight: '#FB923C',
  // Success - Green
  success: '#22C55E',
  successLight: '#4ADE80',
  // Error - Gentle orange (not harsh red)
  error: '#FB923C',
  errorLight: '#FDBA74',
  // Warning - Yellow/amber for hints and cautions
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  // Backgrounds
  backgroundLight: '#FAFAF9',
  backgroundDark: '#0C0A09',
  // Surfaces (cards, inputs)
  surfaceLight: '#FFFFFF',
  surfaceDark: '#1C1917',
  // Text colors
  textPrimaryLight: '#1C1917',
  textPrimaryDark: '#FAFAF9',
  textSecondaryLight: '#78716C',
  textSecondaryDark: '#A8A29E',
}

// ─── Light Theme (AC #1) ─────────────────────────────────────────────────────
const lightTheme = {
  ...defaultConfig.themes.light,
  // Primary colors
  primary: colors.primary,
  primaryDark: colors.primaryDark,
  primaryLight: colors.primaryLight,
  // Background colors
  background: colors.backgroundLight,
  backgroundHover: '#F5F5F4',
  backgroundPress: '#E7E5E4',
  backgroundFocus: '#D6D3D1',
  backgroundStrong: '#E7E5E4',
  backgroundTransparent: 'rgba(250, 250, 249, 0.5)',
  // Surface for cards/inputs
  surface: colors.surfaceLight,
  // Text colors
  color: colors.textPrimaryLight,
  colorHover: '#292524',
  colorPress: '#44403C',
  colorFocus: '#57534E',
  colorTransparent: 'rgba(28, 25, 23, 0.5)',
  colorSubtle: colors.textSecondaryLight,
  // Border colors
  borderColor: '#D6D3D1',
  borderColorHover: '#A8A29E',
  borderColorFocus: colors.primary,
  borderColorPress: '#78716C',
  // Placeholder
  placeholderColor: colors.textSecondaryLight,
  // Semantic colors
  success: colors.success,
  successBackground: '#DCFCE7',
  successBorder: '#BBF7D0',
  successText: '#166534',
  error: colors.error,
  errorBackground: '#FFF7ED',
  errorBorder: '#FED7AA',
  errorText: '#C2410C',
  // Warning colors
  warning: colors.warning,
  warningBackground: '#FFFBEB',
  warningBorder: '#FDE68A',
  warningText: '#92400E',
  secondary: colors.secondary,
}

// ─── Dark Theme (AC #1) ──────────────────────────────────────────────────────
const darkTheme = {
  ...defaultConfig.themes.dark,
  // Primary colors (lighter in dark mode)
  primary: colors.primaryLight,
  primaryDark: colors.primaryDark,
  primaryLight: colors.primaryLight,
  // Background colors
  background: colors.backgroundDark,
  backgroundHover: '#1C1917',
  backgroundPress: '#292524',
  backgroundFocus: '#44403C',
  backgroundStrong: '#292524',
  backgroundTransparent: 'rgba(12, 10, 9, 0.5)',
  // Surface for cards/inputs
  surface: colors.surfaceDark,
  // Text colors
  color: colors.textPrimaryDark,
  colorHover: '#F5F5F4',
  colorPress: '#E7E5E4',
  colorFocus: '#D6D3D1',
  colorTransparent: 'rgba(250, 250, 249, 0.5)',
  colorSubtle: colors.textSecondaryDark,
  // Border colors
  borderColor: '#44403C',
  borderColorHover: '#57534E',
  borderColorFocus: colors.primaryLight,
  borderColorPress: '#78716C',
  // Placeholder
  placeholderColor: colors.textSecondaryDark,
  // Semantic colors (lighter variants in dark mode)
  success: colors.successLight,
  successBackground: '#14532D',
  successBorder: '#166534',
  successText: '#BBF7D0',
  error: colors.errorLight,
  errorBackground: '#7C2D12',
  errorBorder: '#9A3412',
  errorText: '#FED7AA',
  // Warning colors (lighter in dark mode)
  warning: colors.warningLight,
  warningBackground: '#78350F',
  warningBorder: '#92400E',
  warningText: '#FDE68A',
  secondary: colors.secondaryLight,
}

// ─── Sub-Themes (AC #2) ──────────────────────────────────────────────────────
// Primary sub-themes (existing from Story 1.1)
const lightPrimaryTheme = {
  background: colors.primary,
  backgroundHover: colors.primaryDark,
  backgroundPress: colors.primaryDark,
  backgroundFocus: colors.primary,
  color: '#FFFFFF',
  colorHover: '#FFFFFF',
  colorPress: '#F5F5F4',
  colorFocus: '#FFFFFF',
  borderColor: colors.primary,
  borderColorHover: colors.primaryDark,
  borderColorFocus: colors.primaryDark,
  borderColorPress: colors.primaryDark,
}

const darkPrimaryTheme = {
  background: colors.primaryLight,
  backgroundHover: colors.primary,
  backgroundPress: colors.primary,
  backgroundFocus: colors.primaryLight,
  color: '#0C0A09',
  colorHover: '#0C0A09',
  colorPress: '#1C1917',
  colorFocus: '#0C0A09',
  borderColor: colors.primaryLight,
  borderColorHover: colors.primary,
  borderColorFocus: colors.primary,
  borderColorPress: colors.primary,
}

// Success sub-themes (new)
const lightSuccessTheme = {
  background: '#DCFCE7',
  backgroundHover: '#BBF7D0',
  backgroundPress: '#86EFAC',
  backgroundFocus: '#DCFCE7',
  color: '#166534',
  colorHover: '#14532D',
  colorPress: '#14532D',
  colorFocus: '#166534',
  borderColor: '#BBF7D0',
  borderColorHover: '#86EFAC',
  borderColorFocus: '#22C55E',
  borderColorPress: '#22C55E',
}

const darkSuccessTheme = {
  background: '#14532D',
  backgroundHover: '#166534',
  backgroundPress: '#15803D',
  backgroundFocus: '#14532D',
  color: '#BBF7D0',
  colorHover: '#DCFCE7',
  colorPress: '#DCFCE7',
  colorFocus: '#BBF7D0',
  borderColor: '#166534',
  borderColorHover: '#15803D',
  borderColorFocus: '#22C55E',
  borderColorPress: '#22C55E',
}

// Error sub-themes (gentle orange, NOT red)
const lightErrorTheme = {
  background: '#FFF7ED',
  backgroundHover: '#FED7AA',
  backgroundPress: '#FDBA74',
  backgroundFocus: '#FFF7ED',
  color: '#C2410C',
  colorHover: '#9A3412',
  colorPress: '#9A3412',
  colorFocus: '#C2410C',
  borderColor: '#FED7AA',
  borderColorHover: '#FDBA74',
  borderColorFocus: '#FB923C',
  borderColorPress: '#FB923C',
}

const darkErrorTheme = {
  background: '#7C2D12',
  backgroundHover: '#9A3412',
  backgroundPress: '#C2410C',
  backgroundFocus: '#7C2D12',
  color: '#FED7AA',
  colorHover: '#FFF7ED',
  colorPress: '#FFF7ED',
  colorFocus: '#FED7AA',
  borderColor: '#9A3412',
  borderColorHover: '#C2410C',
  borderColorFocus: '#FB923C',
  borderColorPress: '#FB923C',
}

// Warning sub-themes
const lightWarningTheme = {
  background: '#FFFBEB',
  backgroundHover: '#FDE68A',
  backgroundPress: '#FCD34D',
  backgroundFocus: '#FFFBEB',
  color: '#92400E',
  colorHover: '#78350F',
  colorPress: '#78350F',
  colorFocus: '#92400E',
  borderColor: '#FDE68A',
  borderColorHover: '#FCD34D',
  borderColorFocus: '#F59E0B',
  borderColorPress: '#F59E0B',
}

const darkWarningTheme = {
  background: '#78350F',
  backgroundHover: '#92400E',
  backgroundPress: '#B45309',
  backgroundFocus: '#78350F',
  color: '#FDE68A',
  colorHover: '#FFFBEB',
  colorPress: '#FFFBEB',
  colorFocus: '#FDE68A',
  borderColor: '#92400E',
  borderColorHover: '#B45309',
  borderColorFocus: '#F59E0B',
  borderColorPress: '#F59E0B',
}

// ─── Tamagui Config ──────────────────────────────────────────────────────────
export const config = createTamagui({
  ...defaultConfig,
  animations,
  fonts: {
    ...defaultConfig.fonts,
    body: interFont,
    heading: interFont,
  },
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
  },
  media: {
    ...defaultConfig.media,
    // Add gtXs media query (minWidth above xs breakpoint)
    gtXs: { minWidth: 461 },
  },
  themes: {
    ...defaultConfig.themes,
    light: lightTheme,
    dark: darkTheme,
    // Primary sub-themes (existing from Story 1.1)
    light_primary: lightPrimaryTheme,
    dark_primary: darkPrimaryTheme,
    // Success sub-themes (new)
    light_success: lightSuccessTheme,
    dark_success: darkSuccessTheme,
    // Error sub-themes (new)
    light_error: lightErrorTheme,
    dark_error: darkErrorTheme,
    // Warning sub-themes (new)
    light_warning: lightWarningTheme,
    dark_warning: darkWarningTheme,
  },
  settings: {
    ...defaultConfig.settings,
    // Allow both shorthands and full CSS property names
    onlyAllowShorthands: false,
  },
})

export default config

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
