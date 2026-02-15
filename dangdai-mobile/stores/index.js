/**
 * Stores Barrel Export
 *
 * Central export point for all Zustand stores.
 * Per architecture specification, Zustand is used for local state:
 * - Current quiz state
 * - UI preferences
 * - Theme
 */
System.register(["./useSettingsStore", "./useQuizStore", "./useUserStore"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (useSettingsStore_1_1) {
                exports_1({
                    "useSettingsStore": useSettingsStore_1_1["useSettingsStore"]
                });
            },
            function (useQuizStore_1_1) {
                exports_1({
                    "useQuizStore": useQuizStore_1_1["useQuizStore"]
                });
            },
            function (useUserStore_1_1) {
                exports_1({
                    "useUserStore": useUserStore_1_1["useUserStore"]
                });
            }
        ],
        execute: function () {
        }
    };
});
