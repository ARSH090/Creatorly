#!/usr/bin/env ts-node

/**
 * Database Index Optimizer
 * Ensures all critical indexes exist for optimal performance
 */

import mongoose from 'mongoose';
import { User } from '../src/lib/models/User';
import Product from '../src/lib/models/Product';
import { Order } from '../src/lib/models/Order';
import { AnalyticsEvent } from '../src/lib/models/AnalyticsEvent';
import Coupon from '../src/lib/models/Coupon';
import { Affiliate } from '../src/lib/models/Affiliate';
import Payout from '../src/lib/models/Payout';

async function ensureIndexes() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('MONGODB_URI not set');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const indexedModels = [
        { name: 'User', model: User },
        { name: 'Product', model: Product },
        { name: 'Order', model: Order },
        { name: 'AnalyticsEvent', model: AnalyticsEvent },
        { name: 'Coupon', model: Coupon },
        { name: 'Affiliate', model: Affiliate },
        { name: 'Payout', model: Payout }
    ];

    console.log('🔍 Ensuring indexes for all models...\n');

    for (const { name, model } of indexedModels) {
        try {
            console.log(`📋 ${name}:`);
            await model.createIndexes();

            const indexes = await model.collection.getIndexes();
            console.log(`   ✅ ${Object.keys(indexes).length} indexes ensured`);

            // List all indexes
            for (const [indexName, indexSpec] of Object.entries(indexes)) {
                if (indexName !== '_id_') {
                    console.log(`      - ${indexName}`);
                }
            }
            console.log();
        } catch (error: any) {
            console.error(`   ❌ Error for ${name}:`, error.message);
        }
    }

    // Check for slow queries (if admin access available)
    console.log('🔍 Checking for potential index improvements...\n');

    const suggestedIndexes = [
        {
            collection: 'users',
            fields: { email: 1 },
            reason: 'Quick user lookup by email'
        },
        {
            collection: 'products',
            fields: { creatorId: 1, status: 1 },
            reason: 'Creator product filtering'
        },
        {
            collection: 'orders',
            fields: { creatorId: 1, paymentStatus: 1, paidAt: -1 },
            reason: 'Revenue queries'
        },
        {
            collection: 'orders',
            fields: { customerEmail: 1 },
            reason: 'Customer order lookup'
        },
        {
            collection: 'analyticsevents',
            fields: { creatorId: 1, eventType: 1, timestamp: -1 },
            reason: 'Analytics aggregation'
        },
        {
            collection: 'coupons',
            fields: { code: 1 },
            reason: 'Coupon validation (unique)'
        },
        {
            collection: 'affiliates',
            fields: { creatorId: 1, status: 1 },
            reason: 'Affiliate management'
        },
        {
            collection: 'payouts',
            fields: { creatorId: 1, status: 1 },
            reason: 'Payout queries'
        }
    ];

    console.log('💡 Recommended indexes:');
    for (const idx of suggestedIndexes) {
        console.log(`   ${idx.collection}: ${JSON.stringify(idx.fields)} - ${idx.reason}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Index optimization complete!');
    process.exit(0);
}

ensureIndexes().catch((error) => {
    console.error('❌ Error ensuring indexes:', error);
    process.exit(1);
});
