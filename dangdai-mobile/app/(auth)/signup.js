System.register(["react/jsx-runtime", "tamagui", "react-native-safe-area-context", "../../components/auth/SignupForm"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, tamagui_1, react_native_safe_area_context_1, SignupForm_1;
    var __moduleName = context_1 && context_1.id;
    function SignupScreen() {
        return (_jsx(react_native_safe_area_context_1.SafeAreaView, { style: { flex: 1 }, children: _jsxs(tamagui_1.YStack, { flex: 1, paddingHorizontal: "$4", gap: "$4", children: [_jsxs(tamagui_1.YStack, { gap: "$2", paddingTop: "$6", alignItems: "center", children: [_jsx(tamagui_1.H1, { children: "Create Account" }), _jsx(tamagui_1.Text, { color: "$colorSubtle", children: "Start your Chinese learning journey" })] }), _jsx(SignupForm_1.SignupForm, {})] }) }));
    }
    exports_1("default", SignupScreen);
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
            function (SignupForm_1_1) {
                SignupForm_1 = SignupForm_1_1;
            }
        ],
        execute: function () {
        }
    };
});
