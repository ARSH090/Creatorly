import { LRUCache } from 'lru-cache';

type Options = {
    uniqueTokenPerInterval?: number;
    interval?: number;
};

export function rateLimit(options?: Options) {
    const tokenCache = new LRUCache({
        max: options?.uniqueTokenPerInterval ?? 500,
        ttl: options?.interval ?? 60000,
    });

    return {
        check: (limit: number, token: string) =>
            new Promise<void>((resolve, reject) => {
                const tokenCount = (tokenCache.get(token) as number[]) || [0];
                if (tokenCount[0] === 0) {
                    tokenCache.set(token, tokenCount);
                }
                tokenCount[0] += 1;

                const currentUsage = tokenCount[0];
                const isRateLimited = currentUsage >= limit;

                return isRateLimited ? reject() : resolve();
            }),
    };
}

// Pre-configured limiters for common use cases
export const authLimiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
});

export const otpLimiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
});

export const passwordResetLimiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
});

/**
 * Helper to get client identifier (IP address)
 */
export function getClientIdentifier(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'anonymous';
    return ip.trim();
}
