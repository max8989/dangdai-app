import { Stack } from 'expo-router'
import { useTheme } from 'tamagui'

export default function AuthLayout() {
  const theme = useTheme()

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.background.val,
        },
      }}
    >
      <Stack.Screen name="signup" />
      <Stack.Screen name="login" />
    </Stack>
  )
}
