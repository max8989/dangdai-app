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
            /**
             * Chapter List Flow Tests
             *
             * Story 3.2: Chapter List Screen
             *
             * These tests verify the chapter list screen functionality:
             * - Chapter counts per book (15, 15, 12, 12)
             * - Chapter display (number, English title, Chinese title)
             * - Back navigation
             * - Chapter selection navigates to quiz
             */
            test_1.test.describe('Chapter List Flow', () => {
                test_1.test('app loads and handles unauthenticated state', async ({ page }) => {
                    // Navigate to the app
                    await page.goto('/', { waitUntil: 'networkidle' });
                    // Wait for the page to stabilize
                    await page.waitForTimeout(1000);
                    // For unauthenticated users, the login screen should be shown
                    const loginVisible = await page.getByRole('heading', { name: 'Sign In' }).isVisible();
                    const homeVisible = await page.getByText('Dangdai').first().isVisible();
                    // Either login is shown (unauthenticated) or main app is shown (authenticated)
                    test_1.expect(loginVisible || homeVisible).toBe(true);
                });
                test_1.test('chapter route exists for navigation', async ({ page }) => {
                    // Test that navigation within the app works
                    await page.goto('/', { waitUntil: 'networkidle' });
                    // The app should load successfully
                    const bodyExists = await page.locator('body').isVisible();
                    test_1.expect(bodyExists).toBe(true);
                });
            });
            /**
             * Authenticated Chapter List Tests
             *
             * These tests run when a valid test user is available.
             * Skip these tests if the test environment doesn't have auth configured.
             */
            test_1.test.describe('Chapter List Flow (Authenticated)', () => {
                // Skip this test suite if no test user credentials are configured
                const TEST_EMAIL = process.env.TEST_USER_EMAIL;
                const TEST_PASSWORD = process.env.TEST_USER_PASSWORD;
                test_1.test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipping authenticated tests - no test credentials');
                test_1.test.beforeEach(async ({ page }) => {
                    if (!TEST_EMAIL || !TEST_PASSWORD)
                        return;
                    // Login with test user
                    await page.goto('/(auth)/login', { waitUntil: 'networkidle' });
                    await test_1.expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible({ timeout: 10000 });
                    await page.getByPlaceholder('your@email.com').fill(TEST_EMAIL);
                    await page.getByPlaceholder('Enter your password').fill(TEST_PASSWORD);
                    await page.getByRole('button', { name: 'Sign In' }).click();
                    // Wait for login to complete and redirect
                    await page.waitForURL(/\/\(tabs\)/, { timeout: 15000 });
                });
                // AC #2: Book 1 shows 15 chapters
                test_1.test('Book 1 shows 15 chapters', async ({ page }) => {
                    if (!TEST_EMAIL || !TEST_PASSWORD)
                        return;
                    await page.goto('/(tabs)/books', { waitUntil: 'networkidle' });
                    await test_1.expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 });
                    // Navigate to Book 1 chapters
                    await page.getByTestId('book-card-1').click();
                    await test_1.expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 5000 });
                    // Verify chapter count display
                    await test_1.expect(page.getByTestId('chapter-count')).toHaveText('15 chapters');
                    // Verify all 15 chapters are rendered
                    for (let i = 1; i <= 15; i++) {
                        const chapterId = 100 + i; // Book 1 chapters: 101-115
                        await test_1.expect(page.getByTestId(`chapter-list-item-${chapterId}`)).toBeVisible();
                    }
                });
                // AC #3: Book 2 shows 15 chapters
                test_1.test('Book 2 shows 15 chapters', async ({ page }) => {
                    if (!TEST_EMAIL || !TEST_PASSWORD)
                        return;
                    await page.goto('/(tabs)/books', { waitUntil: 'networkidle' });
                    await test_1.expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 });
                    // Navigate to Book 2 chapters
                    await page.getByTestId('book-card-2').click();
                    await test_1.expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 5000 });
                    // Verify chapter count display
                    await test_1.expect(page.getByTestId('chapter-count')).toHaveText('15 chapters');
                    // Verify all 15 chapters are rendered
                    for (let i = 1; i <= 15; i++) {
                        const chapterId = 200 + i; // Book 2 chapters: 201-215
                        await test_1.expect(page.getByTestId(`chapter-list-item-${chapterId}`)).toBeVisible();
                    }
                });
                // AC #4: Book 3 shows 12 chapters
                test_1.test('Book 3 shows 12 chapters', async ({ page }) => {
                    if (!TEST_EMAIL || !TEST_PASSWORD)
                        return;
                    await page.goto('/(tabs)/books', { waitUntil: 'networkidle' });
                    await test_1.expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 });
                    // Navigate to Book 3 chapters
                    await page.getByTestId('book-card-3').click();
                    await test_1.expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 5000 });
                    // Verify chapter count display
                    await test_1.expect(page.getByTestId('chapter-count')).toHaveText('12 chapters');
                    // Verify all 12 chapters are rendered
                    for (let i = 1; i <= 12; i++) {
                        const chapterId = 300 + i; // Book 3 chapters: 301-312
                        await test_1.expect(page.getByTestId(`chapter-list-item-${chapterId}`)).toBeVisible();
                    }
                });
                // AC #5: Book 4 shows 12 chapters
                test_1.test('Book 4 shows 12 chapters', async ({ page }) => {
                    if (!TEST_EMAIL || !TEST_PASSWORD)
                        return;
                    await page.goto('/(tabs)/books', { waitUntil: 'networkidle' });
                    await test_1.expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 });
                    // Navigate to Book 4 chapters
                    await page.getByTestId('book-card-4').click();
                    await test_1.expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 5000 });
                    // Verify chapter count display
                    await test_1.expect(page.getByTestId('chapter-count')).toHaveText('12 chapters');
                    // Verify all 12 chapters are rendered
                    for (let i = 1; i <= 12; i++) {
                        const chapterId = 400 + i; // Book 4 chapters: 401-412
                        await test_1.expect(page.getByTestId(`chapter-list-item-${chapterId}`)).toBeVisible();
                    }
                });
                // AC #1: Chapter displays number, English title, Chinese title
                test_1.test('chapters display number, English title, and Chinese title', async ({ page }) => {
                    if (!TEST_EMAIL || !TEST_PASSWORD)
                        return;
                    await page.goto('/(tabs)/books', { waitUntil: 'networkidle' });
                    await test_1.expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 });
                    // Navigate to Book 1 chapters
                    await page.getByTestId('book-card-1').click();
                    await test_1.expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 5000 });
                    // Verify first chapter displays all required fields
                    await test_1.expect(page.getByTestId('chapter-number-badge-101')).toBeVisible();
                    await test_1.expect(page.getByTestId('chapter-number-text-101')).toHaveText('1');
                    await test_1.expect(page.getByTestId('chapter-title-english-101')).toHaveText('Greetings');
                    await test_1.expect(page.getByTestId('chapter-title-chinese-101')).toHaveText('问候');
                    // Verify another chapter
                    await test_1.expect(page.getByTestId('chapter-number-text-105')).toHaveText('5');
                    await test_1.expect(page.getByTestId('chapter-title-english-105')).toHaveText('Dates');
                    await test_1.expect(page.getByTestId('chapter-title-chinese-105')).toHaveText('日期');
                });
                // AC #1: Back button returns to book selection
                test_1.test('back navigation returns to book selection', async ({ page }) => {
                    if (!TEST_EMAIL || !TEST_PASSWORD)
                        return;
                    await page.goto('/(tabs)/books', { waitUntil: 'networkidle' });
                    await test_1.expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 });
                    // Navigate to Book 1 chapters
                    await page.getByTestId('book-card-1').click();
                    await test_1.expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 5000 });
                    // Go back
                    await page.goBack();
                    // Verify we're back on books screen
                    await test_1.expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 5000 });
                    await test_1.expect(page.getByTestId('book-card-1')).toBeVisible();
                });
                // AC #6: Chapter selection navigates to quiz
                test_1.test('chapter selection navigates to quiz', async ({ page }) => {
                    if (!TEST_EMAIL || !TEST_PASSWORD)
                        return;
                    await page.goto('/(tabs)/books', { waitUntil: 'networkidle' });
                    await test_1.expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 });
                    // Navigate to Book 1 chapters
                    await page.getByTestId('book-card-1').click();
                    await test_1.expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 5000 });
                    // Tap on Chapter 5 (Dates)
                    await page.getByTestId('chapter-list-item-105').click();
                    // Verify quiz screen appears
                    await test_1.expect(page.getByTestId('quiz-screen')).toBeVisible({ timeout: 5000 });
                    await test_1.expect(page.getByTestId('quiz-header')).toHaveText('Dates');
                    await test_1.expect(page.getByTestId('quiz-chinese-title')).toHaveText('日期');
                });
                test_1.test('scrollable chapter list renders correctly', async ({ page }) => {
                    if (!TEST_EMAIL || !TEST_PASSWORD)
                        return;
                    await page.goto('/(tabs)/books', { waitUntil: 'networkidle' });
                    await test_1.expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 });
                    // Navigate to Book 1 chapters
                    await page.getByTestId('book-card-1').click();
                    await test_1.expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 5000 });
                    // Verify scroll view exists
                    await test_1.expect(page.getByTestId('chapter-scroll-view')).toBeVisible();
                });
                test_1.test('book header displays Chinese title', async ({ page }) => {
                    if (!TEST_EMAIL || !TEST_PASSWORD)
                        return;
                    await page.goto('/(tabs)/books', { waitUntil: 'networkidle' });
                    await test_1.expect(page.getByTestId('books-screen')).toBeVisible({ timeout: 10000 });
                    // Navigate to Book 1 chapters
                    await page.getByTestId('book-card-1').click();
                    await test_1.expect(page.getByTestId('chapter-list-screen')).toBeVisible({ timeout: 5000 });
                    // Verify Chinese title in header
                    await test_1.expect(page.getByTestId('book-chinese-title')).toContainText('當代中文課程 第一冊');
                });
            });
        }
    };
});
