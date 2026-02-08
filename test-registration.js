#!/usr/bin/env node

async function testRegistration() {
    const baseURL = 'http://localhost:3002';
    
    // Test data
    const testUser = {
        displayName: 'Test Creator ' + Math.random().toString(36).slice(7),
        username: 'testuser' + Math.random().toString(36).slice(7),
        email: 'test' + Math.random().toString(36).slice(7) + '@example.com',
        password: 'password123'
    };

    console.log('🧪 Testing Registration API');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 Test Data:');
    console.log('  Name:', testUser.displayName);
    console.log('  Username:', testUser.username);
    console.log('  Email:', testUser.email);
    console.log('  Password: [hidden]');

    try {
        console.log('\n1️⃣  Testing standard registration endpoint...');
        const res1 = await fetch(`${baseURL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser),
        });

        const data1 = await res1.json();
        console.log('   Status:', res1.status);
        console.log('   Response:', data1);

        if (res1.ok) {
            console.log('\n✅ Registration successful!');
            console.log('   User ID:', data1.user.id);
            console.log('   Email:', data1.user.email);
            console.log('   Username:', data1.user.username);
        } else {
            console.log('\n❌ Registration failed');
        }

        // Test debug endpoint
        console.log('\n2️⃣  Testing debug registration endpoint...');
        const debugUser = {
            displayName: 'Debug Test ' + Math.random().toString(36).slice(7),
            username: 'debugtest' + Math.random().toString(36).slice(7),
            email: 'debug' + Math.random().toString(36).slice(7) + '@test.com',
            password: 'test1234'
        };

        const res2 = await fetch(`${baseURL}/api/debug/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(debugUser),
        });

        const data2 = await res2.json();
        console.log('   Status:', res2.status);
        console.log('   Response:', data2);

        if (res2.ok) {
            console.log('\n✅ Debug registration successful!');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Test health check
async function testHealth() {
    try {
        console.log('🏥 Testing Health Endpoint...\n');
        const res = await fetch('http://localhost:3002/api/health');
        const data = await res.json();
        console.log('Health Status:', data);
        console.log('\n✅ Database connection: ' + (data.status === 'healthy' ? 'OK' : 'FAILED'));
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
    }
}

async function main() {
    await testHealth();
    console.log('\n');
    await testRegistration();
}

main();
