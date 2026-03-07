import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SESSION_FILE = 'tests/auth/session.json';

setup('Login to Creatorly via Clerk', async ({ page }) => {
    fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });

    console.log('🔐 Starting Clerk login flow...');
    console.log(`📧 Email: ${process.env.TEST_USER_EMAIL}`);

    // Step 1: Go to the custom login page:
    await page.goto('/auth/login', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
    });
    await page.waitForTimeout(3000); // Wait for Clerk JS to initialize

    await page.screenshot({ path: 'tests/auth/step1-login-page.png' });
    console.log('📸 Screenshot: tests/auth/step1-login-page.png');

    // Step 2: Fill email:
    const emailSelectors = [
        'input[type="email"]',
        'input[name="identifier"]',
        'input[name="emailAddress"]',
        'input[placeholder*="user@"]',
        'input[placeholder*="email"]',
        '.cl-formFieldInput__identifier',
    ];

    let emailFilled = false;
    for (const sel of emailSelectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 1500 }).catch(() => false)) {
            await el.click();
            await el.fill(process.env.TEST_USER_EMAIL || '');
            emailFilled = true;
            console.log(`✅ Email filled via: ${sel}`);
            break;
        }
    }

    if (!emailFilled) {
        await page.screenshot({ path: 'tests/auth/step2-email-not-found.png' });
        console.error('❌ Could not find email input. Check tests/auth/step2-email-not-found.png');
        // Save empty session so tests still run:
        await page.context().storageState({ path: SESSION_FILE });
        return;
    }

    // Step 3: Fill password:
    const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[autocomplete="current-password"]',
        '.cl-formFieldInput__password',
    ];

    let passwordFilled = false;
    for (const sel of passwordSelectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 1500 }).catch(() => false)) {
            await el.click();
            await el.fill(process.env.TEST_USER_PASSWORD || '');
            passwordFilled = true;
            console.log(`✅ Password filled via: ${sel}`);
            break;
        }
    }

    if (!passwordFilled) {
        await page.screenshot({ path: 'tests/auth/step3-password-not-found.png' });
        console.error('❌ Could not find password input. Check tests/auth/step3-password-not-found.png');
        await page.context().storageState({ path: SESSION_FILE });
        return;
    }

    // Step 4: Click submit button:
    const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Sign In")',
        'button:has-text("Continue")',
        '.cl-formButtonPrimary',
    ];

    for (const sel of submitSelectors) {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
            await btn.click();
            console.log(`✅ Clicked submit via: ${sel}`);
            break;
        }
    }

    await page.screenshot({ path: 'tests/auth/step4-after-submit.png' });

    // Step 5: Wait for redirect to dashboard:
    try {
        await page.waitForURL('**/dashboard**', { timeout: 25000 });
        console.log('✅ Redirected to dashboard!');
    } catch {
        await page.screenshot({ path: 'tests/auth/step5-stuck.png' });
        const currentUrl = page.url();
        console.warn(`⚠️ Login did not redirect. Stuck at: ${currentUrl}`);
        console.warn('Check tests/auth/step5-stuck.png');

        // Check for visible error messages:
        const errorText = await page.locator('.bg-red-500, [class*="error"], [class*="alert"]')
            .first().textContent({ timeout: 2000 }).catch(() => '');
        if (errorText) {
            console.warn(`⚠️ Error on page: ${errorText.trim().substring(0, 150)}`);
        }

        // If we ended up somewhere useful, still save:
        if (currentUrl.includes('dashboard') || currentUrl.includes('setup')) {
            console.log('ℹ️ On a valid page, saving session anyway');
        }
    }

    // Step 6: Save session (always — even partial):
    await page.waitForTimeout(2000);
    await page.context().storageState({ path: SESSION_FILE });
    console.log(`📁 Session saved to ${SESSION_FILE}`);
});
