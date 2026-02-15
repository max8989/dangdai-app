/**
 * useSession Hook
 *
 * Provides access to the current Supabase auth session and user.
 * Subscribes to auth state changes and returns the current session/user.
 */

import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'

import { supabase } from '../lib/supabase'

interface UseSessionReturn {
  session: Session | null
  user: User | null
  isLoading: boolean
}

/**
 * Hook to access the current auth session and user
 *
 * Usage:
 * ```tsx
 * import { useSession } from '../hooks/useSession';
 *
 * function MyComponent() {
 *   const { session, user, isLoading } = useSession();
 *
 *   if (isLoading) return <Loading />;
 *   if (!user) return <NotLoggedIn />;
 *
 *   return <Text>Hello, {user.email}</Text>;
 * }
 * ```
 */
export function useSession(): UseSessionReturn {
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

  return {
    session,
    user: session?.user ?? null,
    isLoading,
  }
}
