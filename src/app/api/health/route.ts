import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { redis } from '@/lib/db/redis';

/**
 * GET /api/health
 * Comprehensive health check endpoint for monitoring
 */
export async function GET() {
    const checks: any = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        checks: {
            api: { status: 'ok' },
            database: { status: 'unknown' },
            redis: { status: 'unknown' },
            env: { status: 'unknown' }
        }
    };

    // Check MongoDB
    try {
        await connectToDatabase();
        checks.checks.database = {
            status: 'ok',
            connected: true
        };
    } catch (error: any) {
        checks.checks.database = {
            status: 'error',
            message: error.message
        };
        checks.status = 'degraded';
    }

    // Check Redis
    try {
        await redis.ping();
        checks.checks.redis = {
            status: 'ok',
            connected: true
        };
    } catch (error: any) {
        checks.checks.redis = {
            status: 'error',
            message: error.message
        };
        checks.status = 'degraded';
    }

    // Check critical environment variables
    const requiredEnvVars = [
        'MONGODB_URI',
        'NEXTAUTH_SECRET',
        'RAZORPAY_KEY_ID',
        'RAZORPAY_KEY_SECRET',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'FIREBASE_PROJECT_ID'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingEnvVars.length > 0) {
        checks.checks.env = {
            status: 'error',
            missing: missingEnvVars
        };
        checks.status = 'unhealthy';
    } else {
        checks.checks.env = {
            status: 'ok',
            configured: requiredEnvVars.length
        };
    }

    const httpStatus = checks.status === 'unhealthy' ? 503 : 200;

    return NextResponse.json(checks, { status: httpStatus });
}
