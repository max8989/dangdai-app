System.register(["react/jsx-runtime", "expo-router", "tamagui"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, expo_router_1, tamagui_1;
    var __moduleName = context_1 && context_1.id;
    function NotFoundScreen() {
        return (_jsxs(_Fragment, { children: [_jsx(expo_router_1.Stack.Screen, { options: { title: 'Oops!' } }), _jsxs(tamagui_1.YStack, { flex: 1, items: "center", justify: "center", gap: "$4", px: "$4", bg: "$background", children: [_jsx(tamagui_1.H2, { children: "This screen doesn't exist." }), _jsx(expo_router_1.Link, { href: "/", children: _jsx(tamagui_1.Paragraph, { color: "$blue10", children: "Go to home screen!" }) })] })] }));
    }
    exports_1("default", NotFoundScreen);
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
        }
    };
});
