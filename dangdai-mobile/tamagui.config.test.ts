/**
 * Tests for Tamagui configuration - verifying theme tokens, sub-themes,
 * animation presets, and custom tokens are correctly configured.
 *
 * Story 1.1b: Configure Tamagui Theme, Sub-Themes & Animation Presets
 */

import { config } from './tamagui.config'

describe('Tamagui Config', () => {
  describe('Animation Presets (AC #3)', () => {
    it('has animations configured', () => {
      expect(config.animations).toBeDefined()
    })

    it('defines all 5 named animation presets', () => {
      const animations = config.animations
      expect(animations).toBeDefined()
      // The animations object should have the preset names accessible
      // via the animations config passed to createTamagui
      const animationNames = ['quick', 'bouncy', 'medium', 'slow', 'lazy']
      for (const name of animationNames) {
        expect(animations!.animations).toHaveProperty(name)
      }
    })
  })

  describe('Theme Tokens (AC #1)', () => {
    it('defines light theme with full semantic token set', () => {
      const light = config.themes.light
      expect(light).toBeDefined()

      // Core semantic tokens
      expect(light.background).toBeDefined()
      expect(light.backgroundHover).toBeDefined()
      expect(light.backgroundPress).toBeDefined()
      expect(light.backgroundFocus).toBeDefined()
      expect(light.backgroundStrong).toBeDefined()
      expect(light.color).toBeDefined()
      expect(light.colorHover).toBeDefined()
      expect(light.colorPress).toBeDefined()
      expect(light.borderColor).toBeDefined()
      expect(light.borderColorHover).toBeDefined()
      expect(light.borderColorFocus).toBeDefined()
      expect(light.placeholderColor).toBeDefined()

      // Custom tokens
      expect(light.surface).toBeDefined()
      expect(light.colorSubtle).toBeDefined()

      // Brand color tokens
      expect(light.primary).toBeDefined()
      expect(light.primaryDark).toBeDefined()
      expect(light.success).toBeDefined()
      expect(light.error).toBeDefined()
      expect(light.warning).toBeDefined()
      expect(light.secondary).toBeDefined()

      // Semantic color context tokens
      expect(light.successBackground).toBeDefined()
      expect(light.successBorder).toBeDefined()
      expect(light.successText).toBeDefined()
      expect(light.errorBackground).toBeDefined()
      expect(light.errorBorder).toBeDefined()
      expect(light.errorText).toBeDefined()
      expect(light.warningBackground).toBeDefined()
      expect(light.warningBorder).toBeDefined()
      expect(light.warningText).toBeDefined()
    })

    it('defines dark theme with full semantic token set', () => {
      const dark = config.themes.dark
      expect(dark).toBeDefined()

      expect(dark.background).toBeDefined()
      expect(dark.color).toBeDefined()
      expect(dark.surface).toBeDefined()
      expect(dark.colorSubtle).toBeDefined()
      expect(dark.primary).toBeDefined()
      expect(dark.success).toBeDefined()
      expect(dark.error).toBeDefined()
      expect(dark.warning).toBeDefined()
    })
  })

  describe('Sub-Themes (AC #2)', () => {
    it('defines light_primary sub-theme', () => {
      expect(config.themes.light_primary).toBeDefined()
      expect(config.themes.light_primary.background).toBeDefined()
      expect(config.themes.light_primary.color).toBeDefined()
    })

    it('defines dark_primary sub-theme', () => {
      expect(config.themes.dark_primary).toBeDefined()
      expect(config.themes.dark_primary.background).toBeDefined()
      expect(config.themes.dark_primary.color).toBeDefined()
    })

    it('defines light_success and dark_success sub-themes', () => {
      expect(config.themes.light_success).toBeDefined()
      expect(config.themes.light_success.background).toBeDefined()
      expect(config.themes.light_success.color).toBeDefined()
      expect(config.themes.light_success.borderColor).toBeDefined()

      expect(config.themes.dark_success).toBeDefined()
      expect(config.themes.dark_success.background).toBeDefined()
      expect(config.themes.dark_success.color).toBeDefined()
      expect(config.themes.dark_success.borderColor).toBeDefined()
    })

    it('defines light_error and dark_error sub-themes', () => {
      expect(config.themes.light_error).toBeDefined()
      expect(config.themes.light_error.background).toBeDefined()
      expect(config.themes.light_error.color).toBeDefined()
      expect(config.themes.light_error.borderColor).toBeDefined()

      expect(config.themes.dark_error).toBeDefined()
      expect(config.themes.dark_error.background).toBeDefined()
      expect(config.themes.dark_error.color).toBeDefined()
      expect(config.themes.dark_error.borderColor).toBeDefined()
    })

    it('defines light_warning and dark_warning sub-themes', () => {
      expect(config.themes.light_warning).toBeDefined()
      expect(config.themes.light_warning.background).toBeDefined()
      expect(config.themes.light_warning.color).toBeDefined()
      expect(config.themes.light_warning.borderColor).toBeDefined()

      expect(config.themes.dark_warning).toBeDefined()
      expect(config.themes.dark_warning.background).toBeDefined()
      expect(config.themes.dark_warning.color).toBeDefined()
      expect(config.themes.dark_warning.borderColor).toBeDefined()
    })

    it('sub-themes remap core semantic tokens correctly', () => {
      // light_success should use success-context colors, not the base light theme colors
      const lightSuccess = config.themes.light_success
      const light = config.themes.light

      // The sub-theme background should be different from the parent light theme background
      expect(lightSuccess.background).not.toEqual(light.background)
    })
  })

  describe('Custom Tokens (AC #4)', () => {
    it('defines custom spacing tokens', () => {
      const space = config.tokensParsed.space
      expect(space).toBeDefined()

      // Tamagui tokensParsed uses $-prefixed keys
      expect(space['$xs']?.val).toBe(4)
      expect(space['$sm']?.val).toBe(8)
      expect(space['$md']?.val).toBe(16)
      expect(space['$lg']?.val).toBe(24)
      expect(space['$xl']?.val).toBe(32)
      expect(space['$2xl']?.val).toBe(48)
    })

    it('defines custom radius tokens', () => {
      const radius = config.tokensParsed.radius
      expect(radius).toBeDefined()

      expect(radius['$sm']?.val).toBe(8)
      expect(radius['$md']?.val).toBe(12)
      expect(radius['$full']?.val).toBe(9999)
    })

    it('defines Inter font family for body and heading', () => {
      const fonts = config.fonts
      expect(fonts).toBeDefined()

      expect(fonts.body).toBeDefined()
      expect(fonts.heading).toBeDefined()
      expect(fonts.body.family).toBe('Inter')
      expect(fonts.heading.family).toBe('Inter')
    })

    it('preserves default media queries and adds gtXs', () => {
      const media = config.media
      expect(media).toBeDefined()

      // These should be available from defaultConfig
      expect(media.xs).toBeDefined()
      expect(media.sm).toBeDefined()
      // gtXs added as custom media query (minWidth above xs breakpoint)
      expect(media.gtXs).toBeDefined()
    })
  })
})
