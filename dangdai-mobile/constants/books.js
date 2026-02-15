/**
 * Book Definitions
 *
 * Static book metadata for Dangdai Chinese textbook series (Books 1-4).
 * Chapter counts match the actual NTNU textbook structure.
 */
System.register([], function (exports_1, context_1) {
    "use strict";
    var BOOKS;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            exports_1("BOOKS", BOOKS = [
                {
                    id: 1,
                    title: 'Book 1',
                    titleChinese: '當代中文課程 第一冊',
                    chapterCount: 15,
                    coverColor: '$blue9',
                },
                {
                    id: 2,
                    title: 'Book 2',
                    titleChinese: '當代中文課程 第二冊',
                    chapterCount: 15,
                    coverColor: '$green9',
                },
                {
                    id: 3,
                    title: 'Book 3',
                    titleChinese: '當代中文課程 第三冊',
                    chapterCount: 12,
                    coverColor: '$orange9',
                },
                {
                    id: 4,
                    title: 'Book 4',
                    titleChinese: '當代中文課程 第四冊',
                    chapterCount: 12,
                    coverColor: '$purple9',
                },
            ]);
        }
    };
});
