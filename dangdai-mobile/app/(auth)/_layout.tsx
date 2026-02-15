import { Stack } from 'expo-router'
import { useTheme } from 'tamagui'

export const unstable_settings = {
  // Make login the default/initial route for the auth group
  initialRouteName: 'login',
}

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
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
  )
}
