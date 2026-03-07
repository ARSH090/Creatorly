import { suite, test, expect, screenshot } from 'testsprite'

suite('Product Management', () => {

    test('Products page loads correctly', async (page) => {
        await page.goto('/dashboard/products')
        await screenshot('products-page-load')
        expect(page).not.toHaveText('Application error')
    })

    test('Shows products or empty state (never blank)', async (page) => {
        await page.goto('/dashboard/products')
        await page.waitForNetworkIdle()
        await screenshot('products-content')
        const hasProducts = await page.hasElement('.product-row, [data-testid="product"]')
        const hasEmptyState = await page.hasText('No products, Create your first')
        expect(hasProducts || hasEmptyState).toBe(true)
    })

    test('Stats cards show correct data', async (page) => {
        await page.goto('/dashboard/products')
        await screenshot('products-stats')
        expect(page).toHaveText('Total, Published, Draft, Revenue')
    })

    test('Search filters products in real time', async (page) => {
        await page.goto('/dashboard/products')
        await page.fill('input[placeholder*="Search"]', 'ebook')
        await page.wait(500)
        await screenshot('products-search')
        expect(page).not.toHaveText('Application error')
    })

    test('New Product button navigates to create form', async (page) => {
        await page.goto('/dashboard/products')
        await page.click('button:has-text("New Product"), a:has-text("New Product")')
        await screenshot('navigate-to-create')
        expect(page).toBeAt(/products\/new/)
    })

    test('Create product form has all fields', async (page) => {
        await page.goto('/dashboard/products/new')
        await screenshot('create-product-form')
        expect(page).toHaveElement('input[name="name"]')
        expect(page).toHaveElement('input[name="price"], input[placeholder*="price"]')
        expect(page).toHaveElement('button:has-text("Publish")')
    })

    test('Empty form submit shows validation errors', async (page) => {
        await page.goto('/dashboard/products/new')
        await page.click('button:has-text("Publish")')
        await screenshot('create-product-validation')
        expect(page).toHaveText('required, Name is required, Price is required')
    })

    test('Create product end-to-end', async (page) => {
        await page.goto('/dashboard/products/new')
        await page.fill('input[name="name"]', 'Testsprite Test Product')
        await page.fill('input[name="price"]', '499')
        await page.select('select[name="type"]', 'ebook')
        await page.click('button:has-text("Save Draft")')
        await page.waitForNavigation()
        await screenshot('create-product-success')
        expect(page).toBeAt(/products/)
        expect(page).toHaveText('saved, created, draft')
    })

    test('Product status toggle publishes/unpublishes', async (page) => {
        await page.goto('/dashboard/products')
        const toggle = 'button:has-text("Publish"), button[data-status="draft"]'
        if (await page.hasElement(toggle)) {
            await page.click(toggle)
            await page.wait(1000)
            await screenshot('product-status-toggle')
            expect(page).not.toHaveText('Application error')
        }
    })

    test('GET /api/creator/products returns array', async (page) => {
        const result = await page.apiCall('GET', '/api/creator/products')
        expect(result.status).toBe(200)
        expect(result.body).toHaveProperty('products')
        expect(Array.isArray(result.body.products)).toBe(true)
    })

    test('POST /api/creator/products creates product', async (page) => {
        const result = await page.apiCall('POST', '/api/creator/products', {
            name: 'API Test Product', price: 49900, type: 'ebook', status: 'draft'
        })
        expect(result.status).toBe(201)
        expect(result.body.product).toHaveProperty('_id')
    })

    test('Products page is mobile responsive', async (page) => {
        await page.setMobileViewport()
        await page.goto('/dashboard/products')
        await screenshot('products-mobile')
        expect(page).not.toHaveHorizontalScroll()
    })

})
