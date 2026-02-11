import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
        const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
        const ua = req.headers.get('user-agent') || 'unknown';
        const referrer = req.headers.get('referer') || '';

        // 1. Bot Detection (Basic)
        const isBot = /bot|spider|crawl|slurp|adsbot/i.test(ua);
        if (isBot) return NextResponse.json({ success: true, bot: true });

        // 2. Redis-backed Rate Limiting (1 view per 10 mins per IP per profile)
        const { RedisRateLimiter } = await import('@/lib/security/redis-rate-limiter');
        const limitKey = `analytics:${data.creatorId}:${ip}`;
        const isAllowed = await RedisRateLimiter.check(limitKey, 1, 10 * 60 * 1000, ip);

        if (!isAllowed) {
            return NextResponse.json({ success: true, throttled: true });
        }


        await connectToDatabase();

        // Persist the analytics event with safe defaults
        await AnalyticsEvent.create({
            eventType: (data.type || 'page_view').slice(0, 50),
            creatorId: data.creatorId,
            productId: data.productId,
            orderId: data.orderId,
            ip,
            userAgent: ua.slice(0, 200),
            referrer: referrer.slice(0, 200),
            path: (data.path || '/').slice(0, 100),
            metadata: data.metadata || {}
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Analytics] Error logging event:', error);
        // We return 200 even if analytics fail to not break the user experience
        return NextResponse.json({ success: false }, { status: 200 });
    }
}
