import { H2, Paragraph, YStack } from 'tamagui'

export default function ModalScreen() {
  return (
    <YStack flex={1} items="center" justify="center" gap="$4" px="$4" bg="$background">
      <H2>Modal</H2>
      <Paragraph color="$gray10">Modal content will appear here</Paragraph>
    </YStack>
  )
}
