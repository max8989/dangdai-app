System.register(["react/jsx-runtime", "expo-router", "tamagui"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, expo_router_1, tamagui_1, unstable_settings;
    var __moduleName = context_1 && context_1.id;
    function AuthLayout() {
        const theme = tamagui_1.useTheme();
        return (_jsxs(expo_router_1.Stack, { screenOptions: {
                headerShown: false,
                contentStyle: {
                    backgroundColor: theme.background.val,
                },
            }, children: [_jsx(expo_router_1.Stack.Screen, { name: "login" }), _jsx(expo_router_1.Stack.Screen, { name: "signup" }), _jsx(expo_router_1.Stack.Screen, { name: "forgot-password" }), _jsx(expo_router_1.Stack.Screen, { name: "reset-password" })] }));
    }
    exports_1("default", AuthLayout);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (tamagui_1_1) {
                tamagui_1 = tamagui_1_1;
            }
        ],
        execute: function () {
            exports_1("unstable_settings", unstable_settings = {
                // Make login the default/initial route for the auth group
                initialRouteName: 'login',
            });
        }
    };
});
