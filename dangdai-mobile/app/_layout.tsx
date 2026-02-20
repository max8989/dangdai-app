import '../tamagui.generated.css'

import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack } from 'expo-router'

import { Provider } from 'components/Provider'
import { AuthProvider, useAuth } from '../providers/AuthProvider'
import { SplashScreen as AppSplashScreen } from '../components/SplashScreen'
import { supabase } from '../lib/supabase'
import { useResolvedColorScheme } from '../hooks/useResolvedColorScheme'
import { APP_NAME } from '../constants/app'

// Custom navigation themes matching UX spec colors
const customLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#06B6D4',
    background: '#FAFAF9',
    card: '#FAFAF9',
    text: '#1C1917',
    border: '#D6D3D1',
    notification: '#FB923C',
  },
}

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#22D3EE',
    background: '#0C0A09',
    card: '#0C0A09',
    text: '#FAFAF9',
    border: '#44403C',
    notification: '#FDBA74',
  },
}

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router'

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [interLoaded, interError] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Regular.otf'),
    InterMedium: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterSemiBold: require('@tamagui/font-inter/otf/Inter-SemiBold.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })

  useEffect(() => {
    if (interLoaded || interError) {
      // Hide the splash screen after the fonts have loaded (or an error was returned) and the UI is ready.
      SplashScreen.hideAsync()
    }
  }, [interLoaded, interError])

  // Test Supabase connection (only in development mode)
  useEffect(() => {
    const testSupabaseConnection = async () => {
      try {
        const { error } = await supabase.from('users').select('count')
        if (error) {
          console.log('[Supabase] Connection test - Error:', error.message)
        } else {
          console.log('[Supabase] Connection test - Success!')
        }
      } catch (err) {
        console.log('[Supabase] Connection test - Exception:', err)
      }
    }

    if (__DEV__) {
      testSupabaseConnection()
    }
  }, [])

  if (!interLoaded && !interError) {
    return null
  }

  return (
    <Providers>
      <RootLayoutNav />
    </Providers>
  )
}

const Providers = ({ children }: { children: React.ReactNode }) => {
  // Per architecture spec: AuthProvider wraps QueryClientProvider wraps TamaguiProvider
  // AuthProvider needs access to ToastProvider (inside Provider) for session expiry toasts
  // So we nest: Provider (Tamagui+Query+Toast) > AuthProvider > children
  return (
    <Provider>
      <AuthProvider>{children}</AuthProvider>
    </Provider>
  )
}

function RootLayoutNav() {
  const colorScheme = useResolvedColorScheme()
  const { loading } = useAuth()

  // Show splash screen while loading auth state
  if (loading) {
    return <AppSplashScreen />
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? customDarkTheme : customLightTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="modal"
          options={{
            title: APP_NAME,
            presentation: 'modal',
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        />

        <Stack.Screen
          name="chapter/[bookId]"
          options={{
            headerShown: true,
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </ThemeProvider>
  )
}
