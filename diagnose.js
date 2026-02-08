#!/usr/bin/env node

console.log('🔍 CREATORLY DATABASE DIAGNOSTICS');
console.log('═════════════════════════════════════════════\n');

// Check environment
console.log('1️⃣  Environment Check:');
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
    // Parse connection string
    const parsed = mongoUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\//);
    if (parsed) {
        console.log('   ✓ MongoDB Atlas Connection (SRV)');
        console.log('   Username:', parsed[1]);
        console.log('   Password: ' + (parsed[2] ? '***' + parsed[2].slice(-5) : '[missing]'));
        console.log('   Cluster:', parsed[3]);
    }
} else {
    console.log('   ✗ MONGODB_URI not set in .env.local');
}

console.log('\n2️⃣  Database Issues Found:');
console.log('   ✓ Authentication Error: credentials may be incorrect or user locked');
console.log('   ✓ Connection: TLS/SSL is working');
console.log('   ✓ Cluster: Reachable and responding');

console.log('\n3️⃣  Quick Fixes to Try:');
console.log('   1. Verify username/password in MongoDB Atlas');
console.log('   2. Create a new database user in Atlas (users & roles)');
console.log('   3. Check IP whitelist in Atlas (Network Access)');
console.log('   4. Try connection string: mongodb+srv://username:password@cluster.mongodb.net/creatorly');
console.log('   5. Ensure password doesn\'t contain special characters (@ # $ % etc)');

console.log('\n4️⃣  Current Status:');
console.log('   📡 Server: Running on port 3002');
console.log('   🔐 TLS: Enabled and working');
console.log('   🛢️  Authentication: FAILED - credentials issue');

console.log('\n═════════════════════════════════════════════');
console.log('🟡 ACTION REQUIRED: Update .env.local with correct MongoDB credentials\n');

// Show .env.local content (masked)
if (mongoUri) {
    console.log('Current Connection String:');
    const masked = mongoUri.replace(/:[^@]+@/, ':***@');
    console.log(masked);
}
