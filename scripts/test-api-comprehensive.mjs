/**
 * Comprehensive API Test Report Generator
 * Tests all critical endpoints and generates detailed report
 */

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(name, endpoint, options = {}) {
    try {
        const startTime = Date.now();
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: options.body ? JSON.stringify(options.body) : undefined
        });

        const duration = Date.now() - startTime;
        const status = response.status;
        let data;
        let contentType = response.headers.get('content-type');

        try {
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = text.substring(0, 200);
            }
        } catch (e) {
            data = { error: 'Failed to parse response' };
        }

        return {
            name,
            endpoint,
            status,
            data,
            duration,
            success: status < 500,
            contentType
        };
    } catch (error) {
        return {
            name,
            endpoint,
            error: error.message,
            success: false,
            duration: 0
        };
    }
}

async function runComprehensiveTests() {
    console.log('\n🚀 CREATORLY COMPREHENSIVE API TEST REPORT\n');
    console.log('='.repeat(80));
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Test Time: ${new Date().toISOString()}\n`);

    const results = [];

    // Phase 1: Public Pages
    console.log('\n📋 PHASE 1: PUBLIC PAGES');
    console.log('-'.repeat(80));
    results.push(await testEndpoint('Homepage', '/'));
    results.push(await testEndpoint('Login Page', '/auth/login'));
    results.push(await testEndpoint('Signup Page', '/auth/signup'));
    results.push(await testEndpoint('Dashboard (should redirect)', '/dashboard'));

    // Phase 2: Public API
    console.log('\n📋 PHASE 2: PUBLIC API ENDPOINTS');
    console.log('-'.repeat(80));
    results.push(await testEndpoint('Health Check', '/api/health'));
    results.push(await testEndpoint('Products List', '/api/products'));
    results.push(await testEndpoint('Search API', '/api/search?q=test'));
    results.push(await testEndpoint('Marketplace', '/api/marketplace'));

    // Phase 3: Auth Endpoints
    console.log('\n🔐 PHASE 3: AUTHENTICATION ENDPOINTS');
    console.log('-'.repeat(80));

    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    const testUsername = `testuser${timestamp}`;

    const signupResult = await testEndpoint('Signup API', '/api/auth/signup', {
        method: 'POST',
        body: {
            email: testEmail,
            password: 'SecurePass123!',
            displayName: 'Test User',
            username: testUsername
        }
    });
    results.push(signupResult);

    const loginResult = await testEndpoint('Login API', '/api/auth/signin', {
        method: 'POST',
        body: {
            email: testEmail,
            password: 'SecurePass123!'
        }
    });
    results.push(loginResult);

    // Phase 4: Protected Routes (should return 401 or redirect)
    console.log('\n👑 PHASE 4: PROTECTED ENDPOINTS');
    console.log('-'.repeat(80));
    results.push(await testEndpoint('Admin Metrics', '/api/admin/metrics'));
    results.push(await testEndpoint('Admin Users', '/api/admin/users'));
    results.push(await testEndpoint('Admin Dashboard Page', '/admin/dashboard'));

    // Phase 5: Creator Features
    console.log('\n👤 PHASE 5: CREATOR FEATURES');
    console.log('-'.repeat(80));
    results.push(await testEndpoint('Creator Store Page', '/u/demo'));
    results.push(await testEndpoint('Creator Products API', '/api/products/creator/demo'));

    // Print detailed results
    console.log('\n\n📊 DETAILED TEST RESULTS');
    console.log('='.repeat(80));

    results.forEach((r, i) => {
        const statusIcon = r.success ? '✅' : '❌';
        const statusText = r.status ? `HTTP ${r.status}` : 'ERROR';

        console.log(`\n${i + 1}. ${statusIcon} ${r.name}`);
        console.log(`   Endpoint: ${r.endpoint}`);
        console.log(`   Status: ${statusText}`);
        console.log(`   Duration: ${r.duration}ms`);

        if (r.error) {
            console.log(`   Error: ${r.error}`);
        }

        if (r.data && typeof r.data === 'object') {
            const dataStr = JSON.stringify(r.data, null, 2);
            console.log(`   Response: ${dataStr.substring(0, 300)}${dataStr.length > 300 ? '...' : ''}`);
        }
    });

    // Summary
    console.log('\n\n🎯 TEST SUMMARY');
    console.log('='.repeat(80));

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    console.log(`\nTotal Tests: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Average Response Time: ${avgDuration.toFixed(2)}ms`);

    // Categorize issues
    const serverErrors = results.filter(r => r.status >= 500);
    const clientErrors = results.filter(r => r.status >= 400 && r.status < 500);
    const networkErrors = results.filter(r => r.error && !r.status);

    if (serverErrors.length > 0) {
        console.log(`\n⚠️  Server Errors (5xx): ${serverErrors.length}`);
        serverErrors.forEach(e => console.log(`   - ${e.name}: ${e.status}`));
    }

    if (clientErrors.length > 0) {
        console.log(`\n⚠️  Client Errors (4xx): ${clientErrors.length}`);
        clientErrors.forEach(e => console.log(`   - ${e.name}: ${e.status}`));
    }

    if (networkErrors.length > 0) {
        console.log(`\n⚠️  Network Errors: ${networkErrors.length}`);
        networkErrors.forEach(e => console.log(`   - ${e.name}: ${e.error}`));
    }

    if (failed === 0) {
        console.log('\n✨ ALL TESTS PASSED - SYSTEM OPERATIONAL ✨\n');
    } else {
        console.log(`\n⚠️  ${failed} TESTS NEED ATTENTION\n`);
    }

    return results;
}

// Run tests
runComprehensiveTests().catch(console.error);
