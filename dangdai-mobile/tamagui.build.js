System.register([], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            exports_1("default", {
                components: ['tamagui'],
                config: './tamagui.config.ts',
                outputCSS: './tamagui.generated.css',
            });
        }
    };
});
