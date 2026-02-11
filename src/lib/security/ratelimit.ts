import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

class RateLimiter {
    private redis: Redis | null = null;

    constructor() {
        // Only initialize Redis if URL is configured
        if (REDIS_URL) {
            const redisOptions: any = {
                maxRetriesPerRequest: 3,
                retryStrategy: (times: number) => {
                    if (times > 3) {
                        console.warn('Redis connection failed after 3 retries, rate limiting disabled');
                        return null;
                    }
                    return Math.min(times * 50, 2000);
                },
                lazyConnect: true,
                enableOfflineQueue: false,
            };

            // Add TLS config if using rediss:// protocol (Upstash)
            if (REDIS_URL.startsWith('rediss://')) {
                redisOptions.tls = {
                    rejectUnauthorized: false, // Required for Upstash
                };
            }

            this.redis = new Redis(REDIS_URL, redisOptions);

            // Handle errors gracefully
            this.redis.on('error', (err) => {
                console.warn('Redis rate limiter error (falling back to no rate limit):', err.message);
            });

            // Try to connect, but don't crash if it fails
            this.redis.connect().catch((err) => {
                console.warn('Failed to connect Redis for rate limiting:', err.message);
                this.redis = null;
            });
        } else {
            console.warn('⚠ REDIS_URL not set — rate limiting disabled');
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
            return count > limit;
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
