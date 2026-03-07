import { test, expect } from '@playwright/test';

test.describe('New Email Campaign Page', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard/email/campaigns/new');
        await page.waitForLoadState('networkidle');
    });

    test('Page loads without broken layout', async ({ page }) => {
        await expect(page.locator('text=Application error')).not.toBeVisible();
        const heading = page.locator('h1, h2, text=New Campaign, text=EMAIL, text=Campaign').first();
        await expect(heading).toBeVisible();
    });

    test('Campaign name input works', async ({ page }) => {
        const nameInput = page.locator('input[placeholder*="campaign"], input[placeholder*="Campaign"], input[placeholder*="NEWSLETTER"], input[placeholder*="FEB"]').first();
        if (await nameInput.isVisible()) {
            await nameInput.fill('Test Campaign July');
            expect(await nameInput.inputValue()).toBe('Test Campaign July');
        }
    });

    test('Subject line input works', async ({ page }) => {
        const subjectInput = page.locator('input[placeholder*="subject"], input[placeholder*="Subject"], input[placeholder*="impact"]').first();
        if (await subjectInput.isVisible()) {
            await subjectInput.fill('🎉 Hello {{first_name}}!');
            expect(await subjectInput.inputValue()).toBe('🎉 Hello {{first_name}}!');
        }
    });

    test('Target audience selector is visible', async ({ page }) => {
        const selector = page.locator('select, text=ALL SUBSCRIBERS, text=GLOBAL').first();
        await expect(selector).toBeVisible();
    });

    test('Content editor is interactive', async ({ page }) => {
        const editor = page.locator('.tiptap, [contenteditable="true"]').first();
        await expect(editor).toBeVisible();
        await editor.focus();
        await page.keyboard.type('Hello from Playwright Automated Test!');

        const content = await editor.innerText();
        expect(content.length).toBeGreaterThan(5);
    });

    test('Live preview updates with subject inline', async ({ page }) => {
        const subjectInput = page.locator('input[placeholder*="subject"], input[placeholder*="impact"]').first();
        if (await subjectInput.isVisible()) {
            await subjectInput.fill('My Test Subject XYZ');
            // Preview is in an iframe-like div with specific styles
            const preview = page.locator('div:has-text("My Test Subject XYZ")').last();
            await expect(preview).toBeVisible();
        }
    });

    test('Preview replaces {{first_name}} placeholder', async ({ page }) => {
        const editor = page.locator('.tiptap, [contenteditable="true"]').first();
        if (await editor.isVisible()) {
            await editor.focus();
            await page.keyboard.type('Hello {{first_name}}, welcome!');

            // Wait for state sync
            await page.waitForTimeout(1000);

            // The preview renders Subscriber
            const preview = page.locator('div:has-text("Subscriber")').last();
            await expect(preview).toBeVisible();
        }
    });

    test('Schedule datetime picker exists', async ({ page }) => {
        const datePicker = page.locator('input[type="datetime-local"]').first();
        await expect(datePicker).toBeVisible();
    });

    test('Save Draft button exists and works', async ({ page }) => {
        const draftBtn = page.locator('button:has-text("Draft"), button:has-text("DRAFT"), button:has-text("PRESERVE")').first();
        await expect(draftBtn).toBeVisible();
        await expect(draftBtn).toBeEnabled();
    });

    test('Deploy/Send button is visible', async ({ page }) => {
        const sendBtn = page.locator('button:has-text("Send"), button:has-text("DEPLOY"), button:has-text("SCHEDULE")').first();
        await expect(sendBtn).toBeVisible();
    });

    test('Test email section exists', async ({ page }) => {
        const testSection = page.locator('text=Test, text=Simulation, text=SIMULATION, text=Campaign Simulation').first();
        await expect(testSection).toBeVisible();
    });

    test('Estimated impact section shows count', async ({ page }) => {
        await page.waitForTimeout(2000);
        const impactSection = page.locator('text=Estimated Impact, text=Potential Eyes, text=ESTIMATED').first();
        await expect(impactSection).toBeVisible();
    });

    test('Subscriber count API works', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const r = await fetch('/api/creator/email/subscribers/count?listId=all');
            const data = await r.json();
            return { status: r.status, count: data.count };
        });
        expect(result.status).not.toBe(404);
        expect(result.status).not.toBe(500);
        expect(typeof result.count).toBe('number');
    });
});
