System.register(["react/jsx-runtime", "tamagui"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, tamagui_1;
    var __moduleName = context_1 && context_1.id;
    function HomeScreen() {
        return (_jsxs(tamagui_1.YStack, { flex: 1, items: "center", justify: "center", gap: "$4", px: "$4", bg: "$background", children: [_jsx(tamagui_1.H2, { children: "Dangdai" }), _jsx(tamagui_1.Paragraph, { color: "$colorSubtle", children: "Learn Chinese through quizzes" })] }));
    }
    exports_1("default", HomeScreen);
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
