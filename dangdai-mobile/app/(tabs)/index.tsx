import { H2, Paragraph, YStack } from 'tamagui'

export default function HomeScreen() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$4" paddingHorizontal="$4" backgroundColor="$background">
      <H2>Dangdai</H2>
      <Paragraph color="$colorSubtle">Learn Chinese through quizzes</Paragraph>
    </YStack>
  )
}
