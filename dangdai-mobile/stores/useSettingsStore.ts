/**
 * Settings Store
 *
 * Per architecture specification, Zustand is used for local state:
 * - Current quiz state
 * - UI preferences
 * - Theme
 *
 * This store manages app-wide settings like theme, language, and sound.
 */

import { create } from 'zustand'

/**
 * Settings state interface
 */
interface SettingsState {
  // Theme preference
  theme: 'light' | 'dark' | 'system'

  // Language (UI language, not Chinese content)
  language: 'en' | 'fr' | 'ja' | 'ko'

  // Sound effects enabled
  soundEnabled: boolean

  // Actions
  setTheme: (theme: SettingsState['theme']) => void
  setLanguage: (language: SettingsState['language']) => void
  toggleSound: () => void
}

/**
 * Settings store for app-wide preferences
 *
 * Usage:
 * ```tsx
 * import { useSettingsStore } from '../stores/useSettingsStore';
 *
 * function SettingsScreen() {
 *   const { theme, setTheme, soundEnabled, toggleSound } = useSettingsStore();
 *
 *   return (
 *     <View>
 *       <Switch value={soundEnabled} onValueChange={toggleSound} />
 *     </View>
 *   );
 * }
 * ```
 */
export const useSettingsStore = create<SettingsState>((set) => ({
  // Default state
  theme: 'system',
  language: 'en',
  soundEnabled: true,

  // Actions
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
}))
