import { defaultConfig } from '@tamagui/config/v5'
import { createTamagui } from 'tamagui'

// Custom color values from UX spec
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

// Light theme
const lightTheme = {
  ...defaultConfig.themes.light,
  // Primary colors
  primary: colors.primary,
  primaryDark: colors.primaryDark,
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

// Dark theme
const darkTheme = {
  ...defaultConfig.themes.dark,
  // Primary colors (lighter in dark mode)
  primary: colors.primaryLight,
  primaryDark: colors.primaryDark,
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

// Primary button sub-themes
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

export const config = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    light: lightTheme,
    dark: darkTheme,
    light_primary: lightPrimaryTheme,
    dark_primary: darkPrimaryTheme,
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
