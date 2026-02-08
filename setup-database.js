#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer);
        });
    });
}

function log(message, type = 'info') {
    const colors = {
        success: '\x1b[32m',
        error: '\x1b[31m',
        warning: '\x1b[33m',
        info: '\x1b[36m',
        reset: '\x1b[0m'
    };
    console.log(`${colors[type] || colors.info}${message}${colors.reset}`);
}

async function testConnection(mongoUri) {
    try {
        const { execSync } = require('child_process');
        
        log('\n🔍 Testing MongoDB connection...', 'info');
        
        const testScript = `
const mongoose = require('mongoose');
async function test() {
    try {
        await mongoose.connect("${mongoUri}", {
            tls: true,
            tlsAllowInvalidCertificates: false,
            authSource: 'admin',
            authMechanism: 'SCRAM-SHA-256',
            serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ CONNECTION_SUCCESS');
        await mongoose.connection.close();
    } catch (e) {
        console.log('❌ CONNECTION_FAILED: ' + e.message);
    }
}
test();
`;
        
        fs.writeFileSync(path.join(__dirname, '.test-mongo.js'), testScript);
        
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve(false);
                fs.unlinkSync(path.join(__dirname, '.test-mongo.js'));
            }, 15000);

            try {
                const result = execSync(`node ${path.join(__dirname, '.test-mongo.js')}`, {
                    encoding: 'utf8',
                    timeout: 10000
                });
                
                clearTimeout(timeout);
                fs.unlinkSync(path.join(__dirname, '.test-mongo.js'));
                
                if (result.includes('CONNECTION_SUCCESS')) {
                    log('✅ Database connection successful!', 'success');
                    return resolve(true);
                } else if (result.includes('authentication failed')) {
                    log('❌ Authentication failed - credentials are incorrect', 'error');
                    return resolve(false);
                } else {
                    log('❌ Connection error: ' + result, 'error');
                    return resolve(false);
                }
            } catch (e) {
                clearTimeout(timeout);
                if (fs.existsSync(path.join(__dirname, '.test-mongo.js'))) {
                    fs.unlinkSync(path.join(__dirname, '.test-mongo.js'));
                }
                
                if (e.message.includes('authentication failed')) {
                    log('❌ Authentication failed - credentials are incorrect', 'error');
                } else {
                    log('❌ Connection timeout or error', 'error');
                }
                resolve(false);
            }
        });
    } catch (error) {
        log(`❌ Error testing connection: ${error.message}`, 'error');
        return false;
    }
}

function getEnvPath() {
    return path.join(__dirname, '.env.local');
}

function readEnv() {
    const envPath = getEnvPath();
    if (!fs.existsSync(envPath)) {
        return {};
    }
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && key.trim()) {
            env[key.trim()] = valueParts.join('=').trim();
        }
    });
    return env;
}

function writeEnv(env) {
    const envPath = getEnvPath();
    let content = '';
    for (const [key, value] of Object.entries(env)) {
        content += `${key}=${value}\n`;
    }
    fs.writeFileSync(envPath, content);
}

function buildMongoUri(username, password, cluster) {
    return `mongodb+srv://${username}:${password}@${cluster}/creatorly?retryWrites=true&w=majority&appName=Cluster0`;
}

async function main() {
    console.clear();
    log('\n╔════════════════════════════════════════════════════════════════╗', 'info');
    log('║         🚀 CREATORLY DATABASE SETUP WIZARD                     ║', 'info');
    log('╚════════════════════════════════════════════════════════════════╝\n', 'info');

    const env = readEnv();
    const currentUri = env.MONGODB_URI;

    if (currentUri) {
        log('📋 Current .env.local status:', 'info');
        const masked = currentUri.replace(/:[^@]+@/, ':***@');
        log(`   ${masked}\n`, 'info');
    } else {
        log('⚠️  No .env.local file found\n', 'warning');
    }

    log('Choose an option:', 'info');
    log('1️⃣  Test current credentials', 'info');
    log('2️⃣  Update with new credentials', 'info');
    log('3️⃣  Create new user credentials', 'info');
    log('4️⃣  Exit\n', 'info');

    const choice = await question('Enter your choice (1-4): ');

    switch (choice.trim()) {
        case '1':
            await option1TestCurrent(env);
            break;
        case '2':
            await option2UpdateCredentials(env);
            break;
        case '3':
            await option3NewUser(env);
            break;
        case '4':
            log('\nGoodbye! 👋', 'info');
            rl.close();
            process.exit(0);
            break;
        default:
            log('\n❌ Invalid choice. Please try again.', 'error');
            rl.close();
            await main();
    }
}

