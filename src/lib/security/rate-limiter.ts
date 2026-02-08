export class RateLimiter {
    private static instances: Map<string, Map<string, { count: number; lastReset: number }>> = new Map();

    static async check(key: string, limit: number, windowMs: number, identifier: string) {
        if (!this.instances.has(key)) {
            this.instances.set(key, new Map());
        }

        const limits = this.instances.get(key)!;
        const now = Date.now();
        const current = limits.get(identifier) || { count: 0, lastReset: now };

        if (now - current.lastReset > windowMs) {
            current.count = 1;
            current.lastReset = now;
        } else {
            current.count++;
        }

        limits.set(identifier, current);

        return current.count <= limit;
    }
}
