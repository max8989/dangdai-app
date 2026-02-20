import { Link, Stack } from 'expo-router'
import { H2, Paragraph, YStack } from 'tamagui'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4" paddingHorizontal="$4" backgroundColor="$background">
        <H2>This screen doesn't exist.</H2>
        <Link href="/">
          <Paragraph color="$blue10">Go to home screen!</Paragraph>
        </Link>
      </YStack>
    </>
  )
}
