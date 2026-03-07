import { suite, test, expect } from 'testsprite'

suite('API Health Matrix', () => {

    const AUTHENTICATED_ROUTES = [
        { method: 'GET', url: '/api/creator/profile', name: 'Get Profile' },
        { method: 'GET', url: '/api/creator/products', name: 'Get Products' },
        { method: 'GET', url: '/api/creator/coupons', name: 'Get Coupons' },
        { method: 'GET', url: '/api/creator/storefront/layout', name: 'Storefront Layout' },
        { method: 'GET', url: '/api/creator/autodm/rules', name: 'AutoDM Rules' },
        { method: 'GET', url: '/api/creator/autodm/stats', name: 'AutoDM Stats' },
        { method: 'GET', url: '/api/creator/autodm/pending', name: 'AutoDM Pending' },
        { method: 'GET', url: '/api/creator/autodm/logs', name: 'AutoDM Logs' },
        { method: 'GET', url: '/api/creator/email/campaigns', name: 'Email Campaigns' },
        { method: 'GET', url: '/api/creator/email/subscribers/count', name: 'Subscriber Count' },
        { method: 'GET', url: '/api/creator/orders', name: 'Orders List' },
        { method: 'GET', url: '/api/instagram/status', name: 'Instagram Status' },
    ]

    const PUBLIC_ROUTES = [
        { method: 'GET', url: '/', name: 'Homepage' },
        { method: 'GET', url: '/sign-in', name: 'Sign In Page' },
        { method: 'GET', url: '/sign-up', name: 'Sign Up Page' },
    ]

    const UNAUTH_SHOULD_401 = [
        '/api/creator/profile',
        '/api/creator/products',
        '/api/creator/coupons',
        '/api/creator/autodm/rules',
        '/api/creator/email/campaigns',
    ]

    for (const route of AUTHENTICATED_ROUTES) {
        test(`✅ AUTH: ${route.name} — ${route.method} ${route.url}`, async (page) => {
            const result = await page.apiCall(route.method, route.url)
            expect(result.status).not.toBe(404)
            expect(result.status).not.toBe(500)
            expect(result.body).not.toBeNull()
        })
    }

    for (const route of PUBLIC_ROUTES) {
        test(`🌍 PUBLIC: ${route.name} — ${route.method} ${route.url}`, async (page) => {
            const result = await page.goto(route.url, { auth: false })
            expect(result.status).not.toBe(500)
        })
    }

    for (const url of UNAUTH_SHOULD_401) {
        test(`🔒 NO-AUTH: ${url} should return 401`, async (page) => {
            const result = await page.apiCall('GET', url, null, { auth: false })
            expect(result.status).toBe(401)
        })
    }

})
