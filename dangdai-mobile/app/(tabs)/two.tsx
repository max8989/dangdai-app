import { H2, Paragraph, YStack } from 'tamagui'

export default function SettingsScreen() {
  return (
    <YStack flex={1} items="center" justify="center" gap="$4" px="$4" bg="$background">
      <H2>Settings</H2>
      <Paragraph color="$gray10">App settings will appear here</Paragraph>
    </YStack>
  )
}
