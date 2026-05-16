/**
 * useSound (Phase 3 stub)
 *
 * The mobile app plays correct/incorrect ding via expo-av. Phase 5 will replace
 * this with HTMLAudioElement. For now we expose the same surface as no-ops so
 * the quiz flow can call playSound() / preloadSounds() without crashing.
 */

export type SoundEffect = 'correct' | 'incorrect'

export async function preloadSounds(): Promise<void> {
  // No-op until Phase 5 wires HTMLAudioElement.
}

export async function unloadSounds(): Promise<void> {
  // No-op until Phase 5 wires HTMLAudioElement.
}

export async function playSound(_effect: SoundEffect): Promise<void> {
  // No-op until Phase 5 wires HTMLAudioElement.
}
