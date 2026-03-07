import { test } from '@playwright/test';

test('DEBUG: Inspect Clerk sign-in form', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForTimeout(5000);

    const inputs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('input')).map(i => ({
            name: i.name,
            type: i.type,
            placeholder: i.placeholder,
            id: i.id,
            className: i.className.substring(0, 80),
            autocomplete: i.autocomplete,
        }));
    });
    console.log('\n📋 INPUT FIELDS FOUND:');
    console.table(inputs);

    const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map(b => ({
            text: b.textContent?.trim().substring(0, 50),
            type: b.type,
            className: b.className.substring(0, 80),
        }));
    });
    console.log('\n🔘 BUTTONS FOUND:');
    console.table(buttons);

    const html = await page.content();
    require('fs').writeFileSync('tests/auth/clerk-login-debug.html', html);
    console.log('\n💾 Full HTML saved to tests/auth/clerk-login-debug.html');

    await page.screenshot({ path: 'tests/auth/clerk-login-debug.png', fullPage: true });
    console.log('📸 Screenshot: tests/auth/clerk-login-debug.png');
});
