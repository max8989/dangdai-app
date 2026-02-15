import '../tamagui.generated.css'

import { useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router'
import { Provider } from 'components/Provider'
import { useTheme } from 'tamagui'
import { Session } from '@supabase/supabase-js'

import { supabase } from '../lib/supabase'

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
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
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
        const { data, error } = await supabase.from('users').select('count')
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
  return <Provider>{children}</Provider>
}

// Hook to handle auth-based navigation
function useProtectedRoute(session: Session | null, isLoading: boolean) {
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    // Don't redirect while loading auth state
    if (isLoading) return

    // Check if the user is on an auth screen
    const inAuthGroup = segments[0] === '(auth)'

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated and not on auth screen
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      // Redirect to dashboard if authenticated and on auth screen
      router.replace('/(tabs)')
    }
  }, [session, segments, isLoading])
}

function RootLayoutNav() {
  const colorScheme = useColorScheme()
  const theme = useTheme()
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Handle protected route navigation
  useProtectedRoute(session, isLoading)

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
            title: 'Dangdai',
            presentation: 'modal',
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            contentStyle: {
              backgroundColor: theme.background.val,
            },
          }}
        />
      </Stack>
    </ThemeProvider>
  )
}
