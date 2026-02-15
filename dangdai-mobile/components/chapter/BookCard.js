System.register(["react/jsx-runtime", "tamagui", "@tamagui/lucide-icons"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, tamagui_1, lucide_icons_1;
    var __moduleName = context_1 && context_1.id;
    function BookCard({ book, progress, onPress }) {
        const progressPercent = progress.totalChapters > 0
            ? (progress.chaptersCompleted / progress.totalChapters) * 100
            : 0;
        return (_jsx(tamagui_1.Card, { elevate: true, bordered: true, padding: "$4", borderRadius: 12, pressStyle: { scale: 0.98 }, onPress: onPress, animation: "quick", testID: `book-card-${book.id}`, accessibilityRole: "button", accessibilityLabel: `${book.title}, ${progress.chaptersCompleted} of ${progress.totalChapters} chapters completed`, children: _jsxs(tamagui_1.XStack, { gap: "$4", alignItems: "center", children: [_jsx(tamagui_1.YStack, { width: 60, height: 80, backgroundColor: book.coverColor, borderRadius: "$2", justifyContent: "center", alignItems: "center", testID: `book-cover-${book.id}`, children: _jsx(tamagui_1.Text, { color: "white", fontSize: 24, fontWeight: "bold", children: book.id }) }), _jsxs(tamagui_1.YStack, { flex: 1, gap: "$2", children: [_jsx(tamagui_1.Text, { fontSize: 18, fontWeight: "600", testID: `book-title-${book.id}`, children: book.title }), _jsx(tamagui_1.Text, { fontSize: 14, color: "$gray11", testID: `book-title-chinese-${book.id}`, children: book.titleChinese }), _jsxs(tamagui_1.XStack, { alignItems: "center", gap: "$2", children: [_jsx(tamagui_1.Progress, { value: progressPercent, flex: 1, testID: `book-progress-bar-${book.id}`, children: _jsx(tamagui_1.Progress.Indicator, { animation: "bouncy" }) }), _jsxs(tamagui_1.Text, { fontSize: 12, color: "$gray10", testID: `book-progress-text-${book.id}`, children: [progress.chaptersCompleted, "/", progress.totalChapters] })] })] }), _jsx(lucide_icons_1.ChevronRight, { size: 24, color: "$gray10" })] }) }));
    }
    exports_1("BookCard", BookCard);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (tamagui_1_1) {
                tamagui_1 = tamagui_1_1;
            },
            function (lucide_icons_1_1) {
                lucide_icons_1 = lucide_icons_1_1;
            }
        ],
        execute: function () {
        }
    };
});
