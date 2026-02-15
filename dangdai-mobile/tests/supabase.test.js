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
            test_1.test.describe('Supabase Integration', () => {
                test_1.test('app loads successfully with Supabase client configured', async ({ page }) => {
                    const errors = [];
                    const consoleLogs = [];
                    // Capture page errors
                    page.on('pageerror', (err) => {
                        errors.push(err.message);
                    });
                    // Capture console logs to verify Supabase connection test
                    page.on('console', (msg) => {
                        consoleLogs.push(msg.text());
                    });
                    // Navigate to login (root redirects unauthenticated users to login)
                    await page.goto('/(auth)/login', { waitUntil: 'networkidle' });
                    // Wait for the app to fully hydrate by checking for the Sign In heading
                    const heading = page.getByRole('heading', { name: 'Sign In' });
                    await test_1.expect(heading).toBeVisible({ timeout: 10000 });
                    // should not show error boundary
                    await test_1.expect(page.getByText('Something went wrong')).not.toBeVisible();
                    // verify no page errors related to missing environment variables
                    const envErrors = errors.filter((e) => e.includes('Missing Supabase') || e.includes('environment variables'));
                    test_1.expect(envErrors).toHaveLength(0);
                });
                test_1.test('environment variables are not exposed in client bundle source', async ({ page }) => {
                    // Navigate to login (root redirects unauthenticated users to login)
                    await page.goto('/(auth)/login', { waitUntil: 'networkidle' });
                    // Wait for the app to fully render
                    await test_1.expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 10000 });
                    // Get all script contents
                    const scripts = await page.evaluate(() => {
                        const scriptElements = document.querySelectorAll('script');
                        return Array.from(scriptElements).map((s) => s.innerHTML || '');
                    });
                    // Verify no service role keys or sensitive data in scripts
                    // Only anon/public keys should be present (starting with 'eyJ')
                    const allScriptContent = scripts.join('');
                    // Check that service_role is not exposed (would contain "service_role" in JWT)
                    test_1.expect(allScriptContent).not.toContain('service_role');
                    // The app should still work (anon key is expected to be present)
                    const heading = page.getByRole('heading', { name: 'Sign In' });
                    await test_1.expect(heading).toBeVisible();
                });
            });
        }
    };
});
