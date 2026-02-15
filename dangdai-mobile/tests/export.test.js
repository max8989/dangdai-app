System.register(["@playwright/test"], function (exports_1, context_1) {
    "use strict";
    var test_1;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (test_1_1) {
                test_1 = test_1_1;
            }
        ],
        execute: function () {
            test_1.test('static export hydrates without Missing theme error', async ({ page }) => {
                const errors = [];
                page.on('pageerror', (err) => {
                    errors.push(err.message);
                });
                // Navigate to the login page (root redirects unauthenticated users to login)
                await page.goto('/(auth)/login', { waitUntil: 'networkidle' });
                // Wait for client hydration by checking for the Sign In heading
                const heading = page.getByRole('heading', { name: 'Sign In' });
                await test_1.expect(heading).toBeVisible({ timeout: 10000 });
                // should not show the error boundary
                await test_1.expect(page.getByText('Something went wrong')).not.toBeVisible();
                await test_1.expect(page.getByText('Missing theme')).not.toBeVisible();
                // verify no page errors related to missing theme
                const themeErrors = errors.filter((e) => e.includes('Missing theme'));
                test_1.expect(themeErrors).toHaveLength(0);
                // verify themed styles are applied (not unstyled)
                const color = await heading.evaluate((el) => window.getComputedStyle(el).color);
                test_1.expect(color).toBeTruthy();
                test_1.expect(color).not.toBe('');
            });
        }
    };
});
