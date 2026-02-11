/**
 * Simple API Testing Script
 * Tests authentication and key endpoints
 */

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(name, endpoint, options = {}) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: options.body ? JSON.stringify(options.body) : undefined
        });

        const status = response.status;
        let data;
        try {
            data = await response.json();
        } catch {
            data = await response.text();
        }

        console.log(`✅ ${name}: ${status} - ${typeof data === 'object' ? JSON.stringify(data).substring(0, 100) : data.substring(0, 100)}`);
        return { name, status, data, success: true };
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        return { name, error: error.message, success: false };
    }
}

async function runTests() {
    console.log('\n🚀 CREATORLY API TESTING\n');
    console.log('='.repeat(70));

    const results = [];

    // Test 1: Homepage
    console.log('\n📋 PHASE 1: PUBLIC PAGES');
    console.log('-'.repeat(70));
    results.push(await testEndpoint('Homepage', '/'));
    results.push(await testEndpoint('Login Page', '/auth/login'));
    results.push(await testEndpoint('Signup Page', '/auth/signup'));

    // Test 2: Public API
    console.log('\n📋 PHASE 2: PUBLIC API ENDPOINTS');
    console.log('-'.repeat(70));
    results.push(await testEndpoint('Health Check', '/api/health'));
    results.push(await testEndpoint('Products List', '/api/products'));
    results.push(await testEndpoint('Search', '/api/search?q=test'));

    // Test 3: Auth Endpoints
    console.log('\n🔐 PHASE 3: AUTHENTICATION ENDPOINTS');
    console.log('-'.repeat(70));

    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    const testUsername = `testuser${timestamp}`;

    results.push(await testEndpoint('Signup', '/api/auth/signup', {
        method: 'POST',
        body: {
            email: testEmail,
            password: 'SecurePass123!',
            displayName: 'Test User',
            username: testUsername
        }
    }));

    results.push(await testEndpoint('Login', '/api/auth/signin', {
        method: 'POST',
        body: {
            email: testEmail,
            password: 'SecurePass123!'
        }
    }));

    // Test 4: Protected Routes (should return 401)
    console.log('\n👑 PHASE 4: PROTECTED ENDPOINTS (Should return 401)');
    console.log('-'.repeat(70));
    results.push(await testEndpoint('Admin Metrics', '/api/admin/metrics'));
    results.push(await testEndpoint('Admin Users', '/api/admin/users'));
    results.push(await testEndpoint('Dashboard', '/dashboard'));

    // Summary
    console.log('\n\n📊 TEST SUMMARY');
    console.log('='.repeat(70));

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\nTotal Tests: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed === 0) {
        console.log('\n✨ ALL TESTS PASSED ✨\n');
    } else {
        console.log(`\n⚠️  ${failed} TESTS FAILED\n`);
    }

    return results;
}

// Run tests
runTests().catch(console.error);
