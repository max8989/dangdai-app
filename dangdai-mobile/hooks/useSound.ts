/**
 * useSound Hook
 *
 * Sound effect management for quiz feedback using expo-av.
 * Preloads sound assets on quiz screen mount and provides
 * a playSound function that respects the user's sound setting.
 *
 * Design decisions:
 * - Module-level soundCache avoids re-creating Audio.Sound instances on every render
 * - playSound() reads soundEnabled from store at call time (not reactive) — correct
 *   because we want the check at play time, not at render time
 * - playsInSilentModeIOS: false respects the device silent mode switch
 * - All async operations are wrapped in try/catch — sound failures must never crash the quiz
 * - preloadSounds/unloadSounds are exported as standalone functions for useEffect usage
 *
 * Story 4.9: Immediate Answer Feedback — Task 1
 */

import { Audio } from 'expo-av'

import { useSettingsStore } from '../stores/useSettingsStore'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Available sound effect names */
export type SoundName = 'correct' | 'incorrect' | 'celebration'

// ─── Assets ───────────────────────────────────────────────────────────────────

/** Map of sound names to their asset require paths */
const SOUND_ASSETS: Record<SoundName, number> = {
  correct: require('../assets/sounds/correct.mp3') as number,
  incorrect: require('../assets/sounds/incorrect.mp3') as number,
  celebration: require('../assets/sounds/celebration.mp3') as number,
}

// ─── Module-level cache ───────────────────────────────────────────────────────

/** Module-level cache for loaded Audio.Sound instances */
const soundCache = new Map<SoundName, Audio.Sound>()

// ─── Standalone functions ─────────────────────────────────────────────────────

/**
 * Preload all sound assets into memory.
 * Call once on quiz screen mount. Non-blocking — errors are logged, not thrown.
 */
export async function preloadSounds(): Promise<void> {
  // Respect device silent mode (do not override)
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: false,
  })

  const entries = Object.entries(SOUND_ASSETS) as [SoundName, number][]
  await Promise.all(
    entries.map(async ([name, asset]) => {
      try {
        if (soundCache.has(name)) return
        const { sound } = await Audio.Sound.createAsync(asset)
        soundCache.set(name, sound)
      } catch (err) {
        console.warn(`Failed to preload sound "${name}":`, err)
      }
    }),
  )
}

/**
 * Play a named sound effect.
 * Checks soundEnabled setting before playing. Rewinds to start before each play.
 */
export async function playSound(name: SoundName): Promise<void> {
  const soundEnabled = useSettingsStore.getState().soundEnabled
  if (!soundEnabled) return

  const sound = soundCache.get(name)
  if (!sound) return

  try {
    await sound.setPositionAsync(0)
    await sound.playAsync()
  } catch (err) {
    console.warn(`Failed to play sound "${name}":`, err)
  }
}

/**
 * Unload all cached sounds to free memory.
 * Call on quiz screen unmount.
 */
export async function unloadSounds(): Promise<void> {
  const entries = Array.from(soundCache.entries())
  await Promise.all(
    entries.map(async ([name, sound]) => {
      try {
        await sound.unloadAsync()
        soundCache.delete(name)
      } catch (err) {
        console.warn(`Failed to unload sound "${name}":`, err)
      }
    }),
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook for sound effect management in quiz screens.
 *
 * Usage:
 * ```tsx
 * function QuizPlayScreen() {
 *   const { playSound } = useSound()
 *
 *   useEffect(() => {
 *     preloadSounds()
 *     return () => { unloadSounds() }
 *   }, [])
 *
 *   const handleAnswer = (isCorrect: boolean) => {
 *     playSound(isCorrect ? 'correct' : 'incorrect')
 *   }
 * }
 * ```
 */
export function useSound() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)

  return {
    playSound,
    preloadSounds,
    unloadSounds,
    soundEnabled,
  }
}
