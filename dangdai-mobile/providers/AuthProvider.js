System.register(["react/jsx-runtime", "react", "expo-router", "@tamagui/toast", "../lib/supabase", "../lib/queryClient", "../stores/useUserStore", "../stores/useQuizStore"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, expo_router_1, toast_1, supabase_1, queryClient_1, useUserStore_1, useQuizStore_1, AuthContext;
    var __moduleName = context_1 && context_1.id;
    function AuthProvider({ children }) {
        const [session, setSession] = react_1.useState(null);
        const [loading, setLoading] = react_1.useState(true);
        const [isPasswordRecovery, setIsPasswordRecovery] = react_1.useState(false);
        const [error, setError] = react_1.useState(null);
        const segments = expo_router_1.useSegments();
        const navigationState = expo_router_1.useRootNavigationState();
        const toast = toast_1.useToastController();
        // Track if sign-out was manual (user-initiated) vs session expiry
        const wasManualSignOutRef = react_1.useRef(false);
        // Initialize session on mount
        react_1.useEffect(() => {
            supabase_1.supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
                setSession(currentSession);
                setLoading(false);
            });
            // Listen for auth state changes
            const { data: { subscription }, } = supabase_1.supabase.auth.onAuthStateChange((event, currentSession) => {
                setSession(currentSession);
                // Handle session expiry (SIGNED_OUT when not manual)
                if (event === 'SIGNED_OUT' && !wasManualSignOutRef.current) {
                    toast.show('Session expired', {
                        message: 'Please sign in again',
                        type: 'warning',
                    });
                }
                // Reset manual sign-out flag after handling
                if (event === 'SIGNED_OUT') {
                    wasManualSignOutRef.current = false;
                }
                // Handle password recovery flow
                if (event === 'PASSWORD_RECOVERY') {
                    setIsPasswordRecovery(true);
                    expo_router_1.router.push('/(auth)/reset-password');
                }
                // Clear password recovery flag after successful password update
                if (event === 'USER_UPDATED' && isPasswordRecovery) {
                    setIsPasswordRecovery(false);
                }
            });
            return () => subscription.unsubscribe();
        }, [toast, isPasswordRecovery]);
        // Handle routing based on auth state
        react_1.useEffect(() => {
            // Wait for both auth state and navigation to be ready
            if (loading || !navigationState?.key)
                return;
            const inAuthGroup = segments[0] === '(auth)';
            const onResetPasswordScreen = segments[1] === 'reset-password';
            // Allow reset-password screen during password recovery flow
            if (isPasswordRecovery && onResetPasswordScreen) {
                return;
            }
            if (!session && !inAuthGroup) {
                // Not signed in, redirect to login
                expo_router_1.router.replace('/(auth)/login');
            }
            else if (session && inAuthGroup && !isPasswordRecovery) {
                // Signed in, redirect to main app
                expo_router_1.router.replace('/(tabs)');
            }
        }, [session, segments, loading, isPasswordRecovery, navigationState?.key]);
        const signUp = react_1.useCallback(async (email, password) => {
            setError(null);
            try {
                const { error: signUpError } = await supabase_1.supabase.auth.signUp({
                    email,
                    password,
                });
                if (signUpError) {
                    const errorLower = signUpError.message.toLowerCase();
                    if (errorLower.includes('already registered') ||
                        errorLower.includes('user already registered') ||
                        errorLower.includes('email already exists')) {
                        setError({
                            message: 'Email already registered',
                            field: 'email',
                        });
                        return false;
                    }
                    if (errorLower.includes('invalid email')) {
                        setError({
                            message: 'Please enter a valid email',
                            field: 'email',
                        });
                        return false;
                    }
                    if (errorLower.includes('password')) {
                        setError({
                            message: 'Password must be at least 8 characters',
                            field: 'password',
                        });
                        return false;
                    }
                    setError({
                        message: signUpError.message,
                        field: 'general',
                    });
                    return false;
                }
                toast.show('Welcome!', {
                    message: 'Your account has been created successfully.',
                });
                return true;
            }
            catch (_err) {
                setError({
                    message: 'An unexpected error occurred. Please try again.',
                    field: 'general',
                });
                return false;
            }
        }, [toast]);
        const signIn = react_1.useCallback(async (email, password) => {
            setError(null);
            try {
                const { error: signInError } = await supabase_1.supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) {
                    const errorLower = signInError.message.toLowerCase();
                    if (errorLower.includes('invalid login credentials') ||
                        errorLower.includes('invalid email or password') ||
                        errorLower.includes('wrong password') ||
                        errorLower.includes('user not found')) {
                        setError({
                            message: 'Invalid email or password',
                            field: 'general',
                        });
                        return false;
                    }
                    if (errorLower.includes('email not confirmed')) {
                        setError({
                            message: 'Please verify your email first',
                            field: 'email',
                        });
                        return false;
                    }
                    setError({
                        message: 'Unable to sign in. Please try again.',
                        field: 'general',
                    });
                    return false;
                }
                toast.show('Welcome back!', {
                    message: 'You have signed in successfully.',
                });
                return true;
            }
            catch (_err) {
                setError({
                    message: 'An unexpected error occurred. Please try again.',
                    field: 'general',
                });
                return false;
            }
        }, [toast]);
        const resetPassword = react_1.useCallback(async (email) => {
            setError(null);
            try {
                const { error: resetError } = await supabase_1.supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: 'dangdai://reset-password',
                });
                if (resetError) {
                    console.error('Reset password error:', resetError);
                    const errorLower = resetError.message.toLowerCase();
                    if (errorLower.includes('rate limit') || errorLower.includes('too many')) {
                        setError({
                            message: 'Too many attempts. Please try again later.',
                            field: 'general',
                        });
                        return false;
                    }
                }
                // Always return success (don't reveal if email exists)
                return true;
            }
            catch (_err) {
                setError({
                    message: 'Unable to send reset link. Please try again.',
                    field: 'general',
                });
                return false;
            }
        }, []);
        const updatePassword = react_1.useCallback(async (newPassword) => {
            setError(null);
            try {
                const { error: updateError } = await supabase_1.supabase.auth.updateUser({
                    password: newPassword,
                });
                if (updateError) {
                    const errorLower = updateError.message.toLowerCase();
                    if (errorLower.includes('password') && errorLower.includes('weak')) {
                        setError({
                            message: 'Password is too weak. Please choose a stronger password.',
                            field: 'password',
                        });
                        return false;
                    }
                    if (errorLower.includes('same password')) {
                        setError({
                            message: 'New password must be different from your current password.',
                            field: 'password',
                        });
                        return false;
                    }
                    setError({
                        message: 'Unable to update password. Please try again.',
                        field: 'general',
                    });
                    return false;
                }
                toast.show('Password updated!', {
                    message: 'Your password has been changed successfully.',
                });
                return true;
            }
            catch (_err) {
                setError({
                    message: 'An unexpected error occurred. Please try again.',
                    field: 'general',
                });
                return false;
            }
        }, [toast]);
        const signOut = react_1.useCallback(async () => {
            setError(null);
            try {
                // Mark as manual sign-out before calling Supabase
                wasManualSignOutRef.current = true;
                const { error: signOutError } = await supabase_1.supabase.auth.signOut();
                if (signOutError) {
                    wasManualSignOutRef.current = false;
                    setError({
                        message: 'Unable to sign out. Please try again.',
                        field: 'general',
                    });
                    return false;
                }
                // Clear TanStack Query cache (server state)
                queryClient_1.queryClient.clear();
                // Clear Zustand stores (user-specific local state)
                useUserStore_1.useUserStore.getState().clearUser();
                useQuizStore_1.useQuizStore.getState().resetQuiz();
                toast.show('Signed out', {
                    message: 'You have been signed out successfully.',
                });
                return true;
            }
            catch (_err) {
                wasManualSignOutRef.current = false;
                setError({
                    message: 'An unexpected error occurred. Please try again.',
                    field: 'general',
                });
                return false;
            }
        }, [toast]);
        const clearError = react_1.useCallback(() => {
            setError(null);
        }, []);
        const value = react_1.useMemo(() => ({
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
        }), [
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
        ]);
        return _jsx(AuthContext.Provider, { value: value, children: children });
    }
    exports_1("AuthProvider", AuthProvider);
    function useAuth() {
        const context = react_1.useContext(AuthContext);
        if (!context) {
            throw new Error('useAuth must be used within AuthProvider');
        }
        return context;
    }
    exports_1("useAuth", useAuth);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (toast_1_1) {
                toast_1 = toast_1_1;
            },
            function (supabase_1_1) {
                supabase_1 = supabase_1_1;
            },
            function (queryClient_1_1) {
                queryClient_1 = queryClient_1_1;
            },
            function (useUserStore_1_1) {
                useUserStore_1 = useUserStore_1_1;
            },
            function (useQuizStore_1_1) {
                useQuizStore_1 = useQuizStore_1_1;
            }
        ],
        execute: function () {
            AuthContext = react_1.createContext(undefined);
        }
    };
});
