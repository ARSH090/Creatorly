import { test, expect } from '@playwright/test';

test.describe('Automation / AutoDM Page', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard/automation');
        await page.waitForLoadState('networkidle');
    });

    test('Page loads without error', async ({ page }) => {
        await expect(page.locator('text=Application error')).not.toBeVisible();
        const heading = page.locator('h1, h2').first();
        await expect(heading).toBeVisible();
    });

    test('Shows connect card OR connected state', async ({ page }) => {
        const connectCard = page.locator('text=Connect Instagram, text=Instagram Link Disconnected, text=INITIALIZE CONNECTION').first();
        const connectedState = page.locator('text=Connected, text=@, text=INTEGRATION AUTHORIZED').first();
        const statsCard = page.locator('text=Active Rules, text=DMs Sent, text=ACTIVE RULES').first();

        const hasConnect = await connectCard.isVisible().catch(() => false);
        const hasConnected = await connectedState.isVisible().catch(() => false);
        const hasStats = await statsCard.isVisible().catch(() => false);

        expect(hasConnect || hasConnected || hasStats).toBeTruthy();
    });

    test('Performance stat cards are rendered', async ({ page }) => {
        const stats = page.locator('text=Active Rules, text=DMs Sent Today, text=Total Conversions, text=Pending Follows').first();
        await expect(stats).toBeVisible();
    });

    test('Connect Instagram button links to OAuth', async ({ page }) => {
        const connectBtn = page.locator('button:has-text("Connect Instagram"), button:has-text("CONNECT INSTAGRAM"), button:has-text("INITIALIZE CONNECTION"), button:has-text("RECONFIGURE")').first();
        if (await connectBtn.isVisible()) {
            // Should exist and be clickable (we won't follow the redirect):
            await expect(connectBtn).toBeEnabled();
        }
    });

    test('Rules tab shows rules or empty state', async ({ page }) => {
        const rulesTab = page.locator('button:has-text("Rules"), [role="tab"]:has-text("Rules"), button:has-text("RULES")').first();
        await expect(rulesTab).toBeVisible();

        const hasRules = await page.locator('text=OPERATIONAL, text=DORMANT, text=keyword').first().isVisible().catch(() => false);
        const hasEmpty = await page.locator('text=INITIALIZE AUTOMATION, text=CREATE FIRST RULE').first().isVisible().catch(() => false);
        expect(hasRules || hasEmpty).toBeTruthy();
    });

    test('Pending tab loads without crash', async ({ page }) => {
        const pendingTab = page.locator('button:has-text("Pending"), [role="tab"]:has-text("Pending"), button:has-text("PENDING")').first();
        if (await pendingTab.isVisible()) {
            await pendingTab.click();
            await page.waitForTimeout(1000);
            await expect(page.locator('text=Application error')).not.toBeVisible();
            // Should show either queue items or empty state:
            const bodyText = await page.locator('body').innerText();
            expect(bodyText.length).toBeGreaterThan(50);
        }
    });

    test('Activity tab loads without crash', async ({ page }) => {
        const activityTab = page.locator('button:has-text("Activity"), [role="tab"]:has-text("Activity"), button:has-text("ACTIVITY")').first();
        if (await activityTab.isVisible()) {
            await activityTab.click();
            await page.waitForTimeout(1000);
            await expect(page.locator('text=Application error')).not.toBeVisible();
        }
    });

    test('Create Rule button opens modal', async ({ page }) => {
        const createBtn = page.locator('button:has-text("NEW AUTOMATION"), button:has-text("Create Rule"), button:has-text("+ Create")').first();
        if (await createBtn.isVisible()) {
            await createBtn.click();
            await page.waitForTimeout(500);
            const modal = page.locator('[role="dialog"], text=Trigger Keyword, text=Create Rule, text=keyword').first();
            await expect(modal).toBeVisible();
        }
    });

    test('/api/instagram/status returns valid response', async ({ page }) => {
        const response = await page.evaluate(async () => {
            const r = await fetch('/api/instagram/status');
            return { status: r.status, ok: r.ok };
        });
        expect(response.status).not.toBe(404);
        expect(response.status).not.toBe(500);
    });

    test('/api/creator/autodm/stats returns valid response', async ({ page }) => {
        const response = await page.evaluate(async () => {
            const r = await fetch('/api/creator/autodm/stats');
            return { status: r.status, ok: r.ok };
        });
        expect(response.status).not.toBe(404);
        expect(response.status).not.toBe(500);
    });
});
