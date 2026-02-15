System.register(["react/jsx-runtime", "tamagui", "react-native-safe-area-context", "../../components/auth/ResetPasswordForm"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, tamagui_1, react_native_safe_area_context_1, ResetPasswordForm_1;
    var __moduleName = context_1 && context_1.id;
    function ResetPasswordScreen() {
        return (_jsx(react_native_safe_area_context_1.SafeAreaView, { style: { flex: 1 }, children: _jsxs(tamagui_1.YStack, { flex: 1, paddingHorizontal: "$4", gap: "$4", children: [_jsxs(tamagui_1.YStack, { gap: "$2", paddingTop: "$6", alignItems: "center", children: [_jsx(tamagui_1.H1, { children: "Set New Password" }), _jsx(tamagui_1.Text, { color: "$colorSubtle", textAlign: "center", children: "Enter your new password below" })] }), _jsx(ResetPasswordForm_1.ResetPasswordForm, {})] }) }));
    }
    exports_1("default", ResetPasswordScreen);
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
            function (ResetPasswordForm_1_1) {
                ResetPasswordForm_1 = ResetPasswordForm_1_1;
            }
        ],
        execute: function () {
        }
    };
});
