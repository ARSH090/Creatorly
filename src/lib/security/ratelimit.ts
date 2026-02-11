import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class RateLimiter {
    private redis: Redis;

    constructor() {
        this.redis = new Redis(REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => Math.min(times * 50, 2000),
        });
    }

    /**
     * Checks if a user is within the rate limit for a specific action
     * @param key Unique key for the action/user (e.g. meta:ratelimit:creator_id:user_id)
     * @param limit Max attempts allowed
     * @param window Time window in seconds
     */
    async isRateLimited(key: string, limit: number, window: number): Promise<boolean> {
        const count = await this.redis.incr(key);
        if (count === 1) {
            await this.redis.expire(key, window);
        }
        return count > limit;
    }

    /**
     * Specific rate limiters for Meta Automation
     */
    async checkMetaQuota(creatorId: string, recipientId: string): Promise<{ limited: boolean; reason?: string }> {
        // 1. Global creator quota (prevent platform hammering)
        // 50 DMs per minute per creator
        if (await this.isRateLimited(`meta:limit:c:${creatorId}`, 50, 60)) {
            return { limited: true, reason: 'CREATOR_QUOTA_EXCEEDED' };
        }

        // 2. Per-user quota (prevent spamming the same follower)
        // 1 active automation per 10 minutes for the same user (prevent loops)
        if (await this.isRateLimited(`meta:limit:r:${creatorId}:${recipientId}`, 1, 600)) {
            return { limited: true, reason: 'RECIPIENT_QUOTA_EXCEEDED' };
        }

        return { limited: false };
    }
}

export const metaRateLimiter = new RateLimiter();
