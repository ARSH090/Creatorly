import redis from '@/lib/db/redis';

export class RedisRateLimiter {
    /**
     * Check whether an identifier is allowed under the given limit within windowMs.
     * Returns true if allowed, false if rate limit exceeded.
     */
    static async check(key: string, limit: number, windowMs: number, identifier: string) {
        try {
            if (!redis) {
                // Fallback to in-memory naive limiter if Redis not configured
                // This is intentionally simple; production should use Redis.
                // Keep a simple static map to avoid blowing up import complexity here.
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const { RateLimiter } = require('@/lib/security/rate-limiter');
                return RateLimiter.check(key, limit, windowMs, identifier);
            }

            const rkey = `ratelimit:${key}:${identifier}`;
            const now = Date.now();
            const ttl = Math.ceil(windowMs / 1000);

            // Use Redis INCR with EXPIRE for atomic counting
            const count = await redis.incr(rkey);
            if (count === 1) {
                await redis.expire(rkey, ttl);
            }

            return count <= limit;
        } catch (err) {
            console.error('RedisRateLimiter error, falling back:', err);
            // Allow by default on error to avoid blocking users; log so ops can fix it.
            return true;
        }
    }
}
