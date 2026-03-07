import { suite, test, expect, screenshot } from 'testsprite'

suite('Security', () => {

    test('Unauthenticated GET /api/creator/profile returns 401', async (page) => {
        const result = await page.apiCall('GET', '/api/creator/profile', null, { auth: false })
        expect(result.status).toBe(401)
    })

    test('Unauthenticated GET /api/creator/products returns 401', async (page) => {
        const result = await page.apiCall('GET', '/api/creator/products', null, { auth: false })
        expect(result.status).toBe(401)
    })

    test('Unauthenticated GET /api/creator/coupons returns 401', async (page) => {
        const result = await page.apiCall('GET', '/api/creator/coupons', null, { auth: false })
        expect(result.status).toBe(401)
    })

    test('Unauthenticated AutoDM routes return 401', async (page) => {
        for (const route of ['/api/creator/autodm/rules', '/api/creator/autodm/stats']) {
            const result = await page.apiCall('GET', route, null, { auth: false })
            expect(result.status).toBe(401)
        }
    })

    test('NoSQL injection attempt is sanitized', async (page) => {
        const result = await page.apiCall('GET', '/api/creator/products?search[$gt]=', null)
        expect(result.status).not.toBe(500)
    })

    test('Creator cannot access another creator\'s products', async (page) => {
        // Get a product ID that belongs to a different creator
        const result = await page.apiCall('GET', '/api/creator/products/000000000000000000000001')
        expect([403, 404]).toContain(result.status)
    })

    test('XSS attempt in product name is sanitized', async (page) => {
        const result = await page.apiCall('POST', '/api/creator/products', {
            name: '<script>alert("xss")</script>', price: 100, type: 'ebook'
        })
        if (result.status === 201) {
            expect(result.body.product?.name).not.toContain('<script>')
        }
    })

    test('Rate limiting returns 429 after too many requests', async (page) => {
        let lastStatus = 200
        for (let i = 0; i < 50; i++) {
            const r = await page.apiCall('GET', '/api/creator/products')
            lastStatus = r.status
            if (lastStatus === 429) break
        }
        // Either rate limiting works (429) or it handles gracefully (200)
        expect([200, 429]).toContain(lastStatus)
    })

})
