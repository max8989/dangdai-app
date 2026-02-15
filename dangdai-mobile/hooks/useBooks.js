/**
 * useBooks Hook
 *
 * Fetches book progress data from Supabase chapter_progress table.
 * Returns progress for each book (chapters completed / total chapters).
 *
 * Note: If chapter_progress table doesn't exist yet (Story 6.1),
 * the query returns empty results and all books show 0/X progress.
 */
System.register(["@tanstack/react-query", "../lib/supabase", "../providers/AuthProvider", "../lib/queryKeys", "../constants/books"], function (exports_1, context_1) {
    "use strict";
    var react_query_1, supabase_1, AuthProvider_1, queryKeys_1, books_1;
    var __moduleName = context_1 && context_1.id;
    /**
     * Returns default progress (0 chapters completed) for all books.
     * Used when user is not authenticated or chapter_progress table doesn't exist.
     */
    function getDefaultProgress() {
        return books_1.BOOKS.reduce((acc, book) => {
            acc[book.id] = {
                bookId: book.id,
                chaptersCompleted: 0,
                totalChapters: book.chapterCount,
            };
            return acc;
        }, {});
    }
    function useBooks() {
        const { user } = AuthProvider_1.useAuth();
        return react_query_1.useQuery({
            // Only include user.id in queryKey when user exists to prevent caching under empty string
            queryKey: user ? queryKeys_1.queryKeys.books(user.id) : queryKeys_1.queryKeys.booksAll,
            queryFn: async () => {
                // This should not happen due to enabled: !!user, but handle gracefully
                if (!user) {
                    return getDefaultProgress();
                }
                // Query chapter_progress grouped by book_id
                // Only count chapters with completion_percentage >= 80 as "completed"
                const { data, error } = await supabase_1.supabase
                    .from('chapter_progress')
                    .select('book_id, completion_percentage')
                    .eq('user_id', user.id)
                    .gte('completion_percentage', 80);
                if (error) {
                    // If table doesn't exist yet, return empty progress
                    // This handles the case before Story 6.1 is implemented
                    if (error.code === '42P01' || error.message?.includes('does not exist')) {
                        console.warn('chapter_progress table does not exist yet');
                        return getDefaultProgress();
                    }
                    throw error;
                }
                // Group by book and count completed chapters
                const progressByBook = {};
                data?.forEach((row) => {
                    progressByBook[row.book_id] = (progressByBook[row.book_id] ?? 0) + 1;
                });
                // Build progress object for each book
                return books_1.BOOKS.reduce((acc, book) => {
                    acc[book.id] = {
                        bookId: book.id,
                        chaptersCompleted: progressByBook[book.id] ?? 0,
                        totalChapters: book.chapterCount,
                    };
                    return acc;
                }, {});
            },
            enabled: !!user,
            staleTime: 1000 * 60 * 5, // 5 minutes
        });
    }
    exports_1("useBooks", useBooks);
    return {
        setters: [
            function (react_query_1_1) {
                react_query_1 = react_query_1_1;
            },
            function (supabase_1_1) {
                supabase_1 = supabase_1_1;
            },
            function (AuthProvider_1_1) {
                AuthProvider_1 = AuthProvider_1_1;
            },
            function (queryKeys_1_1) {
                queryKeys_1 = queryKeys_1_1;
            },
            function (books_1_1) {
                books_1 = books_1_1;
            }
        ],
        execute: function () {
        }
    };
});
