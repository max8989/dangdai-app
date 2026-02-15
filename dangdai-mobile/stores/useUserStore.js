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
System.register(["zustand"], function (exports_1, context_1) {
    "use strict";
    var zustand_1, useUserStore;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (zustand_1_1) {
                zustand_1 = zustand_1_1;
            }
        ],
        execute: function () {
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
            exports_1("useUserStore", useUserStore = zustand_1.create((set) => ({
                // Initial state
                userId: null,
                displayName: null,
                totalPoints: 0,
                currentStreak: 0,
                // Actions
                setUser: (user) => set((state) => ({ ...state, ...user })),
                updatePoints: (points) => set({ totalPoints: points }),
                updateStreak: (streak) => set({ currentStreak: streak }),
                clearUser: () => set({
                    userId: null,
                    displayName: null,
                    totalPoints: 0,
                    currentStreak: 0,
                }),
            })));
        }
    };
});
