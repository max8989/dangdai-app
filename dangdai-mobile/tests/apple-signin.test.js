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
            test_1.test.describe('Apple Sign-In (Web Platform)', () => {
                test_1.test.beforeEach(async ({ page }) => {
                    // Navigate to login screen
                    await page.goto('/(auth)/login', { waitUntil: 'networkidle' });
                });
                test_1.test('Apple Sign-In button is NOT displayed on web platform (AC #2)', async ({ page }) => {
                    // Wait for the login screen to load
                    await test_1.expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 10000 });
                    // Verify the regular Sign In button is visible
                    await test_1.expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
                    // Apple Sign-In button should NOT be visible on web (only shows on iOS per AC #2)
                    // The native AppleAuthenticationButton uses role="button" with specific text
                    // But since Platform.OS !== 'ios' on web, the entire section including
                    // "or continue with" divider should not be rendered
                    await test_1.expect(page.getByText('or continue with')).not.toBeVisible();
                    // Double-check: no Apple-related text should appear
                    await test_1.expect(page.getByText(/sign.*apple/i)).not.toBeVisible();
                });
                test_1.test('login form works normally without Apple Sign-In on web', async ({ page }) => {
                    // Wait for the login screen to load
                    await test_1.expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 10000 });
                    // Verify email/password form is fully functional
                    await test_1.expect(page.getByPlaceholder('your@email.com')).toBeVisible();
                    await test_1.expect(page.getByPlaceholder('Enter your password')).toBeVisible();
                    await test_1.expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
                    await test_1.expect(page.getByText("Don't have an account? Sign Up")).toBeVisible();
                    // Fill in valid form data
                    await page.getByPlaceholder('your@email.com').fill('test@example.com');
                    await page.getByPlaceholder('Enter your password').fill('testpassword123');
                    // Verify the Sign In button is enabled
                    const signInButton = page.getByRole('button', { name: 'Sign In' });
                    await test_1.expect(signInButton).toBeEnabled();
                });
            });
        }
    };
});
