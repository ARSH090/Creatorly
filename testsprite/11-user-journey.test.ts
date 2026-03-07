import { suite, test, expect, screenshot } from 'testsprite'

suite('Complete Creator Journey', () => {

    test('JOURNEY: Creator sets up profile', async (page) => {
        await page.goto('/dashboard/profile')
        await page.fill('input[name="name"]', 'Journey Test Creator')
        await page.fill('textarea[name="bio"]', 'I create amazing digital products')
        await page.click('button:has-text("Save")')
        await screenshot('journey-01-profile-saved')
        expect(page).toHaveText('saved, success, updated')
    })

    test('JOURNEY: Creator creates and publishes a product', async (page) => {
        await page.goto('/dashboard/products/new')
        await page.fill('input[name="name"]', 'Journey Test Ebook')
        await page.fill('input[name="price"]', '299')
        await page.select('select[name="type"]', 'ebook')
        await page.fill('textarea[name="description"]', 'A test ebook for the creator journey')
        await page.click('button:has-text("Publish")')
        await page.waitForNavigation()
        await screenshot('journey-02-product-created')
        expect(page).toHaveText('published, created, success')
    })

    test('JOURNEY: Creator creates a coupon for their product', async (page) => {
        await page.goto('/dashboard/products/coupons')
        await page.click('button:has-text("Create Coupon")')
        await page.fill('input[name="code"]', 'JOURNEY10')
        await page.click('label:has-text("Percentage")')
        await page.fill('input[name="discountValue"]', '10')
        await page.click('button:has-text("Save")')
        await screenshot('journey-03-coupon-created')
        expect(page).toHaveText('JOURNEY10')
    })

    test('JOURNEY: Creator customizes their storefront', async (page) => {
        await page.goto('/dashboard/storefront/editor')
        await page.wait(2000)
        await screenshot('journey-04-storefront-editor')
        expect(page).not.toHaveText('Application error')
        // Find and click Save
        await page.click('button:has-text("Save")')
        await page.wait(1000)
        await screenshot('journey-04b-storefront-saved')
    })

    test('JOURNEY: Creator sets up AutoDM rule', async (page) => {
        await page.goto('/dashboard/automation')
        const hasCreate = await page.hasElement('button:has-text("Create Rule")')
        if (hasCreate) {
            await page.click('button:has-text("Create Rule")')
            await page.fill('input[name="keyword"]', 'ebook')
            await page.fill('textarea[name="dmMessage"]', 'Hi {{name}}! Here is the link: {{link}}')
            await page.click('button:has-text("Save")')
            await screenshot('journey-05-autodm-rule')
        }
    })

    test('JOURNEY: Creator sends test email campaign', async (page) => {
        await page.goto('/dashboard/email/campaigns/new')
        await page.fill('input[name="name"]', 'Journey Test Campaign')
        await page.fill('input[name="subject"]', 'Hello {{first_name}}!')
        const testBtn = 'button:has-text("Send Test")'
        if (await page.hasElement(testBtn)) {
            await page.click(testBtn)
            await screenshot('journey-06-test-email-sent')
            expect(page).toHaveText('sent, test email, success')
        }
    })

    test('JOURNEY: Public storefront is accessible', async (page) => {
        const username = process.env.TEST_USERNAME || 'testcreator'
        await page.goto(`/u/${username}`, { auth: false })
        await screenshot('journey-07-public-storefront')
        expect(page).not.toHaveText('Application error')
    })

    test('JOURNEY: Coupon validates at public checkout', async (page) => {
        const result = await page.apiCall('POST', '/api/storefront/validate-coupon', {
            code: 'JOURNEY10', orderAmount: 29900
        }, { auth: false })
        await screenshot('journey-08-coupon-validation')
        expect(result.status).toBe(200)
        expect(result.body).toHaveProperty('valid')
    })

})
