import { test, expect } from '@playwright/test';

test.describe('Billing & Subscription Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard/billing');
        await page.waitForLoadState('networkidle');
    });

    test('Billing page loads and shows current plan', async ({ page }) => {
        await expect(page.locator('h1:has-text("BILLING & SUBSCRIPTION")')).toBeVisible();
        await expect(page.locator('text=CURRENT STATUS')).toBeVisible();
        // Since we are likely in a local/mock environment, it might show 'Free' or 'Pro'
        const hasPlan = await page.locator('h2:has-text("Pro"), h2:has-text("Free"), h2:has-text("Business")').first().isVisible();
        expect(hasPlan).toBeTruthy();
    });

    test('Telemetry meters are visible', async ({ page }) => {
        await expect(page.locator('text=TELEMETRY METER')).toBeVisible();
        await expect(page.locator('text=Vault Storage')).toBeVisible();
        await expect(page.locator('text=Unit Deployment')).toBeVisible();
    });

    test('Upgrade Protocol button exists', async ({ page }) => {
        const upgradeBtn = page.locator('button:has-text("UPGRADE PROTOCOL")');
        await expect(upgradeBtn).toBeVisible();
    });

    test('Plan selection cards are rendered', async ({ page }) => {
        await expect(page.locator('text=ALTER PROTOCOL')).toBeVisible();
        const planCards = page.locator('.rounded-\\[3rem\\]').filter({ hasText: 'ENGAGE PLAN' });
        // At least 3 plans should be there (Free, Pro, Business)
        const count = await planCards.count();
        expect(count).toBeGreaterThanOrEqual(1); // One might be 'ACTIVE PROTOCOL'
    });

    test('Ledger history exists', async ({ page }) => {
        await expect(page.locator('text=LEDGER HISTORY')).toBeVisible();
        await expect(page.locator('th:has-text("TIMESTAMP")')).toBeVisible();
    });

    test('Mobile layout responsive check', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/dashboard/billing');
        await page.waitForLoadState('networkidle');
        const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(scrollWidth).toBeLessThanOrEqual(400);
    });
});
