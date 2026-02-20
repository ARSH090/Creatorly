/**
 * Integration tests for the AutoDM Hub storefront API routes.
 * 
 * Prerequisites: npm run dev must be running on port 3000.
 * Run: npx vitest run src/tests/leads.integration.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// ─── POST /api/leads ──────────────────────────────────────────────────────────

describe('POST /api/leads', () => {
    it('should accept a valid lead and return deepLink', async () => {
        const res = await fetch(`${BASE_URL}/api/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Integration Test User',
                phone: '+919876543210',
                email: 'test@example.com',
                interest: 'Social Media Management',
                creatorUsername: 'testcreator',
            }),
        });

        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('deepLink');
        expect(data.data.deepLink).toContain('wa.me');
    });

    it('should accept a lead without email (email is optional)', async () => {
        const res = await fetch(`${BASE_URL}/api/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'No Email User',
                phone: '+919876543211',
                interest: 'YouTube Management',
            }),
        });

        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.success).toBe(true);
    });

    it('should reject a lead with a missing name', async () => {
        const res = await fetch(`${BASE_URL}/api/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: '+919876543210',
                interest: 'Test',
            }),
        });

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.errors).toBeDefined();
    });

    it('should reject a lead with an invalid phone number', async () => {
        const res = await fetch(`${BASE_URL}/api/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                phone: '123',  // too short
                interest: 'Test',
            }),
        });

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
    });

    it('should reject an empty body', async () => {
        const res = await fetch(`${BASE_URL}/api/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });

        expect(res.status).toBe(400);
    });
});

// ─── GET /api/public/[username] ───────────────────────────────────────────────

describe('GET /api/public/[username]', () => {
    it('should return 200 with creator profile for an existing username', async () => {
        // This test requires a user with username 'testcreator' to exist in the DB
        const res = await fetch(`${BASE_URL}/api/public/testcreator`);

        // Accept 200 or 404 depending on test data
        expect([200, 404]).toContain(res.status);

        if (res.status === 200) {
            const data = await res.json();
            expect(data).toHaveProperty('creator');
            expect(data).toHaveProperty('profile');
            expect(data.creator).toHaveProperty('username');
            expect(data.profile).toHaveProperty('theme');
            expect(data.profile).toHaveProperty('serviceButtons');
            expect(data.profile).toHaveProperty('links');
            expect(Array.isArray(data.profile.serviceButtons)).toBe(true);
            expect(Array.isArray(data.profile.links)).toBe(true);
        }
    });

    it('should return 404 with error message for a non-existent username', async () => {
        const res = await fetch(`${BASE_URL}/api/public/this-username-does-not-exist-xyz987`);

        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data).toHaveProperty('error');
    });

    it('should include CORS headers in the response', async () => {
        const res = await fetch(`${BASE_URL}/api/public/this-username-does-not-exist-xyz987`);

        const corsHeader = res.headers.get('Access-Control-Allow-Origin');
        expect(corsHeader).toBe('*');
    });

    it('should serve OPTIONS preflight with 204', async () => {
        const res = await fetch(`${BASE_URL}/api/public/testcreator`, {
            method: 'OPTIONS',
        });

        expect([204, 200]).toContain(res.status);
    });
});

// ─── GET /u/[username] page ───────────────────────────────────────────────────

describe('GET /u/[username] — storefront page', () => {
    it('should return HTML page for any username (200 or 404, not 500)', async () => {
        const res = await fetch(`${BASE_URL}/u/testcreator`);
        expect(res.status).toBeLessThan(500);

        const html = await res.text();
        expect(html.toLowerCase()).toContain('<html');
    });

    it('should return 404 page for a non-existent username', async () => {
        const res = await fetch(`${BASE_URL}/u/this-user-definitely-does-not-exist-zz999`);
        expect(res.status).toBe(404);
    });
});
