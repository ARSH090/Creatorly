#!/usr/bin/env ts-node

/**
 * Environment Variable Validator
 * Checks all required environment variables are set
 */

const REQUIRED_ENV_VARS = {
    'Database': [
        'MONGODB_URI',
        'REDIS_URL'
    ],
    'Authentication': [
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL',
        'FIREBASE_PROJECT_ID',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_PRIVATE_KEY'
    ],
    'Payment': [
        'RAZORPAY_KEY_ID',
        'RAZORPAY_KEY_SECRET',
        'RAZORPAY_WEBHOOK_SECRET'
    ],
    'Storage': [
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_REGION',
        'AWS_S3_BUCKET'
    ],
    'Social': [
        'META_APP_ID',
        'META_APP_SECRET',
        'META_WEBHOOK_VERIFY_TOKEN'
    ],
    'Application': [
        'NEXT_PUBLIC_APP_URL',
        'NODE_ENV'
    ]
};

const OPTIONAL_ENV_VARS = {
    'Monitoring': [
        'SENTRY_DSN'
    ],
    'Email': [
        'RESEND_API_KEY'
    ],
    'Admin': [
        'ADMIN_EMAIL',
        'ADMIN_PASSWORD'
    ]
};

function validateEnv() {
    console.log('🔍 Validating Environment Variables\n');
    console.log('='.repeat(60));

    let hasErrors = false;
    let warningCount = 0;

    // Check required variables
    console.log('\n📋 REQUIRED VARIABLES:\n');

    for (const [category, vars] of Object.entries(REQUIRED_ENV_VARS)) {
        console.log(`\n${category}:`);

        for (const varName of vars) {
            const value = process.env[varName];

            if (!value) {
                console.log(`   ❌ ${varName} - MISSING`);
                hasErrors = true;
            } else {
                // Mask sensitive values
                const displayValue = varName.includes('SECRET') || varName.includes('KEY') || varName.includes('PASSWORD')
                    ? '***' + value.slice(-4)
                    : value.length > 50
                        ? value.slice(0, 47) + '...'
                        : value;

                console.log(`   ✅ ${varName} = ${displayValue}`);
            }
        }
    }

    // Check optional variables
    console.log('\n\n📋 OPTIONAL VARIABLES:\n');

    for (const [category, vars] of Object.entries(OPTIONAL_ENV_VARS)) {
        console.log(`\n${category}:`);

        for (const varName of vars) {
            const value = process.env[varName];

            if (!value) {
                console.log(`   ⚠️  ${varName} - Not set (optional)`);
                warningCount++;
            } else {
                const displayValue = varName.includes('SECRET') || varName.includes('KEY') || varName.includes('PASSWORD')
                    ? '***' + value.slice(-4)
                    : value.slice(0, 30);

                console.log(`   ✅ ${varName} = ${displayValue}...`);
            }
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 SUMMARY:\n');

    const totalRequired = Object.values(REQUIRED_ENV_VARS).flat().length;
    const missingRequired = Object.values(REQUIRED_ENV_VARS).flat().filter(v => !process.env[v]).length;
    const setRequired = totalRequired - missingRequired;

    console.log(`   Required: ${setRequired}/${totalRequired} set`);
    console.log(`   Optional: ${warningCount} not set`);

    if (hasErrors) {
        console.log('\n❌ VALIDATION FAILED - Missing required environment variables');
        console.log('   Please set all required variables in .env.local\n');
        process.exit(1);
    } else {
        console.log('\n✅ VALIDATION PASSED - All required variables are set!');
        if (warningCount > 0) {
            console.log(`   ⚠️  ${warningCount} optional variables not set (non-critical)\n`);
        }
        process.exit(0);
    }
}

validateEnv();
