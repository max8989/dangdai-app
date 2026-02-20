import { Spinner, Text, YStack } from 'tamagui'

import { APP_NAME } from '../constants/app'
import { BRAND_COLORS } from '../constants/app'

export function SplashScreen() {
  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      backgroundColor={BRAND_COLORS.SPLASH_BACKGROUND}
    >
      <Spinner size="large" color="#FFFFFF" />
      <Text marginTop="$4" color="#FFFFFF" fontSize="$5" fontWeight="600">
        {APP_NAME}
      </Text>
    </YStack>
  )
}
