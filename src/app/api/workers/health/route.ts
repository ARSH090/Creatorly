import { NextResponse } from 'next/server';
import IORedis from 'ioredis';

export async function GET() {
    try {
        const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: 1,
            connectTimeout: 3000,
        });
        const pong = await redis.ping();
        await redis.quit();

        const { mailQueue, instagramQueue, whatsappQueue } = await import('@/lib/queue');
        const [mailWaiting, igWaiting, waWaiting] = await Promise.all([
            mailQueue.getWaitingCount(),
            instagramQueue.getWaitingCount(),
            whatsappQueue.getWaitingCount(),
        ]);

        return NextResponse.json({
            status: pong === 'PONG' ? 'ok' : 'degraded',
            queues: { mail: mailWaiting, instagram: igWaiting, whatsapp: waWaiting },
            timestamp: new Date().toISOString(),
        });
    } catch (err: any) {
        return NextResponse.json({ status: 'error', error: err.message }, { status: 503 });
    }
}
