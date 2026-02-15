import { Spinner, Text, YStack } from 'tamagui'

export function SplashScreen() {
  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      backgroundColor="$background"
    >
      <Spinner size="large" color="$primary" />
      <Text marginTop="$4" color="$gray11">
        Loading...
      </Text>
    </YStack>
  )
}
