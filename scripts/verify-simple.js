const BASE_URL = 'http://localhost:3000';

async function testEndpoint(name, endpoint) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        const headers = response.headers;
        const hasCSP = headers.has('content-security-policy');
        const hasFrameOptions = headers.has('x-frame-options');

        console.log(`Testing ${name} (${endpoint})...`);
        console.log(`Status: ${response.status}`);
        console.log(`CSP Header: ${hasCSP ? '✅ Present' : '❌ Missing'}`);
        console.log(`Frame Options: ${hasFrameOptions ? '✅ Present' : '❌ Missing'}`);

        if (hasCSP && hasFrameOptions) {
            console.log('✅ Security Headers Verified');
        } else {
            console.log('❌ Security Headers Missing');
        }
        console.log('-----------------------------------');
    } catch (error) {
        console.error(`Failed to test ${name}:`, error.message);
    }
}

async function run() {
    console.log('🚀 Verification Started');
    await testEndpoint('Home Page', '/');
    await testEndpoint('API Health', '/api/health');
}

run();
