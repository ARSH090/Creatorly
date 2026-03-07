import { test, expect } from '@playwright/test';

const API_ROUTES = [
    { method: 'GET', url: '/api/creator/profile', name: 'Get Profile' },
    { method: 'GET', url: '/api/creator/products', name: 'Get Products' },
    { method: 'GET', url: '/api/creator/coupons', name: 'Get Coupons' },
    { method: 'GET', url: '/api/creator/autodm/rules', name: 'Get AutoDM Rules' },
    { method: 'GET', url: '/api/creator/autodm/stats', name: 'Get AutoDM Stats' },
    { method: 'GET', url: '/api/creator/autodm/pending', name: 'Get Pending Followers' },
    { method: 'GET', url: '/api/creator/autodm/logs', name: 'Get AutoDM Logs' },
    { method: 'GET', url: '/api/creator/email/campaigns', name: 'Get Email Campaigns' },
    { method: 'GET', url: '/api/creator/email/subscribers/count', name: 'Get Subscriber Count' },
    { method: 'GET', url: '/api/instagram/status', name: 'Instagram Status' },
];

for (const route of API_ROUTES) {
    test(`[API] ${route.name} → ${route.method} ${route.url}`, async ({ page }) => {
        const result = await page.evaluate(async ({ method, url }: { method: string; url: string }) => {
            const r = await fetch(url, { method });
            let body = null;
            try { body = await r.json(); } catch { }
            return { status: r.status, ok: r.ok, body };
        }, { method: route.method, url: route.url });

        // Must NOT be 404 (route doesn't exist):
        expect(result.status).not.toBe(404);
        // Must NOT be 500 (server crash):
        expect(result.status).not.toBe(500);
        // Must return JSON:
        expect(result.body).not.toBeNull();

        console.log(`  ${route.name}: HTTP ${result.status} ✓`);
    });
}
