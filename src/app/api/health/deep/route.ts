import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import redis from '@/lib/db/redis';

/**
 * Deep Health Check Endpoint
 * Verifies connectivity to all critical infrastructure components.
 * Only accessible via internal secret or administrative check.
 */
export async function GET(request: NextRequest) {
    // 1. Authorization Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.HEALTH_CHECK_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const checks: Record<string, { status: 'healthy' | 'unhealthy', latency?: number, message?: string }> = {};

    // 2. Database (Mongoose/MongoDB) Connectivity
    const dbStart = Date.now();
    try {
        if (mongoose.connection.readyState !== 1) {
            // Not connected, attempt simple ping if possible via admin
            await mongoose.connection.db?.admin().ping();
        }
        checks.database = { status: 'healthy', latency: Date.now() - dbStart };
    } catch (error: any) {
        checks.database = { status: 'unhealthy', message: error.message };
    }

    // 3. Redis Connectivity
    const redisStart = Date.now();
    try {
        if (redis) {
            const pingResponse = await redis.ping();
            if (pingResponse === 'PONG') {
                checks.redis = { status: 'healthy', latency: Date.now() - redisStart };
            } else {
                checks.redis = { status: 'unhealthy', message: 'Unexpected ping response' };
            }
        } else {
            checks.redis = { status: 'unhealthy', message: 'Redis client not initialized' };
        }
    } catch (error: any) {
        checks.redis = { status: 'unhealthy', message: error.message };
    }

    // 4. Configuration Checks (Presence of critical ENV)
    checks.razorpay = {
        status: process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? 'healthy' : 'unhealthy'
    };

    checks.meta = {
        status: process.env.META_APP_ID && process.env.META_APP_SECRET ? 'healthy' : 'unhealthy'
    };

    const allHealthy = Object.values(checks).every(check => check.status === 'healthy');

    return NextResponse.json({
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        checks,
        environment: process.env.NODE_ENV,
        version: process.env.VERCEL_GIT_COMMIT_SHA || 'local'
    }, {
        status: allHealthy ? 200 : 503
    });
}
