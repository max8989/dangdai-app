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
System.register(["zustand"], function (exports_1, context_1) {
    "use strict";
    var zustand_1, useSettingsStore;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (zustand_1_1) {
                zustand_1 = zustand_1_1;
            }
        ],
        execute: function () {
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
            exports_1("useSettingsStore", useSettingsStore = zustand_1.create((set) => ({
                // Default state
                theme: 'system',
                language: 'en',
                soundEnabled: true,
                // Actions
                setTheme: (theme) => set({ theme }),
                setLanguage: (language) => set({ language }),
                toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
            })));
        }
    };
});
