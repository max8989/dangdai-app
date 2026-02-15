/**
 * TanStack Query Keys
 *
 * Centralized query key factory for TanStack Query.
 * Consistent query key structure: [resource, ...identifiers]
 * This pattern enables efficient cache invalidation.
 *
 * Per architecture specification, TanStack Query manages server state:
 * - User profile
 * - Chapter progress
 * - Quiz history
 */
System.register([], function (exports_1, context_1) {
    "use strict";
    var queryKeys;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            exports_1("queryKeys", queryKeys = {
                // User data
                user: ['user'],
                userProfile: (userId) => ['user', 'profile', userId],
                // Books and chapters
                books: (userId) => ['books', userId],
                booksAll: ['books'],
                chapters: (bookId) => ['chapters', bookId],
                chapter: (chapterId) => ['chapter', chapterId],
                // Quiz data
                quizzes: ['quizzes'],
                quiz: (quizId) => ['quiz', quizId],
                quizHistory: (userId) => ['quizHistory', userId],
                // Progress data
                progress: ['progress'],
                userProgress: (userId) => ['progress', userId],
                chapterProgress: (userId, chapterId) => ['progress', userId, 'chapter', chapterId],
                // Activity and streaks
                dailyActivity: (userId) => ['dailyActivity', userId],
                streak: (userId) => ['streak', userId],
            });
        }
    };
});
