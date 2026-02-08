import { connectToDatabase } from '@/lib/db/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const startTime = Date.now();
        await connectToDatabase();
        const dbLatency = Date.now() - startTime;

        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            latency: {
                database: `${dbLatency}ms`,
            },
            environment: process.env.NODE_ENV,
            version: '1.0.0',
        };

        return NextResponse.json(health);
    } catch (error: any) {
        // Enhanced error logging
        console.error('Health API error:', error);
        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error?.message || error
        }, { status: 503 });
    }
}
