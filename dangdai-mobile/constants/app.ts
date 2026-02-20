/**
 * App Constants
 *
 * Central place for app-wide branding constants.
 */

/** Display name shown in the UI, headers, and splash screen. */
export const APP_NAME = 'Maixin Chinese' as const

/** Short name used for the app icon label. */
export const APP_NAME_SHORT = 'Maixin' as const

/**
 * Brand color palette extracted from the Maixin Chinese logo.
 * Teal gradient: #22D3EE (cyan-400) -> #06B6D4 (cyan-500) -> #0891B2 (cyan-600) -> #0E7490 (cyan-700)
 */
export const BRAND_COLORS = {
  /** Primary brand color (teal/cyan-600) */
  PRIMARY: '#0891B2',
  /** Lighter teal (cyan-400), used in gradients */
  PRIMARY_LIGHT: '#22D3EE',
  /** Medium teal (cyan-500), used in logo gradient end */
  PRIMARY_MEDIUM: '#06B6D4',
  /** Darker teal (cyan-700), used for subtitle text */
  PRIMARY_DARK: '#0E7490',
  /** Splash screen / app background color (teal gradient start) */
  SPLASH_BACKGROUND: '#0891B2',
  /** Android adaptive icon background */
  ADAPTIVE_ICON_BACKGROUND: '#0891B2',
} as const
