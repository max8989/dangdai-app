import { Image } from 'react-native'

// Pre-rendered PNG from the SVG wordmark logo (880x344 at 2x for Retina)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const logoSource = require('../assets/images/logo.png')

interface MaixinLogoProps {
  /** Display width of the logo. Height scales proportionally (aspect ratio 440:172). */
  width?: number
}

export function MaixinLogo({ width = 220 }: MaixinLogoProps) {
  const height = Math.round(width * (172 / 440))

  return (
    <Image
      source={logoSource}
      style={{ width, height, marginLeft: width * 0.04 }}
      resizeMode="contain"
      accessibilityLabel="Maixin Chinese logo"
    />
  )
}
