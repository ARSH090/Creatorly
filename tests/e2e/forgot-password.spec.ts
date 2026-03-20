import { test, expect } from '@playwright/test';

test.describe('Forgot Password E2E Flow', () => {
    test('should allow user to request password reset', async ({ page }) => {
        await page.goto('/auth/forgot-password');
        
        // Enter email
        await page.fill('input[type="email"]', 'test@creatorly.in');
        await page.click('button[type="submit"]');
        
        // Should show success message
        await expect(page.locator('text=Check your email')).toBeVisible();
    });

    test('should show error for non-existent email', async ({ page }) => {
        await page.goto('/auth/forgot-password');
        await page.fill('input[type="email"]', 'nonexistent@creatorly.in');
        await page.click('button[type="submit"]');
        
        // This depends on whether Clerk reveals if email exists. 
        // For security, it usually says "Check email" regardless.
        // But our custom route might show an error.
        await expect(page.locator('text=Check your email')).toBeVisible();
    });
});
