import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Global Rate Limiter using Upstash Redis (HTTP-based)
 * 
 * Configured with separate limits for different route types:
 * - Auth endpoints: 5 req / 15 min
 * - Payment/Checkout: 10 req / 1 min
 * - Public API: 60 req / 1 min
 * - Webhooks: 100 req / 1 min
 */

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

export const authRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: true,
    prefix: "ratelimit:auth",
});

// Separate, relaxed limit for the live username availability checker.
// This endpoint fires on every keystroke (debounced 500ms) during registration,
// so needs a much higher ceiling than the standard auth limit.
export const usernameCheckRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: false,
    prefix: "ratelimit:username-check",
});


export const paymentRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: true,
    prefix: "ratelimit:payment",
});

export const publicApiRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: true,
    prefix: "ratelimit:public",
});

export const webhookRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    analytics: true,
    prefix: "ratelimit:webhook",
});
