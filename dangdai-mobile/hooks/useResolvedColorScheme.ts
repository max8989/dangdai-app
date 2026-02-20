/**
 * Resolves the effective color scheme based on user preference from settings store.
 *
 * - 'system' -> delegates to device color scheme
 * - 'light' / 'dark' -> uses the explicit choice
 *
 * Also calls Appearance.setColorScheme() so that native iOS chrome
 * (translucent headers, back-swipe transitions, alerts, pickers)
 * respects the user's preference instead of always following the system.
 */

import { useEffect } from 'react'
import { Appearance, useColorScheme } from 'react-native'
import { useSettingsStore } from '../stores/useSettingsStore'

export function useResolvedColorScheme(): 'light' | 'dark' {
  const systemScheme = useColorScheme()
  const themePreference = useSettingsStore((s) => s.theme)

  const resolved =
    themePreference === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : themePreference

  // Force the native iOS/Android appearance to match the user's choice.
  // This ensures translucent navigation chrome, alerts, and pickers
  // use the correct color scheme rather than the OS default.
  useEffect(() => {
    Appearance.setColorScheme(themePreference === 'system' ? null : themePreference)
  }, [themePreference])

  return resolved
}
