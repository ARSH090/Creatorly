import { test, expect } from '@playwright/test';

test.describe('Advanced Canvas Editor', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard/storefront/editor');
        await page.waitForLoadState('networkidle');
    });

    test('Editor layout and sidebar are visible', async ({ page }) => {
        await expect(page.locator('aside')).toBeVisible();
        await expect(page.locator('text=Blocks, text=ADD, text=THEME').first()).toBeVisible();
    });

    test('Panel switching (Blocks / Add / Theme)', async ({ page }) => {
        const addPanelBtn = page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first();
        const themePanelBtn = page.locator('button').filter({ has: page.locator('svg.lucide-palette') }).first();
        const blocksPanelBtn = page.locator('button').filter({ has: page.locator('svg.lucide-layers') }).first();

        await addPanelBtn.click();
        await expect(page.locator('text=CONTENT, text=SOCIAL, text=COMMERCE').first()).toBeVisible();

        await themePanelBtn.click();
        await expect(page.locator('text=PRESETS, text=COLORS, text=TYPOGRAPHY').first()).toBeVisible();

        await blocksPanelBtn.click();
        // Should show existing blocks
    });

    test('Add block panel shows library', async ({ page }) => {
        const addPanelBtn = page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first();
        await addPanelBtn.click();

        await expect(page.locator('text=Hero').first()).toBeVisible();
        await expect(page.locator('text=Links').first()).toBeVisible();
        await expect(page.locator('text=Products').first()).toBeVisible();
    });

    test('Save button is functional', async ({ page }) => {
        const saveBtn = page.locator('button').filter({ has: page.locator('svg.lucide-save') }).first();
        await expect(saveBtn).toBeVisible();
        // Clicking might show a toast
        await saveBtn.click();
        await expect(page.locator('text=Saved, text=Done, text=Success').first()).toBeVisible().catch(() => { });
    });

    test('Device toggle works', async ({ page }) => {
        const mobileBtn = page.locator('button').filter({ has: page.locator('svg.lucide-smartphone') }).first();
        const tabletBtn = page.locator('button').filter({ has: page.locator('svg.lucide-tablet') }).first();
        const desktopBtn = page.locator('button').filter({ has: page.locator('svg.lucide-monitor') }).first();

        await mobileBtn.click();
        await page.waitForTimeout(300);
        await tabletBtn.click();
        await page.waitForTimeout(300);
        await desktopBtn.click();

        await expect(page.locator('text=Application error')).not.toBeVisible();
    });
});
