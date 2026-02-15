System.register(["react/jsx-runtime", "react", "react-native", "tamagui", "react-native-safe-area-context", "../../hooks/useAuth", "../../hooks/useSession"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, tamagui_1, react_native_safe_area_context_1, useAuth_1, useSession_1;
    var __moduleName = context_1 && context_1.id;
    function SettingsScreen() {
        const { signOut, isLoading, error } = useAuth_1.useAuth();
        const { user } = useSession_1.useSession();
        const [isSigningOut, setIsSigningOut] = react_1.useState(false);
        const handleSignOut = () => {
            // Show confirmation dialog
            if (react_native_1.Platform.OS === 'web') {
                // Web uses window.confirm
                const confirmed = window.confirm('Are you sure you want to sign out?');
                if (confirmed) {
                    performSignOut();
                }
            }
            else {
                // Native uses Alert.alert
                react_native_1.Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Sign Out',
                        style: 'destructive',
                        onPress: performSignOut,
                    },
                ], { cancelable: true });
            }
        };
        const performSignOut = async () => {
            setIsSigningOut(true);
            await signOut();
            setIsSigningOut(false);
        };
        return (_jsx(react_native_safe_area_context_1.SafeAreaView, { style: { flex: 1 }, edges: ['bottom'], children: _jsxs(tamagui_1.YStack, { flex: 1, padding: "$4", children: [_jsx(tamagui_1.H2, { marginBottom: "$4", children: "Settings" }), _jsxs(tamagui_1.YStack, { marginBottom: "$4", gap: "$1", children: [_jsx(tamagui_1.Text, { fontSize: "$3", color: "$colorSubtle", children: "Signed in as" }), _jsx(tamagui_1.Text, { fontSize: "$5", fontWeight: "600", children: user?.email ?? 'Loading...' })] }), _jsx(tamagui_1.Separator, { marginVertical: "$4" }), _jsx(tamagui_1.YStack, { gap: "$3", children: _jsx(tamagui_1.Text, { color: "$colorSubtle", fontSize: "$3", children: "More settings coming soon..." }) }), _jsx(tamagui_1.YStack, { flex: 1 }), error && (_jsx(tamagui_1.XStack, { backgroundColor: "$errorBackground", padding: "$3", borderRadius: "$3", marginBottom: "$3", accessibilityRole: "alert", children: _jsx(tamagui_1.Text, { color: "$error", children: error.message }) })), _jsx(tamagui_1.Button, { theme: "red", size: "$4", onPress: handleSignOut, disabled: isLoading || isSigningOut, icon: isSigningOut ? _jsx(tamagui_1.Spinner, { size: "small" }) : undefined, children: isSigningOut ? 'Signing Out...' : 'Sign Out' })] }) }));
    }
    exports_1("default", SettingsScreen);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (tamagui_1_1) {
                tamagui_1 = tamagui_1_1;
            },
            function (react_native_safe_area_context_1_1) {
                react_native_safe_area_context_1 = react_native_safe_area_context_1_1;
            },
            function (useAuth_1_1) {
                useAuth_1 = useAuth_1_1;
            },
            function (useSession_1_1) {
                useSession_1 = useSession_1_1;
            }
        ],
        execute: function () {
        }
    };
});
