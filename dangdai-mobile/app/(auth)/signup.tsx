import { YStack, H1, Text } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SignupForm } from '../../components/auth/SignupForm'

export default function SignupScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} paddingHorizontal="$4" gap="$4">
        <YStack gap="$2" paddingTop="$6" alignItems="center">
          <H1>Create Account</H1>
          <Text color="$colorSubtle">
            Start your Chinese learning journey
          </Text>
        </YStack>

        <SignupForm />
      </YStack>
    </SafeAreaView>
  )
}
