import { H2, Paragraph, YStack } from 'tamagui'

export default function ModalScreen() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$4" paddingHorizontal="$4" backgroundColor="$background">
      <H2>Modal</H2>
      <Paragraph color="$gray10">Modal content will appear here</Paragraph>
    </YStack>
  )
}
