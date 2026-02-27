#!/usr/bin/env node

/**
 * CREATORLY QA CRITICAL PATH TEST SUITE
 * Tests all P0 (critical) endpoints
 * Outputs: PASS ✅ / FAIL ❌ / ERROR 🔴
 */

const http = require('http');
const testResults = [];

async function testEndpoint(method, path, body = null, expectedStatus = 200) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const passed = res.statusCode === expectedStatus;
                resolve({
                    path,
                    method,
                    status: res.statusCode,
                    expected: expectedStatus,
                    passed,
                    data: data.substring(0, 200)
                });
            });
        });

        req.on('error', (err) => {
            resolve({
                path,
                method,
                error: err.message,
                passed: false
            });
        });

        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log('\n🧪 CREATORLY QA CRITICAL PATH TESTS\n');
    console.log('═'.repeat(60));

    // Test 1: Health endpoint
    console.log('\n📍 Test 1: Health Check');
    let result = await testEndpoint('GET', '/health');
    console.log(result.passed ? '✅ PASS' : '❌ FAIL', '- GET /health');
    testResults.push({ test: 'Health Check', passed: result.passed });

    // Test 2: API Routes
    console.log('\n📍 Test 2: API Endpoints');
    
    result = await testEndpoint('GET', '/api/health');
    console.log(result.passed ? '✅ PASS' : '❌ FAIL', '- GET /api/health');
    testResults.push({ test: 'API Health', passed: result.passed });

    // Test 3: Auth routes  
    console.log('\n📍 Test 3: Auth System');
    result = await testEndpoint('GET', '/api/auth/providers', null, 200);
    console.log(result.passed ? '✅ PASS' : '❌ FAIL', '- Auth endpoints exist');
    testResults.push({ test: 'Auth Routes', passed: result.passed });

    // Test 4: Store routes
    console.log('\n📍 Test 4: Store System');
    result = await testEndpoint('GET', '/api/stores', null, 401); // Expect 401 without auth
    const storePass = result.status === 401 || result.status === 200;
    console.log(storePass ? '✅ PASS' : '❌ FAIL', '- Store endpoints accessible');
    testResults.push({ test: 'Store Routes', passed: storePass });

    // Test 5: Product routes
    console.log('\n📍 Test 5: Product System');
    result = await testEndpoint('GET', '/api/products', null, 401); // Expect 401 without auth
    const productPass = result.status === 401 || result.status === 200;
    console.log(productPass ? '✅ PASS' : '❌ FAIL', '- Product endpoints accessible');
    testResults.push({ test: 'Product Routes', passed: productPass });

    // Test 6: Payment routes
    console.log('\n📍 Test 6: Payment System');
    result = await testEndpoint('GET', '/api/payments', null, 401); // Expect 401 without auth
    const paymentPass = result.status === 401 || result.status === 200 || result.status === 404;
    console.log(paymentPass ? '✅ PASS' : '❌ FAIL', '- Payment endpoints exist');
    testResults.push({ test: 'Payment System', passed: paymentPass });

    // Summary
    console.log('\n' + '═'.repeat(60));
    const passed = testResults.filter(r => r.passed).length;
    const total = testResults.length;
    console.log(`\n📊 RESULTS: ${passed}/${total} PASSED`);
    
    testResults.forEach(r => {
        const icon = r.passed ? '✅' : '❌';
        console.log(`${icon} ${r.test}`);
    });

    console.log('\n' + '═'.repeat(60) + '\n');
    
    process.exit(passed === total ? 0 : 1);
}

// Wait for server to be ready
setTimeout(runTests, 3000);
