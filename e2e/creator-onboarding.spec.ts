import { test, expect } from '@playwright/test';

/**
 * E2E Test: Creator onboarding flow
 * Tests the complete signup and onboarding process
 */
test.describe('Creator Onboarding Flow', () => {

    test('new creator can sign up and complete onboarding', async ({ page }) => {
        // 1. Navigate to sign-up page
        await page.goto('/auth/register');

        // 2. Fill in registration form
        await page.fill('input[name="email"]', `testcreator${Date.now()}@example.com`);
        await page.fill('input[name="password"]', 'SecurePass123!');
        await page.fill('input[name="displayName"]', 'Test Creator');

        // 3. Submit form
        await page.click('button[type="submit"]');

        // 4. Should redirect to dashboard (or phone verification if implemented)
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

        // 5. Fill store profile
        await page.click('text=Set up your store');
        await page.fill('input[name="bio"]', 'I create awesome digital products');
        await page.fill('input[name="username"]', `creator${Date.now()}`);

        // 6. Save profile
        await page.click('button:has-text("Save")');

        // 7. Verify success toast/message
        await expect(page.locator('text=Profile updated')).toBeVisible({ timeout: 5000 });

        // 8. Create first product
        await page.click('text=Create Product');
        await page.fill('input[name="title"]', 'My First Digital Product');
        await page.fill('textarea[name="description"]', 'An amazing resource');
        await page.fill('input[name="price"]', '999');

        // 9. Submit product creation
        await page.click('button:has-text("Publish")');

        // 10. Verify product appears in list
        await page.goto('/dashboard/products');
        await expect(page.locator('text=My First Digital Product')).toBeVisible();
    });

    test('creator cannot use duplicate username', async ({ page }) => {
        // Assume 'existinguser' already exists
        await page.goto('/dashboard/settings');
        await page.fill('input[name="username"]', 'existinguser');
        await page.click('button:has-text("Save")');

        // Should show error
        await expect(page.locator('text=Username already taken')).toBeVisible();
    });
});
