System.register(["@tamagui/config/v5", "tamagui"], function (exports_1, context_1) {
    "use strict";
    var v5_1, tamagui_1, config;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (v5_1_1) {
                v5_1 = v5_1_1;
            },
            function (tamagui_1_1) {
                tamagui_1 = tamagui_1_1;
            }
        ],
        execute: function () {
            exports_1("config", config = tamagui_1.createTamagui({
                ...v5_1.defaultConfig,
                settings: {
                    ...v5_1.defaultConfig.settings,
                    // Allow both shorthands and full CSS property names
                    onlyAllowShorthands: false,
                },
            }));
            exports_1("default", config);
        }
    };
});
