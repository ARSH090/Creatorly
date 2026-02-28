import { LRUCache } from 'lru-cache';

// Cache instances to persist across function calls
const limiters = new Map<string, LRUCache<string, number>>();

export async function rateLimit(token: string, type: string = 'default', limit: number = 60, intervalSeconds: number = 60) {
    let limiter = limiters.get(type);

    if (!limiter) {
        limiter = new LRUCache<string, number>({
            max: 1000,
            ttl: intervalSeconds * 1000,
        });
        limiters.set(type, limiter);
    }

    const currentUsage = (limiter.get(token) || 0) + 1;
    limiter.set(token, currentUsage);

    return currentUsage <= limit;
}

// Named limiters for specific endpoints
export const passwordResetLimiter = {
    check: async (identifier: string) => rateLimit(identifier, 'password-reset', 5, 900)
};

export function getClientIdentifier(req: { headers: { get: (h: string) => string | null } }): string {
    return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
}
