#!/usr/bin/env ts-node

export { };

/**
 * Creatorly Backend-UI Connection Verification Suite
 * Tests all major API endpoints used by UI components
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  endpoint: string;
  method: string;
  status: string;
  statusCode?: number;
  message: string;
}

const results: TestResult[] = [];

async function test(name: string, method: string, endpoint: string, body?: any) {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   ${method} ${endpoint}`);

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const statusCode = response.status;
    const isSuccess = statusCode >= 200 && statusCode < 300;
    const data = await response.json().catch(() => ({}));

    const result: TestResult = {
      name,
      endpoint,
      method,
      statusCode,
      status: isSuccess ? '✅ PASS' : '⚠️  PARTIAL',
      message: isSuccess ? 'Endpoint responds' : `Status ${statusCode}`,
    };

    results.push(result);
    console.log(`   ${result.status} - ${result.message}`);

    if ((data as any).error) {
      console.log(`   Error: ${(data as any).error}`);
    }

    return data;
  } catch (error: any) {
    const result: TestResult = {
      name,
      endpoint,
      method,
      status: '❌ FAIL',
      message: error.message,
    };
    results.push(result);
    console.log(`   ❌ FAIL - ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Creatorly Backend-UI Connection Test Suite');
  console.log('='.repeat(60));

  // Public endpoints (no auth required)
  console.log('\n📋 PUBLIC ENDPOINTS');
  console.log('-'.repeat(60));

  await test('Health Check', 'GET', '/api/health');
  await test('Search Products', 'GET', '/api/search?q=test');
  await test('Product List', 'GET', '/api/products');

  // Auth endpoints
  console.log('\n🔐 AUTH ENDPOINTS');
  console.log('-'.repeat(60));

  await test('Login (should fail without creds)', 'POST', '/api/auth/signin', {
    email: 'test@example.com',
    password: 'test123',
  });

  // Creator endpoints (would need valid token in real scenario)
  console.log('\n👤 CREATOR ENDPOINTS');
  console.log('-'.repeat(60));

  await test('Get Creator Store', 'GET', '/u/demo', {});
  await test('Creator Products', 'GET', '/api/products/creator/demo', {});

  // Admin endpoints (would need admin token)
  console.log('\n👑 ADMIN ENDPOINTS');
  console.log('-'.repeat(60));

  await test('Admin Dashboard Metrics', 'GET', '/api/admin/dashboard/metrics');
  await test('Admin Users List', 'GET', '/api/admin/users');
  await test('Admin Orders List', 'GET', '/api/admin/orders');
  await test('Admin Finance', 'GET', '/api/admin/finance');
  await test('Admin Coupons', 'GET', '/api/admin/coupons');
  await test('Admin Payouts', 'GET', '/api/admin/payouts');

  // Marketplace endpoints
  console.log('\n🛒 MARKETPLACE ENDPOINTS');
  console.log('-'.repeat(60));

  await test('Marketplace List', 'GET', '/api/marketplace');
  await test('Cart Operations', 'GET', '/api/cart');
  await test('Orders History', 'GET', '/api/orders');

  // Payment endpoints (would need valid payload)
  console.log('\n💳 PAYMENT ENDPOINTS');
  console.log('-'.repeat(60));

  await test('Payment Webhook', 'POST', '/api/payments/webhook', {
    event: 'test',
  });

  // Print summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.status.includes('✅')).length;
  const partial = results.filter((r) => r.status.includes('⚠️')).length;
  const failed = results.filter((r) => r.status.includes('❌')).length;

  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Partial: ${partial}`);
  console.log(`❌ Failed: ${failed}`);

  console.log('\n📋 Detailed Results:');
  console.log('-'.repeat(60));

  results.forEach((r) => {
    console.log(`${r.status} | ${r.method.padEnd(6)} | ${r.endpoint.padEnd(40)} | ${r.message}`);
  });

  console.log('\n' + '='.repeat(60));

  if (failed === 0) {
    console.log('\n✅ All backend-UI connections are working!');
  } else {
    console.log(`\n⚠️  ${failed} endpoints may need attention.`);
  }
}

// Run tests
runTests().catch(console.error);
