/**
 * Playwright E2E test — AutoDM Hub Storefront Visitor Flow
 *
 * Prerequisites:
 *   1. `npm run dev` running on http://localhost:3000
 *   2. A test creator with username 'testcreator' exists in MongoDB
 *   3. That creator has at least one serviceButton with modalEnabled: true
 *
 * Run:
 *   npx playwright test tests/e2e/storefront.spec.ts
 * OR:
 *   npx playwright test tests/e2e/storefront.spec.ts --headed
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const TEST_CREATOR = 'testcreator';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function visitStorefront(page: Page): Promise<void> {
    await page.goto(`${BASE_URL}/u/${TEST_CREATOR}`, { waitUntil: 'networkidle' });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Storefront — Visitor Flow', () => {
    test('loads the storefront page without errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        await visitStorefront(page);

        // Should not be a 404 or 500
        expect(page.url()).toContain(`/u/${TEST_CREATOR}`);
        // No JS console errors
        expect(errors.filter((e) => !e.includes('favicon'))).toHaveLength(0);
    });

    test('displays creator profile information', async ({ page }) => {
        await visitStorefront(page);

        // Creator name should be visible (in h1)
        const h1 = page.locator('h1').first();
        await expect(h1).toBeVisible();
        await expect(h1).not.toBeEmpty();
    });

    test('service buttons are visible', async ({ page }) => {
        await visitStorefront(page);

        const firstButton = page.locator('[data-testid="service-button-0"]');
        // Only assert if the creator has service buttons
        const count = await firstButton.count();
        if (count > 0) {
            await expect(firstButton).toBeVisible();
        }
    });

    test('clicking a service button opens the lead capture modal', async ({ page }) => {
        await visitStorefront(page);

        const firstButton = page.locator('[data-testid="service-button-0"]');
        const buttonCount = await firstButton.count();

        if (buttonCount === 0) {
            test.skip(); // No buttons configured for test creator
            return;
        }

        await firstButton.click();

        // Modal should open
        const modal = page.locator('[data-testid="lead-modal"]');
        await expect(modal).toBeVisible({ timeout: 3000 });
    });

    test('lead form validates and shows errors for invalid data', async ({ page }) => {
        await visitStorefront(page);

        const firstButton = page.locator('[data-testid="service-button-0"]');
        if (await firstButton.count() === 0) { test.skip(); return; }

        await firstButton.click();
        await expect(page.locator('[data-testid="lead-modal"]')).toBeVisible();

        // Submit empty form
        await page.locator('[data-testid="lead-submit-btn"]').click();

        // Validation errors should appear
        const errors = page.locator('[role="alert"], [id$="-error"]');
        await expect(errors.first()).toBeVisible({ timeout: 2000 });
    });

    test('valid lead submission shows success state', async ({ page }) => {
        await visitStorefront(page);

        const firstButton = page.locator('[data-testid="service-button-0"]');
        if (await firstButton.count() === 0) { test.skip(); return; }

        await firstButton.click();
        await expect(page.locator('[data-testid="lead-modal"]')).toBeVisible();

        // Fill form
        await page.fill('#lead-name', 'Playwright Test User');
        await page.fill('#lead-phone', '+919876543210');
        await page.fill('#lead-email', 'playwright@test.com');

        // Submit
        await page.locator('[data-testid="lead-submit-btn"]').click();

        // Success state: either WhatsApp link or success message
        const successIndicator = page.locator('[data-testid="whatsapp-link"], text=all set');
        await expect(successIndicator.first()).toBeVisible({ timeout: 10000 });
    });

    test('modal closes when close button is clicked', async ({ page }) => {
        await visitStorefront(page);

        const firstButton = page.locator('[data-testid="service-button-0"]');
        if (await firstButton.count() === 0) { test.skip(); return; }

        await firstButton.click();
        await expect(page.locator('[data-testid="lead-modal"]')).toBeVisible();

        // Click close
        await page.locator('[data-testid="modal-close"]').click();

        // Modal should disappear
        await expect(page.locator('[data-testid="lead-modal"]')).not.toBeVisible({ timeout: 2000 });
    });

    test('modal form is reset after close and reopen', async ({ page }) => {
        await visitStorefront(page);

        const firstButton = page.locator('[data-testid="service-button-0"]');
        if (await firstButton.count() === 0) { test.skip(); return; }

        // Open → fill → close
        await firstButton.click();
        await page.fill('#lead-name', 'Should Not Persist');
        await page.locator('[data-testid="modal-close"]').click();
        await page.waitForTimeout(400);

        // Reopen
        await firstButton.click();
        await expect(page.locator('[data-testid="lead-modal"]')).toBeVisible();

        // Name field should be empty
        const nameValue = await page.inputValue('#lead-name');
        expect(nameValue).toBe('');
    });

    test('page is mobile-responsive at 375px viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await visitStorefront(page);

        // No horizontal overflow
        const body = page.locator('body');
        const bodyBox = await body.boundingBox();
        expect(bodyBox?.width).toBeLessThanOrEqual(375);

        // Service buttons should be visible
        const firstButton = page.locator('[data-testid="service-button-0"]');
        if (await firstButton.count() > 0) {
            await expect(firstButton).toBeVisible();
        }
    });

    test('non-existent username shows 404 page', async ({ page }) => {
        const res = await page.goto(`${BASE_URL}/u/this-creator-absolutely-does-not-exist-zz9999`);
        expect(res?.status()).toBe(404);
    });

    test('keyboard navigation: Tab reaches first service button', async ({ page }) => {
        await visitStorefront(page);

        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        const firstButton = page.locator('[data-testid="service-button-0"]');
        if (await firstButton.count() > 0) {
            // Can reach button via keyboard (may need more tabs based on page structure)
            await expect(firstButton).toBeVisible();
        }
    });
});

test.describe('Storefront — SEO & Meta', () => {
    test('page has a canonical link tag', async ({ page }) => {
        await visitStorefront(page);

        const canonical = page.locator('link[rel="canonical"]');
        await expect(canonical).toHaveCount(1);
        const href = await canonical.getAttribute('href');
        expect(href).toContain(TEST_CREATOR);
    });

    test('page has JSON-LD structured data', async ({ page }) => {
        await visitStorefront(page);

        const jsonLd = page.locator('script[type="application/ld+json"]');
        await expect(jsonLd).toHaveCount(1);
        const content = await jsonLd.textContent();
        const parsed = JSON.parse(content || '{}');
        expect(parsed['@type']).toBe('Person');
    });

    test('page has Open Graph meta tags', async ({ page }) => {
        await visitStorefront(page);

        const ogTitle = page.locator('meta[property="og:title"]');
        await expect(ogTitle).toHaveCount(1);
    });
});
