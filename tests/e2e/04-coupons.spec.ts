import { test, expect } from '@playwright/test';

test.describe('Coupons Page', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard/products/coupons');
        await page.waitForLoadState('networkidle');
    });

    test('Coupons page loads without error', async ({ page }) => {
        await expect(page).toHaveURL(/coupons/);
        await expect(page.locator('text=Application error')).not.toBeVisible();
    });

    test('Create Coupon button opens modal', async ({ page }) => {
        const createBtn = page.locator('button:has-text("Create"), button:has-text("New Coupon"), button:has-text("CREATE")').first();
        await expect(createBtn).toBeVisible();
        await createBtn.click();
        await page.waitForTimeout(500);

        // Modal or form should appear:
        const modalVisible = await page.locator('[role="dialog"], .modal, text=Coupon Code, text=CODE').first().isVisible().catch(() => false);
        expect(modalVisible).toBeTruthy();
    });

    test('Coupon code auto-uppercases', async ({ page }) => {
        const createBtn = page.locator('button:has-text("Create"), button:has-text("CREATE")').first();
        await createBtn.click();
        await page.waitForTimeout(300);

        const codeInput = page.locator('input[name="code"], input[placeholder*="SAVE"], input[placeholder*="code"], input[placeholder*="CODE"]').first();
        if (await codeInput.isVisible()) {
            await codeInput.fill('save20');
            await page.waitForTimeout(200);
            const value = await codeInput.inputValue();
            expect(value).toBe('SAVE20');
        }
    });

    test('Generate button creates random code', async ({ page }) => {
        const createBtn = page.locator('button:has-text("Create"), button:has-text("CREATE")').first();
        await createBtn.click();
        await page.waitForTimeout(300);

        const generateBtn = page.locator('button:has-text("Generate"), button:has-text("🎲"), button:has-text("GENERATE")').first();
        if (await generateBtn.isVisible()) {
            await generateBtn.click();
            await page.waitForTimeout(200);
            const codeInput = page.locator('input[name="code"], input[placeholder*="SAVE"], input[placeholder*="CODE"]').first();
            const value = await codeInput.inputValue();
            expect(value.length).toBeGreaterThanOrEqual(6);
            expect(value).toBe(value.toUpperCase());
        }
    });

    test('Discount type selector exists', async ({ page }) => {
        const createBtn = page.locator('button:has-text("Create"), button:has-text("CREATE")').first();
        await createBtn.click();
        await page.waitForTimeout(300);

        const typeSelector = page.locator('select, [role="combobox"], button:has-text("Percentage"), button:has-text("Fixed"), button:has-text("PERCENTAGE")').first();
        await expect(typeSelector).toBeVisible();
    });

    test('Coupon list or empty state is shown', async ({ page }) => {
        const hasCoupons = await page.locator('table, .coupon-card, tr').count() > 0;
        const hasEmpty = await page.locator('text=No coupons, text=no coupons, text=Create your first').first().isVisible().catch(() => false);
        expect(hasCoupons || hasEmpty).toBeTruthy();
    });

    test('Toggle switch changes active state', async ({ page }) => {
        const toggle = page.locator('button[role="switch"], input[type="checkbox"]').first();
        if (await toggle.isVisible()) {
            const beforeState = await toggle.getAttribute('data-state') || await toggle.getAttribute('aria-checked');
            await toggle.click();
            await page.waitForTimeout(500);
            const afterState = await toggle.getAttribute('data-state') || await toggle.getAttribute('aria-checked');
            expect(beforeState).not.toBe(afterState);
        }
    });
});
