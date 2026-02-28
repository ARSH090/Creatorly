import { Redis } from '@upstash/redis';
import { connectToDatabase } from './db/mongodb';
import Plan from './models/Plan';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ALL_PLANS_KEY = 'creatorly:plans:all';
const PLAN_KEY = (id: string) => `creatorly:plans:${id}`;
const TTL = 3600;  // 1 hour

// ── GET ALL ACTIVE PLANS ──────────────────────────
export async function getAllPlans() {
    try {
        const cached = await redis.get(ALL_PLANS_KEY);
        if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached;
    } catch (err) {
        console.warn('Redis cache read failed for all plans:', err);
    }

    await connectToDatabase();
    const plans = await Plan.find({ isActive: true })
        .sort({ displayOrder: 1 })
        .lean();

    try {
        await redis.setex(ALL_PLANS_KEY, TTL, JSON.stringify(plans));
    } catch (err) {
        console.warn('Redis cache write failed for all plans:', err);
    }

    return plans;
}

// ── GET SINGLE PLAN ───────────────────────────────
export async function getPlanById(planId: string) {
    if (!planId) return null;

    try {
        const cached = await redis.get(PLAN_KEY(planId));
        if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached;
    } catch (err) {
        console.warn(`Redis cache read failed for plan ${planId}:`, err);
    }

    await connectToDatabase();
    const plan = await Plan.findOne({
        id: planId.toLowerCase()
    }).lean();

    if (plan) {
        try {
            await redis.setex(
                PLAN_KEY(planId),
                TTL,
                JSON.stringify(plan)
            );
        } catch (err) {
            console.warn(`Redis cache write failed for plan ${planId}:`, err);
        }
    }

    return plan;
}

// ── INVALIDATE CACHE ──────────────────────────────
export async function invalidatePlanCache(planId?: string) {
    try {
        await redis.del(ALL_PLANS_KEY);
        if (planId) await redis.del(PLAN_KEY(planId));
        console.log(`Plan cache invalidated: ${planId || 'all'}`);
    } catch (err) {
        console.error('Cache invalidation failed:', err);
    }
}

// ── LIMIT HELPERS ─────────────────────────────────
export async function isUnderLimit(
    planId: string,
    feature: string,
    currentCount: number
): Promise<boolean> {
    const plan = await getPlanById(planId);
    if (!plan) return false;

    const limits = (plan as any).limits;
    const limit = limits?.[feature];

    if (limit === undefined) return true;
    if (limit === -1) return true;
    if (typeof limit === 'number') return currentCount < limit;
    return true;
}

export async function canUseFeature(
    planId: string,
    feature: string
): Promise<boolean> {
    const plan = await getPlanById(planId);
    if (!plan) return false;

    const limits = (plan as any).limits;
    const val = limits?.[feature];

    if (typeof val === 'boolean') return val;
    return true;
}

export async function getLimit(
    planId: string,
    feature: string
): Promise<number | boolean | null> {
    const plan = await getPlanById(planId);
    const limits = (plan as any).limits;
    return limits?.[feature] ?? null;
}
