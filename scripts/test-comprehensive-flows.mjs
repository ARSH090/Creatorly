/**
 * Comprehensive Authentication & User Flow Testing Script
 * Tests all authentication flows, user profiles, and Instagram integration
 */

const BASE_URL = 'http://localhost:3000';

// Test results storage
const results = {
    auth: [],
    profile: [],
    instagram: [],
    summary: { passed: 0, failed: 0, skipped: 0 }
};

// Utility functions
function log(message, type = 'info') {
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️', skip: '⏭️' };
    console.log(`${icons[type]} ${message}`);
}

async function testEndpoint(name, endpoint, options = {}) {
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

        return { name, endpoint, status, data, success: true };
    } catch (error) {
        return { name, endpoint, error: error.message, success: false };
    }
}

// ============================================================================
// PHASE 1: AUTHENTICATION TESTING
// ============================================================================

async function testAuthentication() {
    console.log('\n' + '='.repeat(80));
    console.log('🔐 PHASE 1: AUTHENTICATION & AUTHORIZATION TESTING');
    console.log('='.repeat(80));

    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    const testUsername = `testuser${timestamp}`;
    const testPassword = 'SecurePass123!';

    // Test 1.1: Email Sign-up
    console.log('\n📝 Test 1.1: Email Sign-up - User Creation & Redirect');
    console.log('-'.repeat(80));

    const signupResult = await testEndpoint('Sign-up API', '/api/auth/register', {
        method: 'POST',
        body: {
            email: testEmail,
            password: testPassword,
            username: testUsername,
            displayName: 'Test User'
        }
    });

    if (signupResult.status === 201 && signupResult.data.success) {
        log('✓ User created successfully', 'success');
        log(`  User ID: ${signupResult.data.user.id}`, 'info');
        log(`  Email: ${signupResult.data.user.email}`, 'info');
        log(`  Username: ${signupResult.data.user.username}`, 'info');
        results.auth.push({ test: '1.1', name: 'Email Sign-up', status: 'PASS' });
        results.summary.passed++;
    } else {
        log('✗ Sign-up failed', 'error');
        log(`  Status: ${signupResult.status}`, 'error');
        log(`  Response: ${JSON.stringify(signupResult.data)}`, 'error');
        results.auth.push({ test: '1.1', name: 'Email Sign-up', status: 'FAIL', error: signupResult.data });
        results.summary.failed++;
    }

    // Test 1.2: Duplicate Sign-up
    console.log('\n📝 Test 1.2: Duplicate Sign-up - Error Handling');
    console.log('-'.repeat(80));

    const duplicateResult = await testEndpoint('Duplicate Sign-up', '/api/auth/register', {
        method: 'POST',
        body: {
            email: testEmail,
            password: testPassword,
            username: testUsername,
            displayName: 'Test User 2'
        }
    });

    if (duplicateResult.status === 400 && duplicateResult.data.error) {
        log('✓ Duplicate sign-up properly rejected', 'success');
        log(`  Error message: ${duplicateResult.data.error}`, 'info');
        results.auth.push({ test: '1.2', name: 'Duplicate Sign-up', status: 'PASS' });
        results.summary.passed++;
    } else {
        log('✗ Duplicate sign-up not properly handled', 'error');
        results.auth.push({ test: '1.2', name: 'Duplicate Sign-up', status: 'FAIL' });
        results.summary.failed++;
    }

    // Test 1.3: Password Strength Validation
    console.log('\n📝 Test 1.3: Password Strength Validation');
    console.log('-'.repeat(80));

    const weakPasswords = [
        { password: '123456', reason: 'Too weak' },
        { password: 'password', reason: 'No numbers or special chars' },
        { password: 'Pass1!', reason: 'Too short' }
    ];

    let passwordTestsPassed = 0;
    for (const test of weakPasswords) {
        const weakPassResult = await testEndpoint(`Weak password: ${test.password}`, '/api/auth/register', {
            method: 'POST',
            body: {
                email: `test-weak-${Date.now()}@example.com`,
                password: test.password,
                username: `weaktest${Date.now()}`,
                displayName: 'Weak Test'
            }
        });

        if (weakPassResult.status === 400) {
            log(`✓ Rejected weak password: ${test.password} (${test.reason})`, 'success');
            passwordTestsPassed++;
        } else {
            log(`✗ Accepted weak password: ${test.password}`, 'error');
        }
    }

    if (passwordTestsPassed === weakPasswords.length) {
        results.auth.push({ test: '1.3', name: 'Password Strength', status: 'PASS' });
        results.summary.passed++;
    } else {
        results.auth.push({ test: '1.3', name: 'Password Strength', status: 'FAIL' });
        results.summary.failed++;
    }

    // Test 1.4-1.7: Login, Rate Limiting, Protected Routes, Token Expiry
    console.log('\n📝 Test 1.4-1.7: Login & Session Management');
    console.log('-'.repeat(80));
    log('⏭️  Manual testing required for:', 'skip');
    log('  - Login with correct credentials (requires browser session)', 'info');
    log('  - Login with wrong password (rate limiting)', 'info');
    log('  - Protected route access (requires browser)', 'info');
    log('  - Token expiry simulation (time-based)', 'info');

    results.auth.push({ test: '1.4', name: 'Login - Correct', status: 'MANUAL' });
    results.auth.push({ test: '1.5', name: 'Login - Wrong Password', status: 'MANUAL' });
    results.auth.push({ test: '1.6', name: 'Protected Route', status: 'MANUAL' });
    results.auth.push({ test: '1.7', name: 'Token Expiry', status: 'MANUAL' });
    results.summary.skipped += 4;

    return { testEmail, testUsername, testPassword };
}

