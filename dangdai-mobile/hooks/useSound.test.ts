/**
 * useSound Hook Tests
 *
 * Unit tests for the sound effect hook using expo-av.
 * Tests cover preloading, playing, muting, and cleanup.
 *
 * Story 4.9: Immediate Answer Feedback — Task 1.8
 */

import { renderHook } from '@testing-library/react-native'

import { useSettingsStore } from '../stores/useSettingsStore'
import { preloadSounds, playSound, unloadSounds, useSound } from './useSound'

// ─── Mock expo-av ─────────────────────────────────────────────────────────────
// NOTE: jest.mock is hoisted — factory must NOT reference variables declared with let/const
// in the test file scope. Use module-level mock state instead.

const mockSoundInstance = {
  playAsync: jest.fn().mockResolvedValue(undefined),
  setPositionAsync: jest.fn().mockResolvedValue(undefined),
  unloadAsync: jest.fn().mockResolvedValue(undefined),
}

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({ sound: mockSoundInstance }),
    },
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  },
}))

// ─── Mock assets ──────────────────────────────────────────────────────────────

jest.mock('../assets/sounds/correct.mp3', () => 1, { virtual: true })
jest.mock('../assets/sounds/incorrect.mp3', () => 2, { virtual: true })
jest.mock('../assets/sounds/celebration.mp3', () => 3, { virtual: true })

// ─── Import Audio after mocking ───────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Audio } = require('expo-av') as { Audio: { Sound: { createAsync: jest.Mock }; setAudioModeAsync: jest.Mock } }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resetSettingsStore() {
  const state = useSettingsStore.getState()
  if (!state.soundEnabled) {
    state.toggleSound()
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useSound — preloadSounds (Task 1.3)', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    // Reset mock implementations after clearAllMocks
    Audio.Sound.createAsync.mockResolvedValue({ sound: mockSoundInstance })
    Audio.setAudioModeAsync.mockResolvedValue(undefined)
    mockSoundInstance.playAsync.mockResolvedValue(undefined)
    mockSoundInstance.setPositionAsync.mockResolvedValue(undefined)
    mockSoundInstance.unloadAsync.mockResolvedValue(undefined)
    resetSettingsStore()
    await unloadSounds()
  })

  it('calls setAudioModeAsync to respect silent mode (Task 1.4)', async () => {
    await preloadSounds()
    expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({ playsInSilentModeIOS: false })
  })

  it('preloads all three sound assets (Task 1.3)', async () => {
    await preloadSounds()
    expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(3)
  })

  it('does not re-create sounds if already cached (Task 1.3)', async () => {
    await preloadSounds()
    await preloadSounds()
    // Only 3 calls (first preload), not 6 (second preload skipped due to cache)
    expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(3)
  })

  it('logs a warning (not throws) when sound creation fails (Task 1.3)', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    Audio.Sound.createAsync.mockRejectedValueOnce(new Error('load failed'))
    await expect(preloadSounds()).resolves.toBeUndefined()
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to preload sound'),
      expect.any(Error),
    )
    consoleWarn.mockRestore()
  })
})

describe('useSound — playSound (Task 1.5)', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    Audio.Sound.createAsync.mockResolvedValue({ sound: mockSoundInstance })
    Audio.setAudioModeAsync.mockResolvedValue(undefined)
    mockSoundInstance.playAsync.mockResolvedValue(undefined)
    mockSoundInstance.setPositionAsync.mockResolvedValue(undefined)
    mockSoundInstance.unloadAsync.mockResolvedValue(undefined)
    resetSettingsStore()
    await unloadSounds()
    await preloadSounds()
  })

  it('rewinds and plays the correct sound (Task 1.5)', async () => {
    await playSound('correct')
    expect(mockSoundInstance.setPositionAsync).toHaveBeenCalledWith(0)
    expect(mockSoundInstance.playAsync).toHaveBeenCalledTimes(1)
  })

  it('rewinds and plays the incorrect sound (Task 1.5)', async () => {
    await playSound('incorrect')
    expect(mockSoundInstance.setPositionAsync).toHaveBeenCalledWith(0)
    expect(mockSoundInstance.playAsync).toHaveBeenCalledTimes(1)
  })

  it('does NOT play when soundEnabled is false (Task 1.5)', async () => {
    useSettingsStore.getState().toggleSound() // disable
    await playSound('correct')
    expect(mockSoundInstance.playAsync).not.toHaveBeenCalled()
    useSettingsStore.getState().toggleSound() // re-enable
  })

  it('is a no-op when sound not cached (e.g. after unload)', async () => {
    await unloadSounds()
    // After unloading, cache is empty — should not throw
    await expect(playSound('correct')).resolves.toBeUndefined()
    expect(mockSoundInstance.playAsync).not.toHaveBeenCalled()
  })

  it('logs a warning (not throws) when playAsync fails (Task 1.5)', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    mockSoundInstance.playAsync.mockRejectedValueOnce(new Error('play failed'))
    await expect(playSound('correct')).resolves.toBeUndefined()
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to play sound'),
      expect.any(Error),
    )
    consoleWarn.mockRestore()
  })
})

describe('useSound — unloadSounds (Task 1.6)', () => {
  beforeEach(async () => {
    // First: unload any existing cache (may call unloadAsync on stale sounds)
    await unloadSounds()
    // Then clear all mocks so we start fresh
    jest.clearAllMocks()
    Audio.Sound.createAsync.mockResolvedValue({ sound: mockSoundInstance })
    Audio.setAudioModeAsync.mockResolvedValue(undefined)
    mockSoundInstance.playAsync.mockResolvedValue(undefined)
    mockSoundInstance.setPositionAsync.mockResolvedValue(undefined)
    mockSoundInstance.unloadAsync.mockResolvedValue(undefined)
    // Now preload a fresh set
    await preloadSounds()
  })

  it('calls unloadAsync on all cached sounds (Task 1.6)', async () => {
    jest.clearAllMocks()
    mockSoundInstance.unloadAsync.mockResolvedValue(undefined)
    await unloadSounds()
    expect(mockSoundInstance.unloadAsync).toHaveBeenCalledTimes(3)
  })

  it('clears the cache so subsequent playSound is a no-op (Task 1.6)', async () => {
    await unloadSounds()
    resetSettingsStore()
    await playSound('correct')
    expect(mockSoundInstance.playAsync).not.toHaveBeenCalled()
  })

  it('logs a warning (not throws) when unload fails (Task 1.6)', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    mockSoundInstance.unloadAsync.mockRejectedValueOnce(new Error('unload failed'))
    await expect(unloadSounds()).resolves.toBeUndefined()
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to unload sound'),
      expect.any(Error),
    )
    consoleWarn.mockRestore()
  })
})

describe('useSound hook (Task 1.7)', () => {
  it('exports playSound, preloadSounds, unloadSounds, and soundEnabled', () => {
    const { result } = renderHook(() => useSound())
    expect(result.current).toHaveProperty('playSound')
    expect(result.current).toHaveProperty('preloadSounds')
    expect(result.current).toHaveProperty('unloadSounds')
    expect(result.current).toHaveProperty('soundEnabled')
  })

  it('soundEnabled reflects the current settings store value', () => {
    const { result } = renderHook(() => useSound())
    expect(result.current.soundEnabled).toBe(useSettingsStore.getState().soundEnabled)
  })
})
