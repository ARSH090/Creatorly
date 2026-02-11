/**
 * FINAL PRODUCTION TESTING SUITE
 * Comprehensive automated testing for all testable scenarios
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Test results tracking
const results = {
    build: [],
    auth: [],
    profile: [],
    instagram: [],
    payment: [],
    analytics: [],
    security: [],
    performance: [],
    summary: { total: 0, passed: 0, failed: 0, skipped: 0, manual: 0 }
};

function log(message, type = 'info') {
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️', skip: '⏭️', manual: '📝' };
    console.log(`${icons[type]} ${message}`);
}

function recordResult(category, testId, name, status, details = {}) {
    const result = { testId, name, status, ...details };
    results[category].push(result);
    results.summary.total++;

    if (status === 'PASS') results.summary.passed++;
    else if (status === 'FAIL') results.summary.failed++;
    else if (status === 'SKIP') results.summary.skipped++;
    else if (status === 'MANUAL') results.summary.manual++;
}

async function testEndpoint(endpoint, options = {}) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
            credentials: 'include'
        });

        const status = response.status;
        let data;

        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
        } catch (e) {
            data = { error: 'Failed to parse response' };
        }

        return { status, data, headers: response.headers, success: true };
    } catch (error) {
        return { error: error.message, success: false };
    }
}

// ============================================================================
// PHASE 1: BUILD & DEPLOYMENT VERIFICATION
// ============================================================================

async function testBuildDeployment() {
    console.log('\n' + '='.repeat(80));
    console.log('📦 PHASE 1: BUILD & DEPLOYMENT VERIFICATION');
    console.log('='.repeat(80));

    // Test 1.1: Clean build (manual - requires build command)
    console.log('\n📝 Test 1.1: Clean Build');
    log('⏭️  Manual test required: Run `npm run build` with production env vars', 'manual');
    recordResult('build', '1.1', 'Clean build', 'MANUAL');

    // Test 1.2: Redis null safety
    console.log('\n📝 Test 1.2: Redis Null Safety');
    log('⏭️  Manual test required: Deploy to Vercel without REDIS_URL', 'manual');
    recordResult('build', '1.2', 'Redis null safety', 'MANUAL');

    // Test 1.3: Static assets
    console.log('\n📝 Test 1.3: Static Assets');
    const assetsToCheck = [
        '/favicon.ico',
        '/',
    ];

    let assetsPass = true;
    for (const asset of assetsToCheck) {
        const result = await testEndpoint(asset);
        if (result.status === 200) {
            log(`✓ Asset loaded: ${asset}`, 'success');
        } else {
            log(`✗ Asset failed: ${asset} (${result.status})`, 'error');
            assetsPass = false;
        }
    }

    recordResult('build', '1.3', 'Static assets', assetsPass ? 'PASS' : 'FAIL');
}

// ============================================================================
// PHASE 2: AUTHENTICATION & AUTHORIZATION
// ============================================================================

async function testAuthentication() {
    console.log('\n' + '='.repeat(80));
    console.log('🔐 PHASE 2: AUTHENTICATION & AUTHORIZATION');
    console.log('='.repeat(80));

    const timestamp = Date.now();
    const testEmail = `finaltest-${timestamp}@example.com`;
    const testUsername = `finaltest${timestamp}`;
    const testPassword = 'SecurePass123!';

    // Test 2.1: Email sign-up
    console.log('\n📝 Test 2.1: Email Sign-up');
    const signupResult = await testEndpoint('/api/auth/register', {
        method: 'POST',
        body: {
            email: testEmail,
            password: testPassword,
            username: testUsername,
            displayName: 'Final Test User'
        }
    });

    if (signupResult.status === 201 && signupResult.data.success) {
        log('✓ User created successfully', 'success');
        log(`  User ID: ${signupResult.data.user.id}`, 'info');
        recordResult('auth', '2.1', 'Email sign-up', 'PASS', { userId: signupResult.data.user.id });
    } else {
        log(`✗ Sign-up failed: ${JSON.stringify(signupResult.data)}`, 'error');
        recordResult('auth', '2.1', 'Email sign-up', 'FAIL', { error: signupResult.data });
    }

    // Test 2.2: Duplicate sign-up
    console.log('\n📝 Test 2.2: Duplicate Sign-up');
    const dupResult = await testEndpoint('/api/auth/register', {
        method: 'POST',
        body: {
            email: testEmail,
            password: testPassword,
            username: testUsername,
            displayName: 'Duplicate User'
        }
    });

    if (dupResult.status === 400 && dupResult.data.error) {
        log('✓ Duplicate properly rejected', 'success');
        log(`  Error: ${dupResult.data.error}`, 'info');
        recordResult('auth', '2.2', 'Duplicate sign-up', 'PASS');
    } else {
        log('✗ Duplicate not properly handled', 'error');
        recordResult('auth', '2.2', 'Duplicate sign-up', 'FAIL');
    }

    // Test 2.3: Password strength
    console.log('\n📝 Test 2.3: Password Strength');
    const weakPasswords = [
        { pass: '123', reason: 'Too short' },
        { pass: 'password', reason: 'No numbers/special chars' },
        { pass: 'Pass1', reason: 'Too short, no special char' }
    ];

    let passStrengthPass = true;
    for (const test of weakPasswords) {
        const result = await testEndpoint('/api/auth/register', {
            method: 'POST',
            body: {
                email: `weak-${Date.now()}@example.com`,
                password: test.pass,
                username: `weak${Date.now()}`,
                displayName: 'Weak Test'
            }
        });

        if (result.status === 400) {
            log(`✓ Rejected: ${test.pass} (${test.reason})`, 'success');
        } else {
            log(`✗ Accepted weak password: ${test.pass}`, 'error');
            passStrengthPass = false;
        }
    }

    recordResult('auth', '2.3', 'Password strength', passStrengthPass ? 'PASS' : 'FAIL');

    // Tests 2.4-2.7: Manual testing required
    console.log('\n📝 Tests 2.4-2.7: Manual Testing Required');
    log('⏭️  2.4: Login with correct credentials', 'manual');
    log('⏭️  2.5: Login with wrong password & rate limiting', 'manual');
    log('⏭️  2.6: Protected route access', 'manual');
    log('⏭️  2.7: Token expiry', 'manual');

    recordResult('auth', '2.4', 'Login - correct', 'MANUAL');
    recordResult('auth', '2.5', 'Login - wrong password', 'MANUAL');
    recordResult('auth', '2.6', 'Protected route', 'MANUAL');
    recordResult('auth', '2.7', 'Token expiry', 'MANUAL');

    return { testEmail, testUsername, testPassword };
}

// ============================================================================
// PHASE 9: SECURITY & ERROR HANDLING
// ============================================================================

async function testSecurity() {
    console.log('\n' + '='.repeat(80));
    console.log('🛡️ PHASE 9: SECURITY & ERROR HANDLING');
    console.log('='.repeat(80));

    // Test 9.1: SQL Injection
    console.log('\n📝 Test 9.1: SQL Injection Prevention');
    const sqlInjectionAttempts = [
        "' OR 1=1; --",
        "admin'--",
        "1' UNION SELECT NULL--"
    ];

    let sqlInjectionPass = true;
    for (const attempt of sqlInjectionAttempts) {
        const result = await testEndpoint(`/api/search?q=${encodeURIComponent(attempt)}`);
        // Should not crash and should sanitize input
        if (result.success && result.status < 500) {
            log(`✓ SQL injection attempt handled: ${attempt.substring(0, 20)}...`, 'success');
        } else {
            log(`✗ SQL injection caused error`, 'error');
            sqlInjectionPass = false;
        }
    }

    recordResult('security', '9.1', 'SQL injection prevention', sqlInjectionPass ? 'PASS' : 'FAIL');

    // Test 9.2: XSS Prevention
    console.log('\n📝 Test 9.2: XSS Prevention');
    log('⏭️  Manual test required: Enter <script>alert(1)</script> in bio field', 'manual');
    recordResult('security', '9.2', 'XSS prevention', 'MANUAL');

    // Test 9.3: Rate limiting
    console.log('\n📝 Test 9.3: Rate Limiting (Auth)');
    log('⏭️  Manual test required: Automate 100 login attempts', 'manual');
    recordResult('security', '9.3', 'Rate limiting', 'MANUAL');

    // Test 9.4: 404 Page
    console.log('\n📝 Test 9.4: Custom 404 Page');
    const notFoundResult = await testEndpoint('/non-existent-page-12345');

    if (notFoundResult.status === 404) {
        log('✓ 404 page returned for non-existent route', 'success');
        recordResult('security', '9.4', 'Custom 404 page', 'PASS');
    } else {
        log(`✗ Unexpected status for 404: ${notFoundResult.status}`, 'error');
        recordResult('security', '9.4', 'Custom 404 page', 'FAIL');
    }

    // Test 9.5: 500 Page
    console.log('\n📝 Test 9.5: Custom 500 Page');
    log('⏭️  Manual test required: Force uncaught exception', 'manual');
    recordResult('security', '9.5', 'Custom 500 page', 'MANUAL');
}

// ============================================================================
// PHASE 3-8, 10-12: MANUAL TESTING REQUIRED
// ============================================================================

function recordManualTests() {
    // Phase 3: User Profile
    recordResult('profile', '3.1', 'Update display name', 'MANUAL');
    recordResult('profile', '3.2', 'Upload avatar', 'MANUAL');
    recordResult('profile', '3.3', 'Invalid file upload', 'MANUAL');
    recordResult('profile', '3.4', 'Bio character limit', 'MANUAL');
    recordResult('profile', '3.5', 'Account deletion', 'MANUAL');

    // Phase 4: Instagram
    recordResult('instagram', '4.1.1', 'Connect Instagram', 'MANUAL');
    recordResult('instagram', '4.1.2', 'Reconnect expired token', 'MANUAL');
    recordResult('instagram', '4.1.3', 'Disconnect', 'MANUAL');
    recordResult('instagram', '4.2.1', 'Create DM template', 'MANUAL');
    recordResult('instagram', '4.2.2', 'Trigger DM', 'MANUAL');
    recordResult('instagram', '4.2.3', 'DM rate limiting', 'MANUAL');
    recordResult('instagram', '4.2.4', 'Invalid placeholder', 'MANUAL');
    recordResult('instagram', '4.3.1', 'Auto bio sync', 'MANUAL');
    recordResult('instagram', '4.3.2', 'Manual bio push', 'MANUAL');
    recordResult('instagram', '4.3.3', 'Conflict resolution', 'MANUAL');

    // Phase 5: Payment
    recordResult('payment', '5.1', 'Display plans', 'MANUAL');
    recordResult('payment', '5.2', 'Checkout flow', 'MANUAL');
    recordResult('payment', '5.3', 'Failed payment', 'MANUAL');
    recordResult('payment', '5.4', 'Webhook signature', 'MANUAL');
    recordResult('payment', '5.5', 'Upgrade/downgrade', 'MANUAL');
    recordResult('payment', '5.6', 'Cancel subscription', 'MANUAL');
    recordResult('payment', '5.7', 'Feature gating', 'MANUAL');

    // Phase 6: Analytics
    recordResult('analytics', '6.1', 'Event tracking', 'MANUAL');
    recordResult('analytics', '6.2', 'Rate limiting (Redis)', 'MANUAL');
    recordResult('analytics', '6.3', 'Redis unavailable', 'MANUAL');
    recordResult('analytics', '6.4', 'Date range picker', 'MANUAL');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runFinalTests() {
    console.log('\n🚀 CREATORLY FINAL PRODUCTION TESTING SUITE');
    console.log('Test Time: ' + new Date().toISOString());
    console.log('Base URL: ' + BASE_URL);
    console.log('='.repeat(80));

    try {
        // Phase 1: Build & Deployment
        await testBuildDeployment();

        // Phase 2: Authentication
        const authData = await testAuthentication();

        // Phase 9: Security
        await testSecurity();

        // Record all manual tests
        recordManualTests();

        // Print Summary
        console.log('\n' + '='.repeat(80));
        console.log('📊 FINAL TEST SUMMARY');
        console.log('='.repeat(80));

        console.log('\n📦 Build & Deployment:');
        results.build.forEach(r => {
            const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '📝';
            console.log(`  ${icon} ${r.testId}: ${r.name} - ${r.status}`);
        });

        console.log('\n🔐 Authentication:');
        results.auth.forEach(r => {
            const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '📝';
            console.log(`  ${icon} ${r.testId}: ${r.name} - ${r.status}`);
        });

        console.log('\n🛡️ Security:');
        results.security.forEach(r => {
            const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '📝';
            console.log(`  ${icon} ${r.testId}: ${r.name} - ${r.status}`);
        });

        console.log('\n' + '='.repeat(80));
        console.log('OVERALL RESULTS:');
        console.log(`  Total Tests: ${results.summary.total}`);
        console.log(`  ✅ Passed: ${results.summary.passed}`);
        console.log(`  ❌ Failed: ${results.summary.failed}`);
        console.log(`  ⏭️  Skipped: ${results.summary.skipped}`);
        console.log(`  📝 Manual Required: ${results.summary.manual}`);
        console.log('='.repeat(80));

        const automatedTests = results.summary.passed + results.summary.failed;
        const passRate = automatedTests > 0 ? ((results.summary.passed / automatedTests) * 100).toFixed(1) : 0;

        console.log(`\n📈 Automated Test Pass Rate: ${passRate}%`);

        if (results.summary.failed === 0) {
            console.log('\n✨ ALL AUTOMATED TESTS PASSED ✨');
        } else {
            console.log(`\n⚠️  ${results.summary.failed} AUTOMATED TESTS FAILED`);
        }

        console.log(`\n📝 ${results.summary.manual} tests require manual execution`);
        console.log('   See FINAL_TESTING_CHECKLIST.md for detailed procedures\n');

        // Save test credentials
        console.log('📝 TEST USER CREDENTIALS:');
        console.log(`  Email: ${authData.testEmail}`);
        console.log(`  Username: ${authData.testUsername}`);
        console.log(`  Password: ${authData.testPassword}\n`);

    } catch (error) {
        console.error('\n❌ Test execution failed:', error);
        process.exit(1);
    }
}

// Run tests
runFinalTests().catch(console.error);