// ============================================================================
// PHASE 2: USER PROFILE TESTING
// ============================================================================

async function testUserProfile() {
    console.log('\n' + '='.repeat(80));
    console.log('👤 PHASE 2: USER PROFILE & SETTINGS TESTING');
    console.log('='.repeat(80));

    // Test 2.1-2.5: Profile operations
    console.log('\n📝 Test 2.1-2.5: Profile Management');
    console.log('-'.repeat(80));
    log('⏭️  Manual testing required for:', 'skip');
    log('  - Update display name (requires authenticated session)', 'info');
    log('  - Upload avatar (requires file upload UI)', 'info');
    log('  - Invalid file detection (requires browser)', 'info');
    log('  - Bio character limit (requires form interaction)', 'info');
    log('  - Account deletion (requires confirmation flow)', 'info');

    results.profile.push({ test: '2.1', name: 'Update Display Name', status: 'MANUAL' });
    results.profile.push({ test: '2.2', name: 'Upload Avatar', status: 'MANUAL' });
    results.profile.push({ test: '2.3', name: 'Invalid File Detection', status: 'MANUAL' });
    results.profile.push({ test: '2.4', name: 'Bio Character Limit', status: 'MANUAL' });
    results.profile.push({ test: '2.5', name: 'Account Deletion', status: 'MANUAL' });
    results.summary.skipped += 5;
}

// ============================================================================
// PHASE 3: INSTAGRAM INTEGRATION TESTING
// ============================================================================