async function option1TestCurrent(env) {
    log('\n🔍 Testing current credentials...\n', 'info');

    if (!env.MONGODB_URI) {
        log('❌ No MONGODB_URI found in .env.local', 'error');
        log('\nPlease run the setup wizard again and choose option 2 or 3.\n', 'warning');
        rl.close();
        return;
    }

    const success = await testConnection(env.MONGODB_URI);

    if (success) {
        log('\n✅ Your database is working perfectly!', 'success');
        log('   You can now create accounts and use the platform.\n', 'success');
    } else {
        log('\n❌ Connection failed. Please check:', 'error');
        log('   1. Are credentials correct?', 'error');
        log('   2. Is the user active in MongoDB Atlas?', 'error');
        log('   3. Is your IP whitelisted?', 'error');
        log('\n   Run the wizard again and choose option 2 or 3.\n', 'error');
    }

    rl.close();
}

async function option2UpdateCredentials(env) {
    log('\n📝 Update MongoDB Credentials\n', 'info');
    log('You can get these from MongoDB Atlas:', 'info');
    log('  Go to: Database Access → Find your user → Edit → Copy password\n', 'info');

    const username = await question('Enter MongoDB username (or press Enter to keep current): ');
    const password = await question('Enter MongoDB password: ');
    const cluster = await question('Enter cluster URL (example: cluster0.x3qb1ru.mongodb.net) or press Enter to keep: ');

    const currentUri = env.MONGODB_URI || '';
    const currentUsername = currentUri.match(/mongodb\+srv:\/\/([^:]+):/)?.[1] || undefined;
    const currentCluster = currentUri.match(/@([^/]+)\//)?.[1] || undefined;

    const finalUsername = username.trim() || currentUsername;
    const finalCluster = cluster.trim() || currentCluster;

    if (!finalUsername || !password.trim() || !finalCluster) {
        log('\n❌ Missing required information', 'error');
        rl.close();
        return;
    }

    const newUri = buildMongoUri(finalUsername, password.trim(), finalCluster);

    log('\n🔍 Testing new credentials...', 'info');
    const success = await testConnection(newUri);

    if (success) {
        env.MONGODB_URI = newUri;
        writeEnv(env);
        log('\n✅ Credentials updated successfully!', 'success');
        log('   Updated .env.local with new MongoDB URI', 'success');
        log('\n📝 Next steps:', 'info');
        log('   1. Run: npm run dev', 'info');
        log('   2. Run: node test-registration.js', 'info');
        log('   3. Try creating an account at http://localhost:3002\n', 'info');
    } else {
        log('\n❌ New credentials failed the test', 'error');
        const retry = await question('\nWould you like to try again? (y/n): ');
        if (retry.toLowerCase() === 'y') {
            rl.close();
            await option2UpdateCredentials(env);
            return;
        }
    }

    rl.close();
}

async function option3NewUser(env) {
    log('\n👤 Create New MongoDB User\n', 'info');
    log('Instructions:', 'info');
    log('  1. Go to: https://cloud.mongodb.com', 'info');
    log('  2. Click: Database Access (under Security)', 'info');
    log('  3. Click: + Add New Database User', 'info');
    log('  4. Enter these details:', 'info');
    log('     - Username: creatorly_user', 'info');
    log('     - Password: Creatorly2026@Secure', 'info');
    log('     - Privileges: Read and write to any database', 'info');
    log('  5. Click: Add User', 'info');
    log('  6. Copy the connection string from Connect dialog\n', 'info');

    const confirmation = await question('Have you created the user? (y/n): ');

    if (confirmation.toLowerCase() !== 'y') {
        log('\n⏭️  Please complete the user creation in MongoDB Atlas first.\n', 'warning');
        rl.close();
        return;
    }

    const cluster = await question('Enter your cluster URL (example: cluster0.x3qb1ru.mongodb.net): ');

    if (!cluster.trim()) {
        log('\n❌ Cluster URL is required', 'error');
        rl.close();
        return;
    }

    const newUri = buildMongoUri('creatorly_user', 'Creatorly2026@Secure', cluster.trim());

    log('\n🔍 Testing new user connection...', 'info');
    const success = await testConnection(newUri);

    if (success) {
        env.MONGODB_URI = newUri;
        writeEnv(env);
        log('\n✅ New user created and configured!', 'success');
        log('   Updated .env.local with new MongoDB URI', 'success');
        log('\n📝 Next steps:', 'info');
        log('   1. Run: npm run dev', 'info');
        log('   2. Run: node test-registration.js', 'info');
        log('   3. Try creating an account at http://localhost:3002\n', 'info');
    } else {
        log('\n❌ New user connection failed', 'error');
        log('   Please verify:', 'error');
        log('   1. Username is: creatorly_user', 'error');
        log('   2. Password is: Creatorly2026@Secure', 'error');
        log('   3. Cluster URL is correct', 'error');
        log('   4. IP is whitelisted in MongoDB Atlas\n', 'error');
    }

    rl.close();
}

main().catch(error => {
    log(`\n❌ Error: ${error.message}`, 'error');
    rl.close();
    process.exit(1);
});
