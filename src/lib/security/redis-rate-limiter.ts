import redis from '@/lib/db/redis';

export class RedisRateLimiter {
    /**
     * Check whether an identifier is allowed under the given limit within windowMs.
     * Returns true if allowed, false if rate limit exceeded.
     */
    static async check(key: string, limit: number, windowMs: number, identifier: string) {
        try {
            if (!redis) {
                if (process.env.NODE_ENV === 'production') {
                    console.error('[CRITICAL] Redis not configured in production. Rate limiting is degraded.');
                }
                const { RateLimiter } = require('@/lib/security/rate-limiter');
                return RateLimiter.check(key, limit, windowMs, identifier);
            }

            const rkey = `ratelimit:${key}:${identifier}`;
            const now = Date.now();

            // Distributed Sliding Window using Sorted Sets (Enterprise Grade)
            const transaction = redis.multi();
            const minTime = now - windowMs;

            transaction.zremrangebyscore(rkey, 0, minTime);
            transaction.zadd(rkey, now.toString(), now.toString());
            transaction.zcard(rkey);
            transaction.expire(rkey, Math.ceil(windowMs / 1000));

            const results = await transaction.exec();
            if (!results) return true;

            const currentCount = results[2][1] as number;
            return currentCount <= limit;
        } catch (err) {
            console.error('RedisRateLimiter failure:', err);
            return true;
        }
    }

}
