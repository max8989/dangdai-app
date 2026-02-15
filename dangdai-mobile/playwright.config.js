System.register(["@playwright/test"], function (exports_1, context_1) {
    "use strict";
    var test_1, port;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (test_1_1) {
                test_1 = test_1_1;
            }
        ],
        execute: function () {
            port = 3838;
            exports_1("default", test_1.defineConfig({
                testDir: 'tests',
                reporter: [['list']],
                use: {
                    baseURL: `http://localhost:${port}`,
                },
                webServer: {
                    command: `npx expo export --platform web && npx serve dist -l ${port}`,
                    url: `http://localhost:${port}`,
                    reuseExistingServer: true,
                    timeout: 180000,
                },
                fullyParallel: false,
                workers: 1,
                retries: process.env.CI ? 1 : 0,
                maxFailures: 1,
                timeout: 30000,
            }));
        }
    };
});
