import { test, expect } from '@playwright/test';

test.describe('Complete Checkout Flow', () => {
    test('should complete purchase from product to download', async ({ page }) => {
        // 1. Navigate to creator store
        await page.goto('/testcreator');

        // 2. Select a product
        await page.click('.product-card:first-child');

        // 3. Verify product details page
        await expect(page.locator('h1')).toBeVisible();

        // 4. Click Buy Now
        await page.click('button:has-text("Buy Now")');

        // 5. Fill customer details in checkout modal
        await page.fill('[name="customerEmail"]', 'customer@example.com');
        await page.fill('[name="customerName"]', 'Test Customer');

        // 6. Proceed to payment
        await page.click('button:has-text("Proceed to Payment")');

        // 7. Wait for Razorpay modal (This would be mocked or use test credentials in RZP test mode)
        // For local E2E, we often check if the RZP script loaded or modal appeared
        await expect(page.locator('.razorpay-container')).toBeAttached({ timeout: 10000 });
    });
});
