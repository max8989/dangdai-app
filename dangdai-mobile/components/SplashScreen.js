System.register(["react/jsx-runtime", "tamagui"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, tamagui_1;
    var __moduleName = context_1 && context_1.id;
    function SplashScreen() {
        return (_jsxs(tamagui_1.YStack, { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "$background", children: [_jsx(tamagui_1.Spinner, { size: "large", color: "$primary" }), _jsx(tamagui_1.Text, { marginTop: "$4", color: "$gray11", children: "Loading..." })] }));
    }
    exports_1("SplashScreen", SplashScreen);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (tamagui_1_1) {
                tamagui_1 = tamagui_1_1;
            }
        ],
        execute: function () {
        }
    };
});
