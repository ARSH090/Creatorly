import { Redis as UpstashRedis } from '@upstash/redis';

const REDIS_URL = process.env.REDIS_URL;
const isEdge = process.env.NEXT_RUNTIME === 'edge';

class RateLimiter {
    private redis: any = null;

    constructor() {
        if (isEdge) {
            if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
                this.redis = new UpstashRedis({
                    url: process.env.UPSTASH_REDIS_REST_URL,
                    token: process.env.UPSTASH_REDIS_REST_TOKEN,
                });
            }
        } else {
            // Node.js Runtime - Use ioredis
            try {
                const IORedis = require('ioredis');
                if (REDIS_URL) {
                    const redisOptions: any = {
                        maxRetriesPerRequest: 3,
                        retryStrategy: (times: number) => {
                            if (times > 3) return null;
                            return Math.min(times * 50, 2000);
                        },
                        lazyConnect: true,
                        enableOfflineQueue: false,
                    };

                    if (REDIS_URL.startsWith('rediss://')) {
                        redisOptions.tls = { rejectUnauthorized: false };
                    }

                    this.redis = new IORedis(REDIS_URL, redisOptions);
                    this.redis.on('error', (err: any) => console.warn('Rate limit Redis error (failing open):', err.message));
                    this.redis.connect().catch((err: any) => console.warn('Rate limit Redis connect fail:', err.message));
                }
            } catch (e) {
                console.error('Failed to initialize ioredis for rate limiting:', e);
            }
        }
    }

    /**
     * Checks if a user is within the rate limit for a specific action
     * @param key Unique key for the action/user (e.g. meta:ratelimit:creator_id:user_id)
     * @param limit Max attempts allowed
     * @param window Time window in seconds
     */
    async isRateLimited(key: string, limit: number, window: number): Promise<boolean> {
        // If Redis is not available, allow all requests (fail open)
        if (!this.redis) {
            return false;
        }

        try {
            const count = await this.redis.incr(key);
            if (count === 1) {
                await this.redis.expire(key, window);
            }
            // Upstash returns count directly, ioredis returns count directly
            return Number(count) > limit;
        } catch (error) {
            console.error('Rate limit check failed:', error);
            return false; // Fail open - allow request if Redis is down
        }
    }

    /**
     * Specific rate limiters for Meta Automation
     */
    async checkMetaQuota(creatorId: string, recipientId: string): Promise<{ limited: boolean; reason?: string }> {
        // If Redis is not available, allow all requests
        if (!this.redis) {
            return { limited: false };
        }

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
