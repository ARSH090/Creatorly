import { suite, test, expect, screenshot } from 'testsprite'

suite('Authentication & Onboarding', () => {

    test('Sign-in page loads correctly', async (page) => {
        await page.goto('/sign-in')
        await screenshot('sign-in-page')
        expect(page).toHaveTitle(/Sign in/)
        expect(page).toHaveElement('input[type="email"], input[name="identifier"]')
    })

    test('Invalid credentials shows error', async (page) => {
        await page.goto('/sign-in')
        await page.fill('input[name="identifier"]', 'wrong@email.com')
        await page.click('button[type="submit"]')
        await page.fill('input[type="password"]', 'wrongpassword')
        await page.pressEnter()
        await screenshot('sign-in-error')
        expect(page).toHaveText('Invalid credentials, Incorrect password, doesn\'t exist')
    })

    test('Valid credentials redirects to dashboard', async (page) => {
        await page.loginAs(process.env.TEST_USER_EMAIL, process.env.TEST_USER_PASSWORD)
        await screenshot('dashboard-after-login')
        expect(page).toBeAt('/dashboard')
    })

    test('Unauthenticated access to dashboard redirects to sign-in', async (page) => {
        await page.clearAuth()
        await page.goto('/dashboard')
        await screenshot('redirect-to-signin')
        expect(page).toBeAt(/sign-in/)
    })

    test('Onboarding page shows multi-step form', async (page) => {
        await page.goto('/onboarding')
        await screenshot('onboarding-page')
        expect(page).toHaveElement('input, form')
        expect(page).not.toHaveText('Application error')
    })

})
