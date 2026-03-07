import { suite, test, expect, screenshot } from 'testsprite'

suite('Payments & Orders', () => {

    test('POST /api/payments/create-order requires productId', async (page) => {
        const result = await page.apiCall('POST', '/api/payments/create-order', {
            buyerEmail: 'test@test.com', buyerName: 'Test Buyer'
            // productId intentionally missing
        })
        expect(result.status).toBe(400)
    })

    test('POST /api/payments/create-order with invalid productId returns 404', async (page) => {
        const result = await page.apiCall('POST', '/api/payments/create-order', {
            productId: '000000000000000000000000',
            buyerEmail: 'test@test.com', buyerName: 'Test Buyer'
        })
        expect([404, 400]).toContain(result.status)
    })

    test('Razorpay webhook with invalid signature returns 400', async (page) => {
        const result = await page.apiCall('POST', '/api/webhooks/razorpay',
            { event: 'payment.captured' },
            { auth: false, headers: { 'x-razorpay-signature': 'invalid_signature_xyz' } }
        )
        expect(result.status).toBe(400)
    })

    test('Download route with invalid token returns 404', async (page) => {
        const res = await page.goto('/download/invalid_token_that_does_not_exist', { auth: false })
        await screenshot('download-invalid-token')
        expect(res.status).toBe(404)
    })

    test('Orders page loads without error', async (page) => {
        await page.goto('/dashboard/orders')
        await screenshot('orders-page')
        expect(page).not.toHaveText('Application error')
    })

    test('GET /api/creator/orders returns array', async (page) => {
        const result = await page.apiCall('GET', '/api/creator/orders')
        expect(result.status).toBe(200)
        expect(result.body).toHaveProperty('orders')
    })

})
