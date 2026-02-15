import { H2, Paragraph, YStack } from 'tamagui'

export default function HomeScreen() {
  return (
    <YStack flex={1} items="center" justify="center" gap="$4" px="$4" bg="$background">
      <H2>Dangdai</H2>
      <Paragraph color="$gray10">Learn Chinese through quizzes</Paragraph>
    </YStack>
  )
}
