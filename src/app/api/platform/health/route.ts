import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import redis from '@/lib/cache';
import mongoose from 'mongoose';

export async function GET() {
    try {
        const health = {
            status: 'degraded',
            db: 'disconnected',
            redis: 'disconnected',
            timestamp: new Date().toISOString()
        };

        // Check DB
        try {
            await connectToDatabase();
            if (mongoose.connection.readyState === 1) {
                health.db = 'connected';
            }
        } catch (dbErr) {
            console.error('Health Check - DB Error:', dbErr);
        }

        // Check Redis
        try {
            const pong = await redis.ping();
            if (pong === 'PONG') {
                health.redis = 'connected';
            }
        } catch (redisErr) {
            console.error('Health Check - Redis Error:', redisErr);
        }

        if (health.db === 'connected' && health.redis === 'connected') {
            health.status = 'ok';
            return NextResponse.json(health, { status: 200 });
        }

        return NextResponse.json(health, { status: 503 }); // Service Unavailable if degraded
    } catch (error) {
        return NextResponse.json({ status: 'down', timestamp: new Date().toISOString() }, { status: 500 });
    }
}
