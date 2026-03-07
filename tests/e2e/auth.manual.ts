import { test as setup } from '@playwright/test';
import * as fs from 'fs';

const SESSION_FILE = 'tests/auth/session.json';

setup('Manual login — do this once', async ({ page, context }) => {
    fs.mkdirSync('tests/auth', { recursive: true });

    console.log('\n' + '='.repeat(60));
    console.log('  MANUAL LOGIN REQUIRED');
    console.log('='.repeat(60));
    console.log('The browser will open. Please:');
    console.log('1. Log in to Creatorly manually');
    console.log('2. Wait until you see the dashboard');
    console.log('3. Come back to this terminal');
    console.log('4. Press Enter to save the session');
    console.log('='.repeat(60) + '\n');

    await page.goto('http://localhost:3000/auth/login');

    // Wait for user to manually log in:
    await new Promise<void>((resolve) => {
        process.stdin.once('data', () => resolve());
        console.log('Waiting... Press ENTER after you logged in successfully.');
    });

    const url = page.url();
    console.log(`Current URL: ${url}`);

    if (!url.includes('dashboard')) {
        console.log('Warning: Not on dashboard. Saving session anyway.');
    }

    await context.storageState({ path: SESSION_FILE });
    console.log(`Session saved to ${SESSION_FILE}`);
    console.log('You only need to do this once. Run tests normally now.');
});
