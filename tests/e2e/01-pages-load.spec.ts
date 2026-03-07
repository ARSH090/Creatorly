import { test, expect } from '@playwright/test';

const DASHBOARD_PAGES = [
    { url: '/dashboard', name: 'Dashboard Home' },
    { url: '/dashboard/profile', name: 'Profile Settings' },
    { url: '/dashboard/products', name: 'Products List' },
    { url: '/dashboard/products/new', name: 'Create Product' },
    { url: '/dashboard/products/coupons', name: 'All Coupons' },
    { url: '/dashboard/storefront', name: 'Storefront Overview' },
    { url: '/dashboard/storefront/editor', name: 'Storefront Editor' },
    { url: '/dashboard/automation', name: 'AutoDM Hub' },
    { url: '/dashboard/email/campaigns', name: 'Email Campaigns' },
    { url: '/dashboard/email/campaigns/new', name: 'New Campaign' },
    { url: '/dashboard/analytics', name: 'Analytics' },
    { url: '/dashboard/orders', name: 'Orders' },
    { url: '/dashboard/settings', name: 'Settings' },
    { url: '/dashboard/leads', name: 'Leads' },
    { url: '/dashboard/projects', name: 'Projects' },
    { url: '/dashboard/schedulify', name: 'Schedulify' },
];

for (const pg of DASHBOARD_PAGES) {
    test(`[PAGE LOAD] ${pg.name} → ${pg.url}`, async ({ page }) => {
        const response = await page.goto(pg.url, { waitUntil: 'domcontentloaded' });

        // Must not 404 or 500:
        expect(response?.status()).not.toBe(404);
        expect(response?.status()).not.toBe(500);

        // Must not show error page:
        await expect(page.locator('text=Application error')).not.toBeVisible();
        await expect(page.locator('text="This page could not be found"')).not.toBeVisible();

        // Must load in time:
        await page.waitForLoadState('domcontentloaded');

        // Must have some content (not blank):
        const bodyText = await page.locator('body').innerText();
        expect(bodyText.trim().length).toBeGreaterThan(10);

        // Take screenshot for report:
        await page.screenshot({
            path: `tests/screenshots/${pg.name.replace(/\s/g, '_')}.png`,
            fullPage: false,
        });
    });
}
