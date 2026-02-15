import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

// Local in-memory cache for fallback
const localMemoryCache = new Map<string, number[]>();

export interface RateLimitConfig {
    limit: number;
    window: number; // in seconds
}

/**
 * Enhanced Rate Limiter with Upstash Redis support and local fallback
 */
export async function checkRateLimit(
    request: NextRequest,
    ip: string,
    config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; reset: number }> {
    const { limit, window } = config;
    const key = `rate_limit:${ip}:${request.nextUrl.pathname}`;

    // 1. Try Upstash Redis if configured
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        try {
            const { Redis } = await import('@upstash/redis');
            const redis = Redis.fromEnv();

            const current = await redis.incr(key);
            if (current === 1) {
                await redis.expire(key, window);
            }

            return {
                success: current <= limit,
                remaining: Math.max(0, limit - current),
                reset: window // Approximate reset
            };
        } catch (error) {
            console.error('Upstash Redis error, falling back to in-memory:', error);
        }
    }

    // 2. Fallback to Local In-Memory (Per-Instance)
    const now = Date.now();
    const windowStart = now - (window * 1000);

    const requestLog = localMemoryCache.get(key) || [];
    const recentRequests = requestLog.filter(timestamp => timestamp > windowStart);

    recentRequests.push(now);
    localMemoryCache.set(key, recentRequests);

    // Minor cleanup of old entries to prevent memory leaks
    if (localMemoryCache.size > 1000) {
        // Just clear the whole cache if it gets too big - simple but effective for per-instance memory
        localMemoryCache.clear();
    }

    return {
        success: recentRequests.length <= limit,
        remaining: Math.max(0, limit - recentRequests.length),
        reset: window
    };
}
