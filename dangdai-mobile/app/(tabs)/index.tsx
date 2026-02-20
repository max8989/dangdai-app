import { H2, Paragraph, YStack } from 'tamagui'

import { APP_NAME } from '../../constants/app'

export default function HomeScreen() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$4" paddingHorizontal="$4" backgroundColor="$background">
      <H2>{APP_NAME}</H2>
      <Paragraph color="$colorSubtle">Learn Chinese through quizzes</Paragraph>
    </YStack>
  )
}
