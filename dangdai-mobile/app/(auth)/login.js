System.register(["react/jsx-runtime", "tamagui", "react-native-safe-area-context", "../../components/auth/LoginForm"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, tamagui_1, react_native_safe_area_context_1, LoginForm_1;
    var __moduleName = context_1 && context_1.id;
    function LoginScreen() {
        return (_jsx(react_native_safe_area_context_1.SafeAreaView, { style: { flex: 1 }, children: _jsxs(tamagui_1.YStack, { flex: 1, paddingHorizontal: "$4", gap: "$4", children: [_jsxs(tamagui_1.YStack, { gap: "$2", paddingTop: "$6", alignItems: "center", children: [_jsx(tamagui_1.H1, { children: "Sign In" }), _jsx(tamagui_1.Text, { color: "$colorSubtle", children: "Welcome back to your Chinese learning journey" })] }), _jsx(LoginForm_1.LoginForm, {})] }) }));
    }
    exports_1("default", LoginScreen);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (tamagui_1_1) {
                tamagui_1 = tamagui_1_1;
            },
            function (react_native_safe_area_context_1_1) {
                react_native_safe_area_context_1 = react_native_safe_area_context_1_1;
            },
            function (LoginForm_1_1) {
                LoginForm_1 = LoginForm_1_1;
            }
        ],
        execute: function () {
        }
    };
});
