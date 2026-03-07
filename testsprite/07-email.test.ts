import { suite, test, expect, screenshot } from 'testsprite'

suite('Email Campaigns', () => {

    test('Email campaigns list loads', async (page) => {
        await page.goto('/dashboard/email/campaigns')
        await screenshot('email-campaigns-list')
        expect(page).not.toHaveText('Application error')
    })

    test('New Campaign page loads correctly', async (page) => {
        await page.goto('/dashboard/email/campaigns/new')
        await screenshot('email-new-campaign')
        expect(page).not.toHaveText('Application error')
    })

    test('Campaign form has all required fields', async (page) => {
        await page.goto('/dashboard/email/campaigns/new')
        await screenshot('email-form-fields')
        expect(page).toHaveElement('input[name="name"], input[placeholder*="campaign name"]')
        expect(page).toHaveElement('input[name="subject"]')
        expect(page).toHaveElement('button:has-text("Send")')
    })

    test('Live preview updates as subject is typed', async (page) => {
        await page.goto('/dashboard/email/campaigns/new')
        await page.fill('input[name="subject"]', 'Test Subject PREVIEW999')
        await page.wait(400)
        await screenshot('email-preview-updates')
        expect(page).toHaveText('PREVIEW999')
    })

    test('{{first_name}} replaced with Ravi in preview', async (page) => {
        await page.goto('/dashboard/email/campaigns/new')
        await page.fill('input[name="subject"]', 'Hello {{first_name}} welcome!')
        await page.wait(400)
        await screenshot('email-placeholder-replaced')
        expect(page).toHaveText('Hello Ravi welcome!')
    })

    test('Recipient count shows from API', async (page) => {
        await page.goto('/dashboard/email/campaigns/new')
        await page.wait(2000)
        await screenshot('email-recipient-count')
        expect(page).toHaveText('subscribers, recipients')
    })

    test('Schedule option shows datetime picker', async (page) => {
        await page.goto('/dashboard/email/campaigns/new')
        await page.click('label:has-text("Schedule"), input[value="scheduled"]')
        await screenshot('email-schedule-picker')
        expect(page).toHaveElement('input[type="datetime-local"]')
    })

    test('Empty form submit shows validation errors', async (page) => {
        await page.goto('/dashboard/email/campaigns/new')
        await page.click('button:has-text("Send")')
        await screenshot('email-validation-errors')
        expect(page).toHaveText('required')
    })

    test('Past date in scheduler shows error', async (page) => {
        await page.goto('/dashboard/email/campaigns/new')
        await page.fill('input[name="name"]', 'Test Campaign')
        await page.fill('input[name="subject"]', 'Test Subject')
        await page.click('label:has-text("Schedule")')
        await page.fill('input[type="datetime-local"]', '2020-01-01T10:00')
        await page.click('button:has-text("Schedule")')
        await screenshot('email-past-date-error')
        expect(page).toHaveText('future, must be, invalid date')
    })

    test('GET /api/creator/email/campaigns returns array', async (page) => {
        const result = await page.apiCall('GET', '/api/creator/email/campaigns')
        expect(result.status).toBe(200)
        expect(result.body).toHaveProperty('campaigns')
    })

    test('GET /api/creator/email/subscribers/count returns number', async (page) => {
        const result = await page.apiCall('GET', '/api/creator/email/subscribers/count?audience=all')
        expect(result.status).toBe(200)
        expect(typeof result.body.count).toBe('number')
    })

})
