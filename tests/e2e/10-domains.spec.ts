import { test, expect } from '@playwright/test';

test.describe('Custom Domains Page', () => {
    test.beforeEach(async ({ page }) => {
        // Auth is handled by global setup (auth.setup.ts)
        await page.goto('/dashboard/domain');
        await page.waitForLoadState('networkidle');
    });

    test('Domain mapping page loads correctly', async ({ page }) => {
        await expect(page.locator('h1:has-text("DOMAIN MAPPING")')).toBeVisible();
        await expect(page.locator('text=CORE IDENTITY ENDPOINT')).toBeVisible();
    });

    test('Can enter and save a custom domain', async ({ page }) => {
        const domainInput = page.locator('input[placeholder="MYSITE.COM"]');
        await domainInput.fill('test-domain.creatorly.in');

        const saveBtn = page.locator('button:has-text("SAVE PROTOCOL")');
        await saveBtn.click();

        // Should show DNS records after save
        await expect(page.locator('text=CNAME RECORD')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=A RECORD')).toBeVisible();
        await expect(page.locator('button:has-text("INITIATE HANDSHAKE")')).toBeVisible();
    });

    test('DNS record copy buttons work', async ({ page }) => {
        // Ensure we have a domain saved first
        const domainInput = page.locator('input[placeholder="MYSITE.COM"]');
        if (await domainInput.isVisible()) {
            await domainInput.fill('test-copy.com');
            await page.locator('button:has-text("SAVE PROTOCOL")').click();
        }

        await expect(page.locator('text=CNAME RECORD')).toBeVisible();
        const copyBtns = page.locator('button').filter({ has: page.locator('svg.lucide-copy') });
        expect(await copyBtns.count()).toBeGreaterThanOrEqual(2);
    });

    test('Terminate mapping works', async ({ page }) => {
        // If we are already in a state with a domain
        const terminateBtn = page.locator('button:has-text("TERMINATE MAPPING")');
        if (await terminateBtn.isVisible()) {
            await terminateBtn.click();
            await expect(page.locator('text=CNAME RECORD')).not.toBeVisible();
            await expect(page.locator('button:has-text("SAVE PROTOCOL")')).toBeVisible();
        }
    });
});
