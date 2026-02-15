System.register(["react/jsx-runtime", "tamagui"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, tamagui_1;
    var __moduleName = context_1 && context_1.id;
    function ModalScreen() {
        return (_jsxs(tamagui_1.YStack, { flex: 1, items: "center", justify: "center", gap: "$4", px: "$4", bg: "$background", children: [_jsx(tamagui_1.H2, { children: "Modal" }), _jsx(tamagui_1.Paragraph, { color: "$gray10", children: "Modal content will appear here" })] }));
    }
    exports_1("default", ModalScreen);
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
