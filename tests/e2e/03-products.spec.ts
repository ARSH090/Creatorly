import { test, expect } from '@playwright/test';

test.describe('Products Page', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard/products');
        await page.waitForLoadState('networkidle');
    });

    test('Products page shows content or empty state', async ({ page }) => {
        const hasProducts = await page.locator('.product-card, .product-row, [data-testid="product-row"], tr').count() > 0;
        const hasEmptyState = await page.locator('text=No products, text=Create your first, text=no products, text=Get Started').first().isVisible().catch(() => false);
        expect(hasProducts || hasEmptyState).toBeTruthy();
    });

    test('New Product button exists and navigates', async ({ page }) => {
        const newBtn = page.locator('button:has-text("GENERATE UNIT"), a:has-text("GENERATE UNIT")').first();
        await expect(newBtn).toBeVisible();
        await newBtn.click();
        await page.waitForURL('**/products/new**', { timeout: 5000 });
        await expect(page).toHaveURL(/products\/new/);
    });

    test('Search input works without crash', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="SEARCH"], input[placeholder*="Search"]').first();
        if (await searchInput.isVisible()) {
            await searchInput.fill('test product xyz nonexistent');
            await page.waitForTimeout(600);
            await expect(page.locator('text=Application error')).not.toBeVisible();
        }
    });

    test('View toggle buttons exist (Grid/List)', async ({ page }) => {
        const gridBtn = page.locator('button').filter({ has: page.locator('svg.lucide-layout-grid') }).first();
        const listBtn = page.locator('button').filter({ has: page.locator('svg.lucide-list') }).first();
        const hasToggle = (await gridBtn.isVisible().catch(() => false)) || (await listBtn.isVisible().catch(() => false));
        expect(hasToggle).toBeTruthy();
    });

    test('Stats cards are visible', async ({ page }) => {
        const hasStats = await page.locator('text=Total Units, text=LIVE, text=ACTIVE').first().isVisible().catch(() => false);
        expect(hasStats).toBeTruthy();
    });

    test('Mobile card layout renders at 375px', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/dashboard/products');
        await page.waitForLoadState('networkidle');
        const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(scrollWidth).toBeLessThanOrEqual(400);
    });
});

test.describe('Create Product Page', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard/products/new');
        await page.waitForLoadState('networkidle');
    });

    test('Create product form loads', async ({ page }) => {
        await expect(page.locator('text=Application error')).not.toBeVisible();
        const inputs = page.locator('input, textarea, .tiptap');
        expect(await inputs.count()).toBeGreaterThanOrEqual(1);
    });

    test('Product name input is editable', async ({ page }) => {
        const nameInput = page.locator('input[placeholder*="ULTIMATE"], input[placeholder*="Name"]').first();
        if (await nameInput.isVisible()) {
            await nameInput.fill('Test E2E Product');
            expect(await nameInput.inputValue()).toBe('TEST E2E PRODUCT'); // It's uppercase
        }
    });

    test('Price input accepts numbers', async ({ page }) => {
        const priceInput = page.locator('input[type="number"]').first();
        if (await priceInput.isVisible()) {
            await priceInput.fill('499');
            const val = await priceInput.inputValue();
            expect(val).toBe('499');
        }
    });

    test('Publish / Save button exists', async ({ page }) => {
        const btn = page.locator('button:has-text("Deploy To Public"), button:has-text("Sync as Draft")').first();
        await expect(btn).toBeVisible();
    });
});
