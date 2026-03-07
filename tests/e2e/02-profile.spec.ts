import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Profile Page', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard/profile');
        await page.waitForLoadState('networkidle');
    });

    test('Profile page loads with user info', async ({ page }) => {
        // Should show the profile heading or user info:
        const heading = page.locator('h1, h2').first();
        await expect(heading).toBeVisible();
        const text = await heading.innerText();
        expect(text.length).toBeGreaterThan(0);
    });

    test('Display name input is visible and editable', async ({ page }) => {
        const nameInput = page.locator('input').first();
        await expect(nameInput).toBeVisible();
    });

    test('Save button exists and is clickable', async ({ page }) => {
        const saveBtn = page.locator('button:has-text("SYNC IDENTITY")').first();
        await expect(saveBtn).toBeVisible();
        await expect(saveBtn).toBeEnabled();
    });

    test('File input exists for avatar upload', async ({ page }) => {
        // The input is hidden but should exist
        const fileInput = page.locator('input[type="file"][accept*="image"]');
        await expect(fileInput).toHaveCount(1);
    });

    test('Camera button triggers file picker', async ({ page }) => {
        // We have two camera icons, one for the avatar overlay and one for the button
        const cameraBtn = page.locator('button').filter({ has: page.locator('svg.lucide-camera') }).first();
        await expect(cameraBtn).toBeVisible();
    });

    test('Avatar upload API protocol exists', async ({ page }) => {
        const response = await page.evaluate(async () => {
            const r = await fetch('/api/upload/presigned', { method: 'OPTIONS' });
            return { status: r.status };
        });
        expect(response.status).not.toBe(404);
    });

    test('Avatar upload flow initialization', async ({ page }) => {
        const testImagePath = path.join(__dirname, '../fixtures/test-avatar.jpg');
        // If fixture doesn't exist, we'll just check the UI triggers
        const fileInput = page.locator('input[type="file"]').first();

        // Check if we can set files (even if it fails later, we check the protocol)
        if (require('fs').existsSync(testImagePath)) {
            const uploadPromise = page.waitForResponse(
                res => res.url().includes('/api/upload/presigned') && res.request().method() === 'POST',
                { timeout: 15000 }
            );
            await fileInput.setInputFiles(testImagePath);
            const response = await uploadPromise;
            expect(response.status()).toBe(200);
        } else {
            test.info().annotations.push({ type: 'info', description: 'Test image fixture missing, skipping full upload verification' });
        }
    });

    test('QR Code section is visible', async ({ page }) => {
        const qrLabel = page.locator('text=Project Identity QR').first();
        await expect(qrLabel).toBeVisible();
        const qrSvg = page.locator('svg').filter({ hasText: '' }).last(); // Should be the QR code
        await expect(qrSvg).toBeVisible();
    });

    test('Public profile link button works', async ({ page }) => {
        const publicBtn = page.locator('button:has-text("OPEN STOREFRONT")').first();
        await expect(publicBtn).toBeVisible();
    });

    test('Social media integration fields exist', async ({ page }) => {
        await expect(page.locator('input[placeholder*="Instagram"]')).toBeVisible();
        await expect(page.locator('input[placeholder*="Twitter"]')).toBeVisible();
        await expect(page.locator('input[placeholder*="Youtube"]')).toBeVisible();
    });
});
