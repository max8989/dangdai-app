System.register(["react/jsx-runtime", "../tamagui.generated.css", "react", "react-native", "expo-status-bar", "@react-navigation/native", "expo-font", "expo-router", "components/Provider", "../providers/AuthProvider", "../components/SplashScreen", "../lib/supabase"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, expo_status_bar_1, native_1, expo_font_1, expo_router_1, Provider_1, AuthProvider_1, SplashScreen_1, supabase_1, customLightTheme, customDarkTheme, unstable_settings, Providers;
    var __moduleName = context_1 && context_1.id;
    function RootLayout() {
        const [interLoaded, interError] = expo_font_1.useFonts({
            Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
            InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
        });
        react_1.useEffect(() => {
            if (interLoaded || interError) {
                // Hide the splash screen after the fonts have loaded (or an error was returned) and the UI is ready.
                expo_router_1.SplashScreen.hideAsync();
            }
        }, [interLoaded, interError]);
        // Test Supabase connection (only in development mode)
        react_1.useEffect(() => {
            const testSupabaseConnection = async () => {
                try {
                    const { error } = await supabase_1.supabase.from('users').select('count');
                    if (error) {
                        console.log('[Supabase] Connection test - Error:', error.message);
                    }
                    else {
                        console.log('[Supabase] Connection test - Success!');
                    }
                }
                catch (err) {
                    console.log('[Supabase] Connection test - Exception:', err);
                }
            };
            if (__DEV__) {
                testSupabaseConnection();
            }
        }, []);
        if (!interLoaded && !interError) {
            return null;
        }
        return (_jsx(Providers, { children: _jsx(RootLayoutNav, {}) }));
    }
    exports_1("default", RootLayout);
    function RootLayoutNav() {
        const colorScheme = react_native_1.useColorScheme();
        const { loading } = AuthProvider_1.useAuth();
        // Show splash screen while loading auth state
        if (loading) {
            return _jsx(SplashScreen_1.SplashScreen, {});
        }
        return (_jsxs(native_1.ThemeProvider, { value: colorScheme === 'dark' ? customDarkTheme : customLightTheme, children: [_jsx(expo_status_bar_1.StatusBar, { style: colorScheme === 'dark' ? 'light' : 'dark' }), _jsxs(expo_router_1.Stack, { children: [_jsx(expo_router_1.Stack.Screen, { name: "(auth)", options: {
                                headerShown: false,
                            } }), _jsx(expo_router_1.Stack.Screen, { name: "(tabs)", options: {
                                headerShown: false,
                            } }), _jsx(expo_router_1.Stack.Screen, { name: "modal", options: {
                                title: 'Dangdai',
                                presentation: 'modal',
                                animation: 'slide_from_right',
                                gestureEnabled: true,
                                gestureDirection: 'horizontal',
                            } }), _jsx(expo_router_1.Stack.Screen, { name: "chapter/[bookId]", options: {
                                headerShown: true,
                                animation: 'slide_from_right',
                            } })] })] }));
    }
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (_1) {
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (expo_status_bar_1_1) {
                expo_status_bar_1 = expo_status_bar_1_1;
            },
            function (native_1_1) {
                native_1 = native_1_1;
            },
            function (expo_font_1_1) {
                expo_font_1 = expo_font_1_1;
            },
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
                exports_1({
                    "ErrorBoundary": expo_router_1_1["ErrorBoundary"]
                });
            },
            function (Provider_1_1) {
                Provider_1 = Provider_1_1;
            },
            function (AuthProvider_1_1) {
                AuthProvider_1 = AuthProvider_1_1;
            },
            function (SplashScreen_1_1) {
                SplashScreen_1 = SplashScreen_1_1;
            },
            function (supabase_1_1) {
                supabase_1 = supabase_1_1;
            }
        ],
        execute: function () {
            // Custom navigation themes matching UX spec colors
            customLightTheme = {
                ...native_1.DefaultTheme,
                colors: {
                    ...native_1.DefaultTheme.colors,
                    primary: '#06B6D4',
                    background: '#FAFAF9',
                    card: '#FAFAF9',
                    text: '#1C1917',
                    border: '#D6D3D1',
                    notification: '#FB923C',
                },
            };
            customDarkTheme = {
                ...native_1.DarkTheme,
                colors: {
                    ...native_1.DarkTheme.colors,
                    primary: '#22D3EE',
                    background: '#0C0A09',
                    card: '#0C0A09',
                    text: '#FAFAF9',
                    border: '#44403C',
                    notification: '#FDBA74',
                },
            };
            exports_1("unstable_settings", unstable_settings = {
                // Ensure that reloading on `/modal` keeps a back button present.
                initialRouteName: '(tabs)',
            });
            // Prevent the splash screen from auto-hiding before asset loading is complete.
            expo_router_1.SplashScreen.preventAutoHideAsync();
            Providers = ({ children }) => {
                // Per architecture spec: AuthProvider wraps QueryClientProvider wraps TamaguiProvider
                // AuthProvider needs access to ToastProvider (inside Provider) for session expiry toasts
                // So we nest: Provider (Tamagui+Query+Toast) > AuthProvider > children
                return (_jsx(Provider_1.Provider, { children: _jsx(AuthProvider_1.AuthProvider, { children: children }) }));
            };
        }
    };
});
