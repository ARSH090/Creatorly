import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
    test('should register as creator and set up profile', async ({ page }) => {
        const testEmail = `test-${Date.now()}@example.com`;

        // 1. Navigate to register page
        await page.goto('/register');

        // 2. Fill registration form
        await page.fill('[name="name"]', 'E2E Creator');
        await page.fill('[name="email"]', testEmail);
        await page.fill('[name="password"]', 'TestPassword123!');
        await page.fill('[name="confirmPassword"]', 'TestPassword123!');

        // Select creator role toggle or radio
        await page.click('text=Creator');

        // 3. Submit registration
        await page.click('button[type="submit"]');

        // 4. Wait for redirect to dashboard
        await expect(page).toHaveURL(/\/dashboard/);

        // 5. Verify welcome message
        await expect(page.locator('text=Welcome')).toBeVisible();

        // 6. Complete profile setup
        await page.goto('/dashboard/settings'); // Or wherever the bio is set
        await page.fill('[name="username"]', `creator_${Date.now()}`);
        await page.fill('[name="bio"]', 'I create amazing E2E tests.');

        await page.click('button:has-text("Save")');
        await expect(page.locator('text=Saved')).toBeVisible();
    });
});
