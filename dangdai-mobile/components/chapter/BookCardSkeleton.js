System.register(["react/jsx-runtime", "tamagui"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, tamagui_1;
    var __moduleName = context_1 && context_1.id;
    /**
     * Single skeleton card that mimics the BookCard layout.
     */
    function SingleSkeleton() {
        return (_jsx(tamagui_1.Card, { elevate: true, bordered: true, padding: "$4", borderRadius: 12, animation: "lazy", opacity: 0.7, children: _jsxs(tamagui_1.XStack, { gap: "$4", alignItems: "center", children: [_jsx(tamagui_1.Stack, { width: 60, height: 80, backgroundColor: "$gray6", borderRadius: "$2", animation: "lazy" }), _jsxs(tamagui_1.YStack, { flex: 1, gap: "$2", children: [_jsx(tamagui_1.Stack, { height: 20, width: "60%", backgroundColor: "$gray6", borderRadius: "$2", animation: "lazy" }), _jsx(tamagui_1.Stack, { height: 16, width: "80%", backgroundColor: "$gray5", borderRadius: "$2", animation: "lazy" }), _jsxs(tamagui_1.XStack, { alignItems: "center", gap: "$2", children: [_jsx(tamagui_1.Stack, { flex: 1, height: 8, backgroundColor: "$gray5", borderRadius: "$1", animation: "lazy" }), _jsx(tamagui_1.Stack, { width: 40, height: 14, backgroundColor: "$gray5", borderRadius: "$2", animation: "lazy" })] })] }), _jsx(tamagui_1.Stack, { width: 24, height: 24, backgroundColor: "$gray5", borderRadius: "$2", animation: "lazy" })] }) }));
    }
    /**
     * Renders multiple skeleton cards for loading state.
     * Default count is 4 (matching the number of books in the app).
     */
    function BookCardSkeleton({ count = 4 }) {
        return (_jsx(_Fragment, { children: Array.from({ length: count }).map((_, index) => (_jsx(SingleSkeleton, {}, index))) }));
    }
    exports_1("BookCardSkeleton", BookCardSkeleton);
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
