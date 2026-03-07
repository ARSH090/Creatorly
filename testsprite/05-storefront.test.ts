import { suite, test, expect, screenshot } from 'testsprite'

suite('Storefront', () => {

    test('Storefront overview page loads', async (page) => {
        await page.goto('/dashboard/storefront')
        await screenshot('storefront-overview')
        expect(page).not.toHaveText('Application error')
    })

    test('Advanced Editor button is visible and prominent', async (page) => {
        await page.goto('/dashboard/storefront')
        await screenshot('storefront-editor-button')
        expect(page).toHaveElement('button:has-text("Advanced Editor"), a:has-text("Advanced Editor")')
    })

    test('Advanced Editor button navigates to editor', async (page) => {
        await page.goto('/dashboard/storefront')
        await page.click('button:has-text("Advanced Editor"), a:has-text("Advanced Editor")')
        await screenshot('storefront-navigated-to-editor')
        expect(page).toBeAt(/storefront\/editor/)
    })

    test('Storefront editor loads without error', async (page) => {
        await page.goto('/dashboard/storefront/editor')
        await page.wait(3000)
        await screenshot('storefront-editor-loaded')
        expect(page).not.toHaveText('Application error')
    })

    test('Editor shows block library', async (page) => {
        await page.goto('/dashboard/storefront/editor')
        await page.wait(2000)
        await screenshot('storefront-block-library')
        expect(page).toHaveText('Hero, Products, Text, Image')
    })

    test('Editor has device preview buttons', async (page) => {
        await page.goto('/dashboard/storefront/editor')
        await screenshot('storefront-device-preview')
        expect(page).toHaveElement('button:has-text("Desktop"), button:has-text("Mobile")')
    })

    test('Editor has Save button', async (page) => {
        await page.goto('/dashboard/storefront/editor')
        await screenshot('storefront-save-button')
        expect(page).toHaveElement('button:has-text("Save")')
    })

    test('Editor has Undo button', async (page) => {
        await page.goto('/dashboard/storefront/editor')
        await screenshot('storefront-undo-button')
        expect(page).toHaveElement('button:has-text("Undo"), button[title="Undo"]')
    })

    test('GET /api/creator/storefront/layout returns layout', async (page) => {
        const result = await page.apiCall('GET', '/api/creator/storefront/layout')
        expect(result.status).toBe(200)
        expect(result.body).toHaveProperty('layout')
    })

    test('Public storefront loads at /u/[username]', async (page) => {
        const username = process.env.TEST_USERNAME || 'testcreator'
        const res = await page.goto(`/u/${username}`, { auth: false })
        await screenshot('public-storefront')
        expect(res.status).not.toBe(500)
    })

    test('Public storefront is mobile responsive', async (page) => {
        await page.setMobileViewport()
        await page.goto(`/u/${process.env.TEST_USERNAME || 'testcreator'}`, { auth: false })
        await screenshot('public-storefront-mobile')
        expect(page).not.toHaveHorizontalScroll()
    })

    test('Unknown username returns 404', async (page) => {
        const res = await page.goto('/u/this_creator_does_not_exist_xyz_9999', { auth: false })
        await screenshot('storefront-404')
        expect(res.status).toBe(404)
    })

})
