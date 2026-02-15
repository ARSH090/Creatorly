import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Check MongoDB Connection
        await connectToDatabase();
        const dbStatus = mongoose.connection.readyState;

        // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
        const isDbHealthy = dbStatus === 1;

        const healthStatus = {
            status: isDbHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            services: {
                mongodb: {
                    status: isDbHealthy ? 'up' : 'down',
                    readyState: dbStatus
                }
            },
            version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
        };

        if (!isDbHealthy) {
            return NextResponse.json(healthStatus, { status: 503 });
        }

        return NextResponse.json(healthStatus, { status: 200 });

    } catch (error: any) {
        console.error('Health check failed:', error);
        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        }, { status: 500 });
    }
}
