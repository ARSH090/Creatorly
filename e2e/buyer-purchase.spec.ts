import { test, expect } from '@playwright/test';

/**
 * E2E Test: Complete buyer purchase flow
 * Tests the entire user journey from product discovery to download
 */
test.describe('Buyer Purchase Flow', () => {

    test('buyer can discover product, purchase, and download', async ({ page }) => {
        // 1. Visit creator's store
        await page.goto('/store/testcreator');
        await expect(page.locator('h1')).toContainText('testcreator');

        // 2. Click on a product card
        await page.click('text=Test Digital Product');
        await expect(page.url()).toContain('/product/');

        // 3. Click "Buy Now" button
        await page.click('button:has-text("Buy Now")');

        // 4. Verify Razorpay modal opens (or redirect to checkout)
        // Note: In test mode, may need to mock Razorpay or use test API
        const checkoutFrame = page.frameLocator('[name*="razorpay"]').first();
        // TODO: Complete test payment using Razorpay test mode

        // 5. After successful payment, should redirect to success page
        await expect(page).toHaveURL(/\/purchase\/success/, { timeout: 10000 });

        // 6. Verify download link is visible
        await expect(page.locator('a:has-text("Download")')).toBeVisible();

        // 7. Verify order appears in user's downloads
        await page.goto('/account/downloads');
        await expect(page.locator('text=Test Digital Product')).toBeVisible();
    });

    test('buyer cannot access download without payment', async ({ page }) => {
        // Attempt to access download token directly without payment
        await page.goto('/api/download/invalid-token-123');

        // Should return 403 or 404
        const response = await page.waitForResponse(resp => resp.url().includes('/api/download/'));
        expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('free product (price=0) bypasses payment', async ({ page }) => {
        await page.goto('/store/testcreator');
        await page.click('text=Free Starter Pack');

        // Free products should directly show download or add to library
        await page.click('button:has-text("Get for Free")');

        // Should NOT see Razorpay modal
        // Should immediately get access
        await expect(page.locator('text=Added to your library')).toBeVisible({ timeout: 3000 });
    });
});
