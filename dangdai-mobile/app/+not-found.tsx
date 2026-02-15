import { Link, Stack } from 'expo-router'
import { H2, Paragraph, YStack } from 'tamagui'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <YStack flex={1} items="center" justify="center" gap="$4" px="$4" bg="$background">
        <H2>This screen doesn't exist.</H2>
        <Link href="/">
          <Paragraph color="$blue10">Go to home screen!</Paragraph>
        </Link>
      </YStack>
    </>
  )
}
