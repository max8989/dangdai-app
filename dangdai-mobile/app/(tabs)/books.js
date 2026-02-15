System.register(["react/jsx-runtime", "tamagui", "expo-router", "../../components/chapter/BookCard", "../../components/chapter/BookCardSkeleton", "../../hooks/useBooks", "../../constants/books"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, tamagui_1, expo_router_1, BookCard_1, BookCardSkeleton_1, useBooks_1, books_1;
    var __moduleName = context_1 && context_1.id;
    function BooksScreen() {
        const router = expo_router_1.useRouter();
        const { data: progress, isLoading, error } = useBooks_1.useBooks();
        const handleBookPress = (bookId) => {
            router.push(`/chapter/${bookId}`);
        };
        return (_jsxs(tamagui_1.YStack, { flex: 1, backgroundColor: "$background", testID: "books-screen", children: [_jsx(tamagui_1.YStack, { padding: "$4", paddingTop: "$6", children: _jsx(tamagui_1.Text, { fontSize: 28, fontWeight: "bold", testID: "books-header", children: "Books" }) }), isLoading ? (_jsx(tamagui_1.ScrollView, { testID: "books-list-loading", children: _jsx(tamagui_1.YStack, { padding: "$4", gap: "$4", children: _jsx(BookCardSkeleton_1.BookCardSkeleton, { count: 4 }) }) })) : error ? (_jsx(tamagui_1.YStack, { flex: 1, justifyContent: "center", alignItems: "center", padding: "$4", children: _jsx(tamagui_1.Text, { color: "$error", textAlign: "center", children: "Failed to load book progress. Please try again." }) })) : (_jsx(tamagui_1.ScrollView, { testID: "books-list", children: _jsx(tamagui_1.YStack, { padding: "$4", gap: "$4", children: books_1.BOOKS.map((book) => (_jsx(BookCard_1.BookCard, { book: book, progress: progress?.[book.id] ?? {
                                bookId: book.id,
                                chaptersCompleted: 0,
                                totalChapters: book.chapterCount,
                            }, onPress: () => handleBookPress(book.id) }, book.id))) }) }))] }));
    }
    exports_1("default", BooksScreen);
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
            function (BookCard_1_1) {
                BookCard_1 = BookCard_1_1;
            },
            function (BookCardSkeleton_1_1) {
                BookCardSkeleton_1 = BookCardSkeleton_1_1;
            },
            function (useBooks_1_1) {
                useBooks_1 = useBooks_1_1;
            },
            function (books_1_1) {
                books_1 = books_1_1;
            }
        ],
        execute: function () {
        }
    };
});
