export class RateLimiter {
    private static instances: Map<string, Map<string, { count: number; lastReset: number }>> = new Map();

    static async check(key: string, limit: number, windowMs: number, identifier: string) {
        const { RedisRateLimiter } = await import('./redis-rate-limiter');
        return RedisRateLimiter.check(key, limit, windowMs, identifier);
    }

}
