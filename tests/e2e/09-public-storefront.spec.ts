import { test, expect } from '@playwright/test';

test.describe('Public Storefront', () => {

    test('Public page loads for valid username', async ({ page }) => {
        const username = process.env.TEST_USERNAME || 'testcreator';
        const response = await page.goto(`/u/${username}`);
        // Should be 200 or 404 — never 500:
        expect(response?.status()).not.toBe(500);
    });

    test('404 page shows for unknown username', async ({ page }) => {
        const response = await page.goto('/u/this_user_does_not_exist_xyz_99999');
        // Should be a 404 — not a 500 crash:
        expect(response?.status()).not.toBe(500);
    });

    test('No horizontal scroll on mobile', async ({ page }) => {
        const username = process.env.TEST_USERNAME || 'testcreator';
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto(`/u/${username}`);
        await page.waitForLoadState('networkidle');
        const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(scrollWidth).toBeLessThanOrEqual(400);
    });

    test('Homepage loads without error', async ({ page }) => {
        const response = await page.goto('/');
        expect(response?.status()).not.toBe(500);
        await expect(page.locator('text=Application error')).not.toBeVisible();
    });

    test('Sign-in page loads without error', async ({ page }) => {
        const response = await page.goto('/sign-in');
        expect(response?.status()).not.toBe(500);
        await expect(page.locator('text=Application error')).not.toBeVisible();
    });
});
