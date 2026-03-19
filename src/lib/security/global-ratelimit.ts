import { metaRateLimiter as limiter } from "./ratelimit";

/**
 * Global Rate Limiter using ioredis (TCP-based)
 * 
 * Configured with separate limits for different route types:
 */

export const authRateLimit = {
    limit: async (ip: string) => ({ success: !(await limiter.isRateLimited(`ratelimit:auth:${ip}`, 5, 900)) })
};

export const usernameCheckRateLimit = {
    limit: async (ip: string) => ({ success: !(await limiter.isRateLimited(`ratelimit:username-check:${ip}`, 60, 60)) })
};

export const paymentRateLimit = {
    limit: async (ip: string) => ({ success: !(await limiter.isRateLimited(`ratelimit:payment:${ip}`, 10, 60)) })
};

export const publicApiRateLimit = {
    limit: async (ip: string) => ({ success: !(await limiter.isRateLimited(`ratelimit:public:${ip}`, 60, 60)) })
};

export const webhookRateLimit = {
    limit: async (ip: string) => ({ success: !(await limiter.isRateLimited(`ratelimit:webhook:${ip}`, 100, 60)) })
};
