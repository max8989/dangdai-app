/**
 * User Store
 *
 * Per architecture specification:
 * - Auth state is managed by Supabase Auth (session, tokens)
 * - Server data (user profile) is managed by TanStack Query
 * - This Zustand store caches user data locally for fast UI access
 *
 * This store provides a local cache of user data that can be quickly
 * accessed without waiting for network requests. It's synced from
 * TanStack Query results.
 */

import { create } from 'zustand'

/**
 * Cached user data for fast access
 */
interface UserState {
  // Cached user profile
  userId: string | null
  displayName: string | null
  totalPoints: number
  currentStreak: number

  // Actions
  setUser: (user: Partial<UserState>) => void
  updatePoints: (points: number) => void
  updateStreak: (streak: number) => void
  clearUser: () => void
}

/**
 * User store for caching user data locally
 *
 * Usage:
 * ```tsx
 * import { useUserStore } from '../stores/useUserStore';
 *
 * function Dashboard() {
 *   const { displayName, totalPoints, currentStreak } = useUserStore();
 *   // Fast access to cached user data
 * }
 * ```
 *
 * Syncing from TanStack Query:
 * ```tsx
 * const { data: profile } = useQuery({ queryKey: queryKeys.userProfile(userId) });
 *
 * useEffect(() => {
 *   if (profile) {
 *     useUserStore.getState().setUser({
 *       userId: profile.id,
 *       displayName: profile.display_name,
 *       totalPoints: profile.total_points,
 *       currentStreak: profile.current_streak,
 *     });
 *   }
 * }, [profile]);
 * ```
 */
export const useUserStore = create<UserState>((set) => ({
  // Initial state
  userId: null,
  displayName: null,
  totalPoints: 0,
  currentStreak: 0,

  // Actions
  setUser: (user) => set((state) => ({ ...state, ...user })),

  updatePoints: (points) => set({ totalPoints: points }),

  updateStreak: (streak) => set({ currentStreak: streak }),

  clearUser: () =>
    set({
      userId: null,
      displayName: null,
      totalPoints: 0,
      currentStreak: 0,
    }),
}))
