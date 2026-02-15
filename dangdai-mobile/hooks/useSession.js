/**
 * useSession Hook
 *
 * Provides access to the current Supabase auth session and user.
 * Subscribes to auth state changes and returns the current session/user.
 */
System.register(["react", "../lib/supabase"], function (exports_1, context_1) {
    "use strict";
    var react_1, supabase_1;
    var __moduleName = context_1 && context_1.id;
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
    function useSession() {
        const [session, setSession] = react_1.useState(null);
        const [isLoading, setIsLoading] = react_1.useState(true);
        react_1.useEffect(() => {
            // Get initial session
            supabase_1.supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
                setIsLoading(false);
            });
            // Listen for auth state changes
            const { data: { subscription }, } = supabase_1.supabase.auth.onAuthStateChange((_event, session) => {
                setSession(session);
            });
            return () => subscription.unsubscribe();
        }, []);
        return {
            session,
            user: session?.user ?? null,
            isLoading,
        };
    }
    exports_1("useSession", useSession);
    return {
        setters: [
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (supabase_1_1) {
                supabase_1 = supabase_1_1;
            }
        ],
        execute: function () {
        }
    };
});