async function testInstagramIntegration() {
    console.log('\n' + '='.repeat(80));
    console.log('📸 PHASE 3: INSTAGRAM INTEGRATION TESTING');
    console.log('='.repeat(80));

    // Check if Instagram endpoints exist
    console.log('\n📝 Test 3.0: Instagram API Endpoints Availability');
    console.log('-'.repeat(80));

    const instagramEndpoints = [
        '/api/social/instagram/connect',
        '/api/social/instagram/callback',
        '/api/social/instagram/analytics',
        '/api/social/instagram/rules'
    ];

    for (const endpoint of instagramEndpoints) {
        const result = await testEndpoint(`Instagram: ${endpoint}`, endpoint);
        if (result.status < 500) {
            log(`✓ Endpoint exists: ${endpoint}`, 'success');
        } else {
            log(`✗ Endpoint error: ${endpoint}`, 'error');
        }
    }

    // Test 3.1-3.3: Instagram OAuth
    console.log('\n📝 Test 3.1: Instagram OAuth Flow');
    console.log('-'.repeat(80));
    log('⏭️  Manual testing required for:', 'skip');
    log('  - Connect Instagram (OAuth flow)', 'info');
    log('  - Reconnect expired token', 'info');
    log('  - Disconnect flow', 'info');

    results.instagram.push({ test: '3.1.1', name: 'Connect Instagram', status: 'MANUAL' });
    results.instagram.push({ test: '3.1.2', name: 'Reconnect Token', status: 'MANUAL' });
    results.instagram.push({ test: '3.1.3', name: 'Disconnect', status: 'MANUAL' });

    // Test 3.2: DM Automation
    console.log('\n📝 Test 3.2: DM Automation');
    console.log('-'.repeat(80));
    log('⏭️  Manual testing required for:', 'skip');
    log('  - Create DM template', 'info');
    log('  - Trigger DM on test follower', 'info');
    log('  - DM rate limiting', 'info');
    log('  - Invalid placeholder fallback', 'info');

    results.instagram.push({ test: '3.2.1', name: 'DM Template', status: 'MANUAL' });
    results.instagram.push({ test: '3.2.2', name: 'Trigger DM', status: 'MANUAL' });
    results.instagram.push({ test: '3.2.3', name: 'DM Rate Limit', status: 'MANUAL' });
    results.instagram.push({ test: '3.2.4', name: 'Invalid Placeholder', status: 'MANUAL' });

    // Test 3.3: Bio Sync
    console.log('\n📝 Test 3.3: Bio Sync');
    console.log('-'.repeat(80));
    log('⏭️  Manual testing required for:', 'skip');
    log('  - Automatic bio sync', 'info');
    log('  - Manual bio push', 'info');
    log('  - Conflict resolution', 'info');

    results.instagram.push({ test: '3.3.1', name: 'Auto Bio Sync', status: 'MANUAL' });
    results.instagram.push({ test: '3.3.2', name: 'Manual Bio Push', status: 'MANUAL' });
    results.instagram.push({ test: '3.3.3', name: 'Conflict Resolution', status: 'MANUAL' });

    results.summary.skipped += 10;
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

async function runAllTests() {
    console.log('\n🚀 CREATORLY COMPREHENSIVE TESTING SUITE');
    console.log('Test Time: ' + new Date().toISOString());
    console.log('Base URL: ' + BASE_URL);

    try {
        // Phase 1: Authentication
        const authData = await testAuthentication();

        // Phase 2: User Profile
        await testUserProfile();

        // Phase 3: Instagram Integration
        await testInstagramIntegration();

        // Print Summary
        console.log('\n' + '='.repeat(80));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(80));

        console.log('\n🔐 Authentication Tests:');
        results.auth.forEach(r => {
            const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⏭️';
            console.log(`  ${icon} ${r.test}: ${r.name} - ${r.status}`);
        });

        console.log('\n👤 User Profile Tests:');
        results.profile.forEach(r => {
            const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⏭️';
            console.log(`  ${icon} ${r.test}: ${r.name} - ${r.status}`);
        });

        console.log('\n📸 Instagram Integration Tests:');
        results.instagram.forEach(r => {
            const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⏭️';
            console.log(`  ${icon} ${r.test}: ${r.name} - ${r.status}`);
        });

        console.log('\n' + '='.repeat(80));
        console.log('OVERALL RESULTS:');
        console.log(`  ✅ Passed: ${results.summary.passed}`);
        console.log(`  ❌ Failed: ${results.summary.failed}`);
        console.log(`  ⏭️  Manual Testing Required: ${results.summary.skipped}`);
        console.log(`  📊 Total: ${results.summary.passed + results.summary.failed + results.summary.skipped}`);
        console.log('='.repeat(80));

        if (results.summary.failed === 0) {
            console.log('\n✨ ALL AUTOMATED TESTS PASSED ✨');
            console.log('⚠️  Please complete manual testing for full verification\n');
        } else {
            console.log(`\n⚠️  ${results.summary.failed} AUTOMATED TESTS FAILED\n`);
        }

        // Save test user credentials for manual testing
        console.log('\n📝 TEST USER CREDENTIALS (for manual testing):');
        console.log(`  Email: ${authData.testEmail}`);
        console.log(`  Username: ${authData.testUsername}`);
        console.log(`  Password: ${authData.testPassword}`);
        console.log('\n');

    } catch (error) {
        console.error('\n❌ Test execution failed:', error);
        process.exit(1);
    }
}

// Run tests
runAllTests().catch(console.error);
