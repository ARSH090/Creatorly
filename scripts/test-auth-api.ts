// Using built-in fetch

const BASE_URL = 'http://localhost:3000';

async function runTests() {
    console.log('🚀 Starting Phase 2: Auth API Verification');
    console.log('='.repeat(50));

    const testEmail = `testuser_${Math.random().toString(36).substring(7)}@example.com`;
    const testUsername = `user_${Math.random().toString(36).substring(7)}`;
    const testPassword = 'StrongPassword!123';

    // 1. Test Signup Validation (Weak Password)
    console.log('\n[2.3] Testing Password Strength Validation...');
    const weakSignup = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'weak@example.com',
            username: 'weakuser',
            password: '123',
            displayName: 'Weak User'
        })
    });
    const weakResult = await weakSignup.json();
    if (weakSignup.status === 400 && weakResult.error) {
        console.log('✅ Pass: Weak password rejected with error:', weakResult.error);
    } else {
        console.error('❌ Fail: Weak password was not rejected correctly', weakResult);
    }

    // 2. Test Success Signup
    console.log('\n[2.1] Testing Success Signup...');
    const signupResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: testEmail,
            username: testUsername,
            password: testPassword,
            displayName: 'Test User'
        })
    });
    const signupResult = await signupResponse.json();
    if (signupResponse.status === 201) {
        console.log('✅ Pass: User created successfully:', signupResult.user.email);
    } else {
        console.error('❌ Fail: Failed to create user:', signupResult);
        process.exit(1);
    }

    // 3. Test Duplicate Signup (Email)
    console.log('\n[2.2] Testing Duplicate Email Registration...');
    const duplicateResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: testEmail,
            username: 'another_user',
            password: testPassword,
            displayName: 'Duplicate User'
        })
    });
    const duplicateResult = await duplicateResponse.json();
    if (duplicateResponse.status === 400 && duplicateResult.error.includes('already registered')) {
        console.log('✅ Pass: Duplicate email rejected correctly:', duplicateResult.error);
    } else {
        console.error('❌ Fail: Duplicate email was not handled correctly', duplicateResult);
    }

    console.log('\n✅ Phase 2 API Verification (Part 1) Complete.');
}

runVerification();

async function runVerification() {
    try {
        await runTests();
    } catch (error) {
        console.error('Test Execution Error:', error);
    }
}
