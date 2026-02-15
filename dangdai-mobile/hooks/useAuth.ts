import { useState } from 'react'
import { router } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import { supabase } from '../lib/supabase'

export interface AuthError {
  message: string
  field?: 'email' | 'password' | 'general'
}

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const toast = useToastController()

  const signUp = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        // Handle specific error cases (case-insensitive matching for robustness)
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

        // Generic error
        setError({
          message: signUpError.message,
          field: 'general',
        })
        return false
      }

      // Success - user profile is auto-created by database trigger (Story 1.3)
      toast.show('Welcome!', {
        message: 'Your account has been created successfully.',
      })

      // Navigate to books screen (main app)
      router.replace('/(tabs)')

      return true
    } catch (_err) {
      setError({
        message: 'An unexpected error occurred. Please try again.',
        field: 'general',
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        // Per security best practices, never reveal whether email exists or password was wrong
        // Always show the same generic message for invalid credentials
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

        // Generic error for any other case
        setError({
          message: 'Unable to sign in. Please try again.',
          field: 'general',
        })
        return false
      }

      // Success - navigate to tabs (dashboard)
      toast.show('Welcome back!', {
        message: 'You have signed in successfully.',
      })

      router.replace('/(tabs)')

      return true
    } catch (_err) {
      setError({
        message: 'An unexpected error occurred. Please try again.',
        field: 'general',
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        setError({
          message: 'Unable to sign out. Please try again.',
          field: 'general',
        })
        return false
      }

      // Success - navigate to login
      toast.show('Signed out', {
        message: 'You have been signed out successfully.',
      })

      router.replace('/(auth)/login')

      return true
    } catch (_err) {
      setError({
        message: 'An unexpected error occurred. Please try again.',
        field: 'general',
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return {
    signUp,
    signIn,
    signOut,
    isLoading,
    error,
    clearError,
  }
}
