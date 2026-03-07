import { suite, test, expect, screenshot } from 'testsprite'

suite('Instagram AutoDM', () => {

    test('Automation page loads without error', async (page) => {
        await page.goto('/dashboard/automation')
        await page.waitForNetworkIdle()
        await screenshot('autodm-page')
        expect(page).not.toHaveText('Application error')
    })

    test('Shows Connect Instagram card if not connected', async (page) => {
        await page.goto('/dashboard/automation')
        const connected = await page.hasText('@')
        const connectCard = await page.hasText('Connect Instagram')
        await screenshot('autodm-connection-state')
        expect(connected || connectCard).toBe(true)
    })

    test('Connect Instagram button points to OAuth', async (page) => {
        await page.goto('/dashboard/automation')
        const connectBtn = 'button:has-text("Connect Instagram"), a:has-text("Connect Instagram")'
        if (await page.hasElement(connectBtn)) {
            const href = await page.getAttribute(connectBtn, 'href') || ''
            const onclick = await page.getAttribute(connectBtn, 'onclick') || ''
            await screenshot('autodm-connect-button')
            expect(href + onclick).toMatch(/instagram|api\/instagram\/connect/)
        }
    })

    test('Stats cards render without crashing', async (page) => {
        await page.goto('/dashboard/automation')
        await page.waitForNetworkIdle()
        await screenshot('autodm-stats')
        expect(page).not.toHaveText('undefined, NaN, null')
    })

    test('Rules tab shows rules or empty state', async (page) => {
        await page.goto('/dashboard/automation')
        await page.click('button:has-text("Rules")')
        await page.wait(1000)
        await screenshot('autodm-rules-tab')
        const hasRules = await page.hasElement('[data-testid="rule-row"], .rule-item')
        const hasEmpty = await page.hasText('No rules, Create your first rule')
        expect(hasRules || hasEmpty).toBe(true)
    })

    test('Create Rule button opens modal with all fields', async (page) => {
        await page.goto('/dashboard/automation')
        await page.click('button:has-text("Create Rule"), button:has-text("+ Rule")')
        await screenshot('autodm-create-rule-modal')
        expect(page).toHaveElement('input[name="keyword"], input[placeholder*="keyword"]')
        expect(page).toHaveElement('textarea[name="dmMessage"], textarea[placeholder*="message"]')
        expect(page).toHaveText('Exact, Contains, Follow Gate, Daily Limit')
    })

    test('Pending tab loads without error', async (page) => {
        await page.goto('/dashboard/automation')
        await page.click('button:has-text("Pending")')
        await page.wait(1000)
        await screenshot('autodm-pending-tab')
        expect(page).not.toHaveText('Application error')
    })

    test('Activity tab loads without error', async (page) => {
        await page.goto('/dashboard/automation')
        await page.click('button:has-text("Activity")')
        await page.wait(1000)
        await screenshot('autodm-activity-tab')
        expect(page).not.toHaveText('Application error')
    })

    test('GET /api/instagram/status returns valid response', async (page) => {
        const result = await page.apiCall('GET', '/api/instagram/status')
        expect(result.status).not.toBe(404)
        expect(result.status).not.toBe(500)
        expect(result.body).toHaveProperty('connected')
    })

    test('GET /api/creator/autodm/rules returns array', async (page) => {
        const result = await page.apiCall('GET', '/api/creator/autodm/rules')
        expect(result.status).toBe(200)
        expect(result.body).toHaveProperty('rules')
        expect(Array.isArray(result.body.rules)).toBe(true)
    })

    test('GET /api/creator/autodm/stats returns metrics', async (page) => {
        const result = await page.apiCall('GET', '/api/creator/autodm/stats')
        expect(result.status).toBe(200)
        expect(result.body).toHaveProperty('totalDMsSent')
    })

    test('POST rule without keyword shows validation error', async (page) => {
        const result = await page.apiCall('POST', '/api/creator/autodm/rules', {
            dmMessage: 'hello', matchType: 'exact'
            // keyword intentionally missing
        })
        expect(result.status).toBe(400)
    })

})
