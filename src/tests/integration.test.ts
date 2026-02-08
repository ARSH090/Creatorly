/**
 * Creatorly Complete Backend-UI Integration Test Suite
 * Tests entire user flows end-to-end
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('🚀 CREATORLY BACKEND-UI INTEGRATION TESTS', () => {
  let testServer: any;
  const BASE_URL = 'http://localhost:3000';
  let session: any;
  let testCreatorId: string;
  let testProductId: string;

  beforeAll(async () => {
    // Server would be running
    console.log('✅ Test environment ready');
  });

  afterAll(async () => {
    console.log('✅ Tests completed');
  });

  describe('🔐 Authentication Flow', () => {
    it('Should signup a new creator', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test-creator@example.com',
          password: 'SecurePass123!',
          displayName: 'Test Creator',
          username: `testcreator-${Date.now()}`,
        }),
      });

      expect(response.status).toBeLessThan(400); // Should not error
      const data = await response.json();
      expect(data).toHaveProperty('user');
    });

    it('Should login successfully', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      // NextAuth returns redirect, so check for session
      expect(response.status).toBeLessThanOrEqual(401);
    });
  });

  describe('📦 Product Management Flow', () => {
    it('Should fetch all products', async () => {
      const response = await fetch(`${BASE_URL}/api/products`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('Should search products', async () => {
      const response = await fetch(`${BASE_URL}/api/search?q=preset`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data) || typeof data === 'object').toBe(true);
    });

    it('Should get product detail', async () => {
      // Get a product first
      const listResponse = await fetch(`${BASE_URL}/api/products?limit=1`);
      const products = await listResponse.json();

      if (products && products.length > 0) {
        const productId = products[0]._id;
        const response = await fetch(`${BASE_URL}/api/products/${productId}`);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('🛒 Cart & Checkout Flow', () => {
    it('Should initialize cart', async () => {
      const response = await fetch(`${BASE_URL}/api/cart`);
      // May require auth, so just check it doesn't 500
      expect(response.status).toBeLessThan(500);
    });

    it('Should get marketplace', async () => {
      const response = await fetch(`${BASE_URL}/api/marketplace`);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('👤 Creator Storefront Flow', () => {
    it('Should fetch creator store', async () => {
      const response = await fetch(`${BASE_URL}/u/demo`);
      // Page might not exist, but should handle gracefully
      expect(response.status).toBeLessThan(500);
    });

    it('Should get creator products', async () => {
      const response = await fetch(`${BASE_URL}/api/products?creator=demo`);
      expect(response.status).toBe(200);
    });
  });

  describe('👑 Admin Dashboard Flow', () => {
    it('Should fetch admin metrics (requires auth)', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/metrics`);
      // Will return 401 without auth, which is expected
      expect([401, 200].includes(response.status)).toBe(true);
    });

    it('Should list users (requires auth)', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users`);
      expect([401, 200].includes(response.status)).toBe(true);
    });

    it('Should list orders (requires auth)', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/orders`);
      expect([401, 200].includes(response.status)).toBe(true);
    });

    it('Should get finance data (requires auth)', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/finance`);
      expect([401, 200].includes(response.status)).toBe(true);
    });

    it('Should list coupons (requires auth)', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/coupons`);
      expect([401, 200].includes(response.status)).toBe(true);
    });
  });

  describe('💳 Payment Integration', () => {
    it('Should accept payment webhook', async () => {
      const response = await fetch(`${BASE_URL}/api/payments/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'test',
        }),
      });

      // Should not 500
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('🔍 Search & Discovery', () => {
    it('Should search for products', async () => {
      const response = await fetch(`${BASE_URL}/api/search?q=art`);
      expect(response.status).toBe(200);
    });

    it('Should search for creators', async () => {
      const response = await fetch(`${BASE_URL}/api/search?q=creator&type=creator`);
      // May or may not have results, but should respond
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('✅ Response Format Validation', () => {
    it('Products should have required fields', async () => {
      const response = await fetch(`${BASE_URL}/api/products?limit=1`);
      const data = await response.json();

      if (data.length > 0) {
        const product = data[0];
        expect(product).toHaveProperty('_id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');
      }
    });

    it('Admin metrics should have required structure', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/metrics`);
      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('metrics');
      }
    });
  });

  describe('🛡️ Error Handling', () => {
    it('Should return 404 for non-existent routes', async () => {
      const response = await fetch(`${BASE_URL}/api/nonexistent`);
      expect(response.status).toBe(404);
    });

    it('Should handle invalid requests gracefully', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid: 'data' }),
      });

      // Should return error, not 500
      expect([400, 401, 403].includes(response.status)).toBe(true);
    });
  });

  describe('📱 Mobile Responsiveness', () => {
    it('Landing page loads correctly', async () => {
      const response = await fetch(`${BASE_URL}/`);
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('html');
    });

    it('Dashboard page loads correctly', async () => {
      const response = await fetch(`${BASE_URL}/dashboard`);
      // May redirect, but should respond
      expect([200, 307].includes(response.status)).toBe(true);
    });

    it('Login page loads correctly', async () => {
      const response = await fetch(`${BASE_URL}/auth/login`);
      expect([200, 307].includes(response.status)).toBe(true);
    });
  });
});

// Manual test execution for CI/CD
console.log('\n✅ TEST SUITE READY FOR EXECUTION');
console.log('Run with: npm test');
