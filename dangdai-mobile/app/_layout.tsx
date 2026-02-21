import '../tamagui.generated.css'

import { useEffect, useRef, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack, useRouter } from 'expo-router'
import {
  AlertDialog,
  YStack,
  XStack,
  Theme,
  Button,
} from 'tamagui'

import { Provider } from 'components/Provider'
import { AuthProvider, useAuth } from '../providers/AuthProvider'
import { SplashScreen as AppSplashScreen } from '../components/SplashScreen'
import { supabase } from '../lib/supabase'
import { useResolvedColorScheme } from '../hooks/useResolvedColorScheme'
import { APP_NAME } from '../constants/app'
import { useQuizStore } from '../stores/useQuizStore'
import { useQuizPersistence } from '../hooks/useQuizPersistence'
import { EXERCISE_TYPE_LABELS } from '../types/quiz'
import type { ExerciseType } from '../types/quiz'

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

/**
 * Quiz resume dialog (Story 4.10, Task 6).
 *
 * Shown once per app launch when a resumable quiz is detected after Zustand
 * hydration completes and the user is authenticated.
 */
function QuizResumeDialog() {
  const router = useRouter()
  const { user } = useAuth()
  const hasHydrated = useQuizStore((state) => state._hasHydrated)
  const { checkForResumableQuiz, clearResumableQuiz } = useQuizPersistence()

  const [showDialog, setShowDialog] = useState(false)
  const [resumeInfo, setResumeInfo] = useState<{
    currentQuestion: number
    totalQuestions: number
    exerciseType: string | null
  } | null>(null)

  // Only show the dialog once per app launch (Task 6.5)
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    // Wait for Zustand hydration to complete before checking (Task 6.1)
    if (!hasHydrated) return
    // Do not show dialog if user is not authenticated (Task 6.6)
    if (!user) return
    // Only check once per app launch (Task 6.5)
    if (hasCheckedRef.current) return

    hasCheckedRef.current = true

    const resumable = checkForResumableQuiz()
    if (resumable) {
      setResumeInfo({
        currentQuestion: resumable.currentQuestion,
        totalQuestions: resumable.totalQuestions,
        exerciseType: resumable.exerciseType,
      })
      setShowDialog(true)
    }
  }, [hasHydrated, user, checkForResumableQuiz])

  const handleResume = () => {
    setShowDialog(false)
    // The play screen reads existing state from useQuizStore (already hydrated) (Task 6.3)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push('/quiz/play' as any)
  }

  const handleDiscard = () => {
    setShowDialog(false)
    clearResumableQuiz()
  }

  if (!resumeInfo) return null

  const exerciseLabel =
    EXERCISE_TYPE_LABELS[(resumeInfo.exerciseType ?? '') as ExerciseType] ??
    resumeInfo.exerciseType ??
    'Quiz'

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />

        <AlertDialog.Content
          key="content"
          bordered
          elevate
          animation={[
            'medium',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ opacity: 0, scale: 0.95, y: -10 }}
          exitStyle={{ opacity: 0, scale: 0.95, y: 10 }}
          backgroundColor="$background"
          borderColor="$borderColor"
          borderWidth={1}
          padding="$4"
          borderRadius="$4"
          width={320}
          maxWidth="90%"
        >
          <YStack gap="$3">
            <AlertDialog.Title fontSize="$6" fontWeight="600" color="$color">
              Resume Quiz?
            </AlertDialog.Title>

            <AlertDialog.Description color="$colorSubtle" fontSize="$4">
              You have an unfinished {exerciseLabel} quiz (Q{resumeInfo.currentQuestion + 1}/
              {resumeInfo.totalQuestions}). Resume where you left off?
            </AlertDialog.Description>

            <XStack gap="$3" justifyContent="flex-end" marginTop="$2">
              <Button
                onPress={handleDiscard}
                bordered
                pressStyle={{ scale: 0.98 }}
              >
                Discard
              </Button>

              <Theme name="primary">
                <Button
                  onPress={handleResume}
                  theme="primary"
                  pressStyle={{ scale: 0.98 }}
                >
                  Resume
                </Button>
              </Theme>
            </XStack>
          </YStack>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
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
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark' } />
      {/* Quiz resume dialog — checks for crash-recovered quiz after Zustand hydration (Story 4.10) */}
      <QuizResumeDialog />
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
