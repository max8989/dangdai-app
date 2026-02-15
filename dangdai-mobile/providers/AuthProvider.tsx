import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { router, useRootNavigationState, useSegments } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

import { supabase } from '../lib/supabase'
import { queryClient } from '../lib/queryClient'
import { useUserStore } from '../stores/useUserStore'
import { useQuizStore } from '../stores/useQuizStore'

export interface AuthError {
  message: string
  field?: 'email' | 'password' | 'general'
}

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  isLoading: boolean // Alias for loading (backward compatibility)
  isPasswordRecovery: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<boolean>
  resetPassword: (email: string) => Promise<boolean>
  updatePassword: (newPassword: string) => Promise<boolean>
  error: AuthError | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const segments = useSegments()
  const navigationState = useRootNavigationState()
  const toast = useToastController()

  // Track if sign-out was manual (user-initiated) vs session expiry
  const wasManualSignOutRef = useRef(false)

  // Initialize session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setLoading(false)
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, currentSession: Session | null) => {
        setSession(currentSession)

        // Handle session expiry (SIGNED_OUT when not manual)
        if (event === 'SIGNED_OUT' && !wasManualSignOutRef.current) {
          toast.show('Session expired', {
            message: 'Please sign in again',
            type: 'warning',
          })
        }

        // Reset manual sign-out flag after handling
        if (event === 'SIGNED_OUT') {
          wasManualSignOutRef.current = false
        }

        // Handle password recovery flow
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true)
          router.push('/(auth)/reset-password')
        }

        // Clear password recovery flag after successful password update
        if (event === 'USER_UPDATED' && isPasswordRecovery) {
          setIsPasswordRecovery(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [toast, isPasswordRecovery])

  // Handle routing based on auth state
  useEffect(() => {
    // Wait for both auth state and navigation to be ready
    if (loading || !navigationState?.key) return

    const segmentsArray = segments as string[]
    const inAuthGroup = segmentsArray[0] === '(auth)'
    const onResetPasswordScreen = segmentsArray.length > 1 && segmentsArray[1] === 'reset-password'

    // Allow reset-password screen during password recovery flow
    if (isPasswordRecovery && onResetPasswordScreen) {
      return
    }

    if (!session && !inAuthGroup) {
      // Not signed in, redirect to login
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup && !isPasswordRecovery) {
      // Signed in, redirect to main app
      router.replace('/(tabs)')
    }
  }, [session, segments, loading, isPasswordRecovery, navigationState?.key])

  const signUp = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setError(null)

      try {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) {
          const errorLower = signUpError.message.toLowerCase()

          if (
            errorLower.includes('already registered') ||
            errorLower.includes('user already registered') ||
            errorLower.includes('email already exists')
          ) {
            setError({
              message: 'Email already registered',
              field: 'email',
            })
            return false
          }

          if (errorLower.includes('invalid email')) {
            setError({
              message: 'Please enter a valid email',
              field: 'email',
            })
            return false
          }

          if (errorLower.includes('password')) {
            setError({
              message: 'Password must be at least 8 characters',
              field: 'password',
            })
            return false
          }

          setError({
            message: signUpError.message,
            field: 'general',
          })
          return false
        }

        toast.show('Welcome!', {
          message: 'Your account has been created successfully.',
        })

        return true
      } catch (_err) {
        setError({
          message: 'An unexpected error occurred. Please try again.',
          field: 'general',
        })
        return false
      }
    },
    [toast]
  )

  const signIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setError(null)

      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          const errorLower = signInError.message.toLowerCase()

          if (
            errorLower.includes('invalid login credentials') ||
            errorLower.includes('invalid email or password') ||
            errorLower.includes('wrong password') ||
            errorLower.includes('user not found')
          ) {
            setError({
              message: 'Invalid email or password',
              field: 'general',
            })
            return false
          }

          if (errorLower.includes('email not confirmed')) {
            setError({
              message: 'Please verify your email first',
              field: 'email',
            })
            return false
          }

          setError({
            message: 'Unable to sign in. Please try again.',
            field: 'general',
          })
          return false
        }

        toast.show('Welcome back!', {
          message: 'You have signed in successfully.',
        })

        return true
      } catch (_err) {
        setError({
          message: 'An unexpected error occurred. Please try again.',
          field: 'general',
        })
        return false
      }
    },
    [toast]
  )

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setError(null)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'dangdai://reset-password',
      })

      if (resetError) {
        console.error('Reset password error:', resetError)

        const errorLower = resetError.message.toLowerCase()
        if (errorLower.includes('rate limit') || errorLower.includes('too many')) {
          setError({
            message: 'Too many attempts. Please try again later.',
            field: 'general',
          })
          return false
        }
      }

      // Always return success (don't reveal if email exists)
      return true
    } catch (_err) {
      setError({
        message: 'Unable to send reset link. Please try again.',
        field: 'general',
      })
      return false
    }
  }, [])

  const updatePassword = useCallback(
    async (newPassword: string): Promise<boolean> => {
      setError(null)

      try {
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        })

        if (updateError) {
          const errorLower = updateError.message.toLowerCase()

          if (errorLower.includes('password') && errorLower.includes('weak')) {
            setError({
              message: 'Password is too weak. Please choose a stronger password.',
              field: 'password',
            })
            return false
          }

          if (errorLower.includes('same password')) {
            setError({
              message: 'New password must be different from your current password.',
              field: 'password',
            })
            return false
          }

          setError({
            message: 'Unable to update password. Please try again.',
            field: 'general',
          })
          return false
        }

        toast.show('Password updated!', {
          message: 'Your password has been changed successfully.',
        })

        return true
      } catch (_err) {
        setError({
          message: 'An unexpected error occurred. Please try again.',
          field: 'general',
        })
        return false
      }
    },
    [toast]
  )

  const signOut = useCallback(async (): Promise<boolean> => {
    setError(null)

    try {
      // Mark as manual sign-out before calling Supabase
      wasManualSignOutRef.current = true

      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        wasManualSignOutRef.current = false
        setError({
          message: 'Unable to sign out. Please try again.',
          field: 'general',
        })
        return false
      }

      // Clear TanStack Query cache (server state)
      queryClient.clear()

      // Clear Zustand stores (user-specific local state)
      useUserStore.getState().clearUser()
      useQuizStore.getState().resetQuiz()

      toast.show('Signed out', {
        message: 'You have been signed out successfully.',
      })

      return true
    } catch (_err) {
      wasManualSignOutRef.current = false
      setError({
        message: 'An unexpected error occurred. Please try again.',
        field: 'general',
      })
      return false
    }
  }, [toast])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value = useMemo<AuthContextType>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isLoading: loading, // Alias for backward compatibility
      isPasswordRecovery,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      error,
      clearError,
    }),
    [
      session,
      loading,
      isPasswordRecovery,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      error,
      clearError,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
