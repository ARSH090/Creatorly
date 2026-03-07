import { suite, test, expect, screenshot } from 'testsprite'

suite('Creator Profile', () => {

    test('Profile page loads without error', async (page) => {
        await page.goto('/dashboard/profile')
        await screenshot('profile-page-load')
        expect(page).not.toHaveText('Application error')
        expect(page).not.toHaveText('500')
    })

    test('Profile form shows all required fields', async (page) => {
        await page.goto('/dashboard/profile')
        await screenshot('profile-form-fields')
        expect(page).toHaveElement('input[name="name"], input[placeholder*="name"]')
        expect(page).toHaveElement('textarea[name="bio"], textarea[placeholder*="bio"]')
        expect(page).toHaveElement('button:has-text("Save")')
    })

    test('Avatar upload button is visible and clickable', async (page) => {
        await page.goto('/dashboard/profile')
        await screenshot('profile-avatar-area')
        expect(page).toHaveElement('button:has-text("Upload"), label:has-text("Upload")')
        expect(page).toHaveElement('input[type="file"][accept*="image"]')
    })

    test('Updating display name and saving works', async (page) => {
        await page.goto('/dashboard/profile')
        const nameInput = 'input[name="name"]'
        await page.clear(nameInput)
        await page.fill(nameInput, 'Test Creator Name')
        await page.click('button:has-text("Save")')
        await screenshot('profile-save-result')
        expect(page).toHaveText('saved, success, updated')
    })

    test('Invalid website URL shows validation error', async (page) => {
        await page.goto('/dashboard/profile')
        await page.fill('input[name="website"]', 'not-a-valid-url')
        await page.click('button:has-text("Save")')
        await screenshot('profile-validation-error')
        expect(page).toHaveText('valid URL, https://')
    })

    test('Avatar upload API rejects non-image files', async (page) => {
        const result = await page.apiCall('POST', '/api/creator/profile/upload-avatar', {
            file: { name: 'test.txt', type: 'text/plain', content: 'hello' }
        })
        await screenshot('avatar-invalid-type')
        expect(result.status).toBe(400)
    })

    test('Profile page is mobile responsive', async (page) => {
        await page.setMobileViewport()
        await page.goto('/dashboard/profile')
        await screenshot('profile-mobile')
        expect(page).not.toHaveHorizontalScroll()
    })

})
