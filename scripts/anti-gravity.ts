#!/usr/bin/env ts-node
/**
 * Anti-Gravity Verification Suite
 * 
 * Automated checks to ensure Creatorly platform is production-ready
 * Run daily in CI: npm run verify
 */

import { execSync } from 'child_process';
import mongoose from 'mongoose';

interface VerificationCheck {
    name: string;
    category: string;
    run: () => Promise<void> | void;
}

const CHECKS: VerificationCheck[] = [
    // Environment Variables
    {
        name: 'Environment Variables - Required',
        category: 'Config',
        run: () => {
            const required = [
                'MONGODB_URI',
                'NEXTAUTH_SECRET',
                'NEXTAUTH_URL',
                'RAZORPAY_KEY_ID',
                'RAZORPAY_KEY_SECRET',
                'AWS_ACCESS_KEY_ID',
                'AWS_SECRET_ACCESS_KEY',
                'AWS_S3_BUCKET',
                'FIREBASE_PROJECT_ID',
                'FIREBASE_PRIVATE_KEY',
                'FIREBASE_CLIENT_EMAIL'
            ];
            const missing = required.filter(env => !process.env[env]);
            if (missing.length > 0) {
                throw new Error(`Missing env vars: ${missing.join(', ')}`);
            }
        }
    },

    // Database
    {
        name: 'MongoDB Connection',
        category: 'Database',
        run: async () => {
            if (!process.env.MONGODB_URI) {
                throw new Error('MONGODB_URI not set');
            }
            await mongoose.connect(process.env.MONGODB_URI);
            await mongoose.connection.db.admin().ping();
            await mongoose.disconnect();
        }
    },

    {
        name: 'Database Indexes',
        category: 'Database',
        run: async () => {
            await mongoose.connect(process.env.MONGODB_URI!);
            const collections = await mongoose.connection.db.listCollections().toArray();

            const requiredIndexes: Record<string, string[]> = {
                'users': ['email', 'firebaseUid'],
                'products': ['creatorId', 'status'],
                'orders': ['creatorId', 'paymentStatus'],
                'analyticsevents': ['creatorId', 'eventType']
            };

            for (const [collection, indexes] of Object.entries(requiredIndexes)) {
                const coll = mongoose.connection.db.collection(collection);
                const existingIndexes = await coll.indexes();
                const indexNames = existingIndexes.map((i: any) => Object.keys(i.key)[0]);

                for (const required of indexes) {
                    if (!indexNames.includes(required)) {
                        throw new Error(`Missing index ${required} on ${collection}`);
                    }
                }
            }

            await mongoose.disconnect();
        }
    },

    // API Security
    {
        name: 'Admin APIs - Auth Protected',
        category: 'Security',
        run: async () => {
            const adminRoutes = [
                '/api/admin/users',
                '/api/admin/products',
                '/api/admin/orders',
                '/api/admin/payouts',
                '/api/admin/analytics/summary'
            ];

            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

            for (const route of adminRoutes) {
                const res = await fetch(`${baseUrl}${route}`, {
                    headers: { 'Content-Type': 'application/json' }
                });

                if (res.status !== 401) {
                    throw new Error(`${route} not protected (got ${res.status})`);
                }
            }
        }
    },

    {
        name: 'Rate Limiting - Active',
        category: 'Security',
        run: async () => {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

            // Make 30 rapid requests
            const requests = Array(30).fill(null).map(() =>
                fetch(`${baseUrl}/api/analytics/track`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ eventType: 'test' })
                })
            );

            const responses = await Promise.all(requests);
            const rateLimited = responses.some(r => r.status === 429);

            if (!rateLimited) {
                throw new Error('Rate limiting not working');
            }
        }
    },

    // File Storage
    {
        name: 'S3 Bucket Access',
        category: 'Storage',
        run: async () => {
            const { S3Client, ListBucketsCommand } = await import('@aws-sdk/client-s3');

            const s3 = new S3Client({
                region: process.env.AWS_REGION || 'us-east-1',
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
                }
            });

            await s3.send(new ListBucketsCommand({}));
        }
    },

    // Models
    {
        name: 'All Models Load',
        category: 'Models',
        run: async () => {
            const models = [
                'User',
                'Product',
                'Order',
                'Payout',
                'Coupon',
                'AdminLog',
                'Affiliate',
                'AnalyticsEvent',
                'AutomationRule',
                'Availability',
                'CustomDomain',
                'EmailCampaign'
            ];

            await mongoose.connect(process.env.MONGODB_URI!);

            for (const modelName of models) {
                const model = mongoose.model(modelName);
                if (!model) {
                    throw new Error(`Model ${modelName} not found`);
                }
            }

            await mongoose.disconnect();
        }
    },

    // Payment Integration
    {
        name: 'Razorpay API Connection',
        category: 'Payments',
        run: async () => {
            const Razorpay = (await import('razorpay')).default;

            const razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID!,
                key_secret: process.env.RAZORPAY_KEY_SECRET!
            });

            // Verify keys by fetching plans (will fail if keys invalid)
            try {
                await razorpay.plans.all({ count: 1 });
            } catch (error: any) {
                if (error.statusCode === 401) {
                    throw new Error('Invalid Razorpay credentials');
                }
            }
        }
    },

    // Build
    {
        name: 'TypeScript Compilation',
        category: 'Build',
        run: () => {
            try {
                execSync('npx tsc --noEmit', { stdio: 'pipe' });
            } catch (error) {
                throw new Error('TypeScript compilation failed');
            }
        }
    },

    {
        name: 'No ESLint Errors',
        category: 'Build',
        run: () => {
            try {
                execSync('npx next lint', { stdio: 'pipe' });
            } catch (error: any) {
                // Only fail on actual errors, not warnings
                if (error.stdout && error.stdout.toString().includes('error')) {
                    throw new Error('ESLint errors found');
                }
            }
        }
    }
];

async function runAllChecks() {
    console.log('🤖 Anti-Gravity Verification Suite\n');
    console.log('='.repeat(50));

    let passed = 0;
    let failed = 0;
    const failures: { check: string; error: string }[] = [];

    const categories = [...new Set(CHECKS.map(c => c.category))];

    for (const category of categories) {
        console.log(`\n📦 ${category}`);
        console.log('-'.repeat(50));

        const categoryChecks = CHECKS.filter(c => c.category === category);

        for (const check of categoryChecks) {
            try {
                await check.run();
                console.log(`  ✅ ${check.name}`);
                passed++;
            } catch (error: any) {
                console.log(`  ❌ ${check.name}`);
                console.log(`     ${error.message}`);
                failed++;
                failures.push({ check: check.name, error: error.message });
            }
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
    console.log(`   Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

    if (failures.length > 0) {
        console.log('❌ Failed Checks:');
        failures.forEach(({ check, error }) => {
            console.log(`   - ${check}: ${error}`);
        });
        console.log('');
        process.exit(1);
    } else {
        console.log('✅ All checks passed! System is production-ready.\n');
        process.exit(0);
    }
}

if (require.main === module) {
    runAllChecks().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
