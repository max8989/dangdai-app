System.register(["react/jsx-runtime", "tamagui", "expo-router", "../../constants/books"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, tamagui_1, expo_router_1, books_1;
    var __moduleName = context_1 && context_1.id;
    function ChapterListScreen() {
        const { bookId } = expo_router_1.useLocalSearchParams();
        const book = books_1.BOOKS.find((b) => b.id === Number(bookId));
        return (_jsxs(_Fragment, { children: [_jsx(expo_router_1.Stack.Screen, { options: {
                        title: book?.title ?? 'Chapters',
                        headerBackTitle: 'Books',
                    } }), _jsxs(tamagui_1.YStack, { flex: 1, backgroundColor: "$background", padding: "$4", testID: "chapter-list-screen", children: [_jsx(tamagui_1.Text, { fontSize: 24, fontWeight: "bold", testID: "chapter-list-header", children: book?.titleChinese ?? 'Unknown Book' }), _jsx(tamagui_1.Text, { color: "$gray11", marginTop: "$2", children: "Chapter list coming soon (Story 3.2)" })] })] }));
    }
    exports_1("default", ChapterListScreen);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (tamagui_1_1) {
                tamagui_1 = tamagui_1_1;
            },
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (books_1_1) {
                books_1 = books_1_1;
            }
        ],
        execute: function () {
        }
    };
});
