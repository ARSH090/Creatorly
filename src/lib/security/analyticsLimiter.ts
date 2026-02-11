import redis from '@/lib/db/redis';
import { NextRequest, NextResponse } from 'next/server';


/**
 * Enterprise IP-based Rate Limiter for Analytics Endpoints
 * Prevents high-intensity scraping and dashboard abuse
 */
export async function analyticsRateLimit(req: NextRequest, limit: number = 30, windowSeconds: number = 60) {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const key = `ratelimit:analytics:${ip}`;

    const current = await redis.incr(key);

    if (current === 1) {
        await redis.expire(key, windowSeconds);
    }

    if (current > limit) {
        return NextResponse.json({
            error: 'Too many analytics requests',
            message: 'You have exceeded the rate limit for analytics reports. Please try again in a minute.',
            code: 'RATE_LIMIT_EXCEEDED'
        }, { status: 429 });
    }

    return null;
}
