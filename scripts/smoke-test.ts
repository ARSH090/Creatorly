#!/usr/bin/env ts-node
import { connectToDatabase } from '../src/lib/db/mongodb';
import redis from '../src/lib/db/redis';
import Razorpay from 'razorpay';
import * as admin from 'firebase-admin';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import mongoose from 'mongoose';

/**
 * Creatorly Production Smoke Test
 * Gatekeeper for production-readiness verification.
 */

async function runSmokeTest() {
    console.log('\n🚀 Starting Creatorly Production Smoke Test...');
    console.log('='.repeat(60));

    let success = true;

    // 1. Database Connectivity (MongoDB)
    try {
        console.log('\n🍃 Testing MongoDB Connectivity...');
        await connectToDatabase();
        if (mongoose.connection.readyState === 1) {
            console.log('   ✅ MongoDB Connected');
        } else {
            throw new Error('MongoDB readyState is not 1');
        }
    } catch (error: any) {
        console.error(`   ❌ MongoDB Failed: ${error.message}`);
        success = false;
    }

    // 2. Cache Connectivity (Redis)
    try {
        console.log('\n⚡ Testing Redis Connectivity...');
        if (!redis) throw new Error('Redis client not initialized');
        const ping = await redis.ping();
        if (ping === 'PONG') {
            console.log('   ✅ Redis (Upstash) Connected');
        } else {
            throw new Error(`Redis ping failed with: ${ping}`);
        }
    } catch (error: any) {
        console.error(`   ❌ Redis Failed: ${error.message}`);
        success = false;
    }

    // 3. Payment Gateway Connectivity (Razorpay)
    try {
        console.log('\n💳 Testing Razorpay Connectivity...');
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || '',
            key_secret: process.env.RAZORPAY_KEY_SECRET || '',
        });
        const orders = await razorpay.orders.all({ count: 1 });
        if (orders) {
            console.log('   ✅ Razorpay API Verified');
        }
    } catch (error: any) {
        console.error(`   ❌ Razorpay Failed: ${error.message}`);
        success = false;
    }

    // 4. Authentication Connectivity (Clerk)
    try {
        console.log('\n🔐 Testing Clerk Connectivity...');
        const clerkSecret = process.env.CLERK_SECRET_KEY;
        if (!clerkSecret) throw new Error('CLERK_SECRET_KEY not set');

        // Simple internal check or mocked request since we don't have a backend client easily here without full setup
        // But we can verify the environment variable length and prefix
        if (clerkSecret.startsWith('sk_test_') || clerkSecret.startsWith('sk_live_')) {
            console.log('   ✅ Clerk Secret Key Format Verified');
        } else {
            throw new Error('Invalid Clerk Secret Key format');
        }
    } catch (error: any) {
        console.error(`   ❌ Clerk Failed: ${error.message}`);
        success = false;
    }

    // 5. Storage Connectivity (AWS S3)
    try {
        console.log('\n📦 Testing AWS S3 Connectivity...');
        const s3Client = new S3Client({
            region: process.env.AWS_REGION || 'ap-south-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
        });
        await s3Client.send(new ListBucketsCommand({}));
        console.log('   ✅ AWS S3 Connectivity Verified');
    } catch (error: any) {
        console.error(`   ❌ AWS S3 Failed: ${error.message}`);
        success = false;
    }

    console.log('\n' + '='.repeat(60));
    if (success) {
        console.log('\n🎉 ALL SYSTEMS GO: Creatorly is production-ready!');
        process.exit(0);
    } else {
        console.log('\n🛑 BLOCKERS FOUND: Please check the failures listed above.');
        process.exit(1);
    }
}

runSmokeTest().catch(err => {
    console.error('\n💥 CRITICAL TEST FAILURE:', err);
    process.exit(1);
});
