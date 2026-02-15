import { test, expect } from '@playwright/test';

test.describe('Product Creation Flow', () => {
    test('should create and publish product', async ({ page }) => {
        // 1. Login as creator (Assuming a logic already exists to bypass Firebase UI or use test token)
        await page.goto('/login');
        await page.fill('[name="email"]', 'creator@example.com');
        await page.fill('[name="password"]', 'TestPassword123!');
        await page.click('button[type="submit"]');

        // 2. Navigate to products
        await page.goto('/dashboard/products');

        // 3. Click Create Product
        await page.click('button:has-text("Create Product")');

        // 4. Fill product details
        await page.fill('[name="title"]', 'E2E Testing Guide');
        await page.fill('[name="description"]', 'A guide to playwright.');
        await page.fill('[name="price"]', '500');

        // 5. Upload cover image & Zip file
        // Note: requires paths to be valid test files
        // await page.setInputFiles('[name="coverImage"]', 'test-assets/cover.jpg');
        // await page.setInputFiles('[name="productFile"]', 'test-assets/guide.pdf');

        // 6. Publish
        await page.click('button:has-text("Publish")');

        await expect(page.locator('text=Product published')).toBeVisible();
    });
});
