import { suite, test, expect, screenshot } from 'testsprite'

suite('Coupon System', () => {

    test('Coupons page loads correctly', async (page) => {
        await page.goto('/dashboard/products/coupons')
        await screenshot('coupons-page')
        expect(page).not.toHaveText('Application error')
    })

    test('Create Coupon button opens modal', async (page) => {
        await page.goto('/dashboard/products/coupons')
        await page.click('button:has-text("Create Coupon")')
        await screenshot('coupon-modal-open')
        expect(page).toHaveText('Coupon Code, Discount')
    })

    test('Coupon code auto-uppercases as you type', async (page) => {
        await page.goto('/dashboard/products/coupons')
        await page.click('button:has-text("Create Coupon")')
        await page.fill('input[name="code"]', 'save20off')
        await screenshot('coupon-code-uppercase')
        expect(page).toHaveValue('input[name="code"]', 'SAVE20OFF')
    })

    test('Generate button creates random code', async (page) => {
        await page.goto('/dashboard/products/coupons')
        await page.click('button:has-text("Create Coupon")')
        await page.click('button:has-text("Generate"), button:has-text("🎲")')
        const code = await page.getValue('input[name="code"]')
        await screenshot('coupon-generated-code')
        expect(code.length).toBeGreaterThanOrEqual(6)
    })

    test('Percentage discount type shows % value field', async (page) => {
        await page.goto('/dashboard/products/coupons')
        await page.click('button:has-text("Create Coupon")')
        await page.click('label:has-text("Percentage"), input[value="percentage"]')
        await screenshot('coupon-percentage-type')
        expect(page).toHaveElement('input[placeholder*="%"], input[placeholder*="percent"]')
    })

    test('Duplicate code shows error inside modal', async (page) => {
        await page.goto('/dashboard/products/coupons')
        await page.click('button:has-text("Create Coupon")')
        await page.fill('input[name="code"]', 'EXISTING123')
        await page.fill('input[name="discountValue"]', '10')
        await page.click('button:has-text("Save")')
        await page.click('button:has-text("Create Coupon")')
        await page.fill('input[name="code"]', 'EXISTING123')
        await page.click('button:has-text("Save")')
        await screenshot('coupon-duplicate-error')
        expect(page).toHaveText('already exists, duplicate, taken')
        expect(page).toHaveElement('.modal, [role="dialog"]')
    })

    test('Toggle switch changes coupon active state', async (page) => {
        await page.goto('/dashboard/products/coupons')
        const toggle = 'button[role="switch"]'
        if (await page.hasElement(toggle)) {
            const before = await page.getAttribute(toggle, 'aria-checked')
            await page.click(toggle)
            await page.wait(800)
            const after = await page.getAttribute(toggle, 'aria-checked')
            await screenshot('coupon-toggle')
            expect(before).not.toBe(after)
        }
    })

    test('Expired coupon shows red Expired badge', async (page) => {
        // Create expired coupon via API first
        await page.apiCall('POST', '/api/creator/coupons', {
            code: 'EXPIRED999', discountType: 'percentage', discountValue: 10,
            validUntil: new Date(Date.now() - 86400000).toISOString(), isActive: true
        })
        await page.goto('/dashboard/products/coupons')
        await screenshot('coupon-expired-badge')
        expect(page).toHaveText('Expired')
    })

    test('POST /api/storefront/validate-coupon validates correctly', async (page) => {
        const result = await page.apiCall('POST', '/api/storefront/validate-coupon', {
            code: 'INVALID_CODE_XYZ', creatorId: 'test', orderAmount: 49900
        }, { auth: false })
        expect([200, 400, 404]).toContain(result.status)
        expect(result.body).toHaveProperty('valid')
    })

})
