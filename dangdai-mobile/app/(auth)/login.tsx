import { YStack, H1, Text } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LoginForm } from '../../components/auth/LoginForm'

export default function LoginScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} paddingHorizontal="$4" gap="$4">
        <YStack gap="$2" paddingTop="$6" alignItems="center">
          <H1>Sign In</H1>
          <Text color="$colorSubtle">
            Welcome back to your Chinese learning journey
          </Text>
        </YStack>

        <LoginForm />
      </YStack>
    </SafeAreaView>
  )
}
