/**
 * useSound — web port of the mobile expo-av implementation.
 *
 * Uses HTMLAudioElement with a module-level cache so we don't reallocate per
 * render. playSound() reads the current `soundEnabled` from useSettingsStore
 * at call time (not via subscription) so a stale closure can't make a muted
 * setting still play.
 */

import { useSettingsStore } from '@/stores/useSettingsStore'

export type SoundName = 'correct' | 'incorrect' | 'celebration'

const SOUND_SOURCES: Record<SoundName, string> = {
  correct: '/sounds/correct.mp3',
  incorrect: '/sounds/incorrect.mp3',
  celebration: '/sounds/celebration.mp3',
}

const soundCache = new Map<SoundName, HTMLAudioElement>()

function createAudio(src: string): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null
  const audio = new Audio(src)
  audio.preload = 'auto'
  return audio
}

export async function preloadSounds(): Promise<void> {
  if (typeof Audio === 'undefined') return
  for (const [name, src] of Object.entries(SOUND_SOURCES) as [SoundName, string][]) {
    if (soundCache.has(name)) continue
    const audio = createAudio(src)
    if (audio) {
      audio.load()
      soundCache.set(name, audio)
    }
  }
}

export async function unloadSounds(): Promise<void> {
  for (const [, audio] of soundCache) {
    try {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    } catch {
      // ignore — element is being discarded anyway
    }
  }
  soundCache.clear()
}

export async function playSound(name: SoundName): Promise<void> {
  const soundEnabled = useSettingsStore.getState().soundEnabled
  if (!soundEnabled) return

  let audio = soundCache.get(name)
  if (!audio) {
    audio = createAudio(SOUND_SOURCES[name]) ?? undefined
    if (!audio) return
    soundCache.set(name, audio)
  }

  try {
    audio.currentTime = 0
    await audio.play()
  } catch (err) {
    // NotAllowedError: browser blocks autoplay before user interaction. Once
    // the user has clicked anything in the page, subsequent plays succeed.
    console.warn(`Failed to play sound "${name}":`, err)
  }
}

export function useSound() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  return { playSound, preloadSounds, unloadSounds, soundEnabled }
}

// Back-compat alias for existing call sites that imported `SoundEffect`.
export type SoundEffect = SoundName
