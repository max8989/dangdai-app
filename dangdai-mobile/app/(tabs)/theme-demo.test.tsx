/**
 * Tests for the Theme Demo screen component.
 * Verifies sub-theme cards, animation components, and primary button demo render.
 */

import React from 'react'
import { render } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import config from '../../tamagui.config'
import ThemeDemoScreen from './theme-demo'

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <TamaguiProvider config={config}>{children}</TamaguiProvider>
)

describe('ThemeDemoScreen', () => {
  it('renders the main heading', () => {
    const { getByText } = render(<ThemeDemoScreen />, { wrapper: Wrapper })
    expect(getByText('Theme & Animation Demo')).toBeTruthy()
  })

  it('renders all 4 sub-theme cards', () => {
    const { getByText } = render(<ThemeDemoScreen />, { wrapper: Wrapper })
    expect(getByText('primary')).toBeTruthy()
    expect(getByText('success')).toBeTruthy()
    expect(getByText('error')).toBeTruthy()
    expect(getByText('warning')).toBeTruthy()
  })

  it('renders the primary theme button demo', () => {
    const { getByText } = render(<ThemeDemoScreen />, { wrapper: Wrapper })
    expect(getByText('Test Button')).toBeTruthy()
    expect(getByText('Should render teal background with white text')).toBeTruthy()
  })

  it('renders the AnimatePresence toggle', () => {
    const { getByText } = render(<ThemeDemoScreen />, { wrapper: Wrapper })
    expect(getByText('AnimatePresence Toggle')).toBeTruthy()
  })

  it('renders token spacing verification section', () => {
    const { getByText } = render(<ThemeDemoScreen />, { wrapper: Wrapper })
    expect(getByText('Token Spacing Verification (AC #4)')).toBeTruthy()
  })

  it('renders bouncy animation section', () => {
    const { getByText } = render(<ThemeDemoScreen />, { wrapper: Wrapper })
    expect(getByText('Bouncy Animation on Mount (AC #3)')).toBeTruthy()
  })
})
