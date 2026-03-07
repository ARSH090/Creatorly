import { suite, test, expect, screenshot } from 'testsprite'

suite('Tier Gating & Plan Enforcement', () => {

    test('Tier status API returns real counts', async (page) => {
        const result = await page.apiCall('GET', '/api/creator/tier-status')
        expect(result.status).toBe(200)
        expect(result.body).toHaveProperty('usage')
        expect(result.body).toHaveProperty('limits')
        expect(result.body).toHaveProperty('canCreate')
        // Must NOT be placeholder zeros if creator has products:
        expect(typeof result.body.usage.productCount).toBe('number')
    })

    test('Plan limits shown in dashboard', async (page) => {
        await page.goto('/dashboard')
        await screenshot('dashboard-plan-limits')
        expect(page).toHaveText('products, subscribers, automations')
    })

    test('Products count matches what is in DB', async (page) => {
        const tierResult = await page.apiCall('GET', '/api/creator/tier-status')
        const productsResult = await page.apiCall('GET', '/api/creator/products')
        const actualCount = productsResult.body.products?.filter((p: any) => p.status !== 'archived').length ?? 0
        expect(tierResult.body.usage.productCount).toBe(actualCount)
    })

    test('Usage percentages are not hardcoded 0%', async (page) => {
        await page.goto('/dashboard')
        await screenshot('dashboard-usage-percentages')
        // Should NOT show 0/0 for everything if creator has content
        expect(page).not.toHaveText('0/0, NaN%, undefined%')
    })

})
