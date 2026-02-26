/**
 * Plan cache — wraps /api/plans DB lookup with a 5-minute in-process TTL cache.
 * 
 * Plans change rarely (only when admin manually triggers a Razorpay sync),
 * so caching for 5 minutes is safe and eliminates a DB round-trip on every
 * pricing page load and registration form render.
 * 
 * Uses Next.js unstable_cache for persistent cross-request caching on the
 * same server instance, with the memory-cache as a fallback for hot paths.
 */
import { unstable_cache } from 'next/cache';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Plan } from '@/lib/models/Plan';
import { getCached } from '@/lib/cache';

export interface CachedPlan {
    id: string;
    name: string;
    tier: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
    description?: string;
    razorpayMonthlyPlanId?: string;
    razorpayYearlyPlanId?: string;
    isActive: boolean;
    sortOrder: number;
}

async function fetchActivePlans(): Promise<CachedPlan[]> {
    await connectToDatabase();
    let plans = await Plan.find({ isActive: true, isVisible: true })
        .select('name tier monthlyPrice yearlyPrice hasAnalytics hasCustomDomain hasPrioritySupport hasTeamCollaboration hasWebhooks maxUsers maxStorageMb razorpayMonthlyPlanId razorpayYearlyPlanId sortOrder description')
        .sort({ sortOrder: 1, monthlyPrice: 1 })
        .lean() as any[];

    // Auto-seed default plans if DB is empty so registration always works
    if (plans.length === 0) {
        try {
            const defaultPlans = [
                {
                    name: 'Starter',
                    description: 'Perfect for creators just getting started.',
                    tier: 'starter',
                    billingPeriod: ['monthly', 'yearly'],
                    monthlyPrice: 99900,   // ₹999 in paise
                    yearlyPrice: 999900,   // ₹9,999 in paise (Save ~₹2k)
                    maxUsers: 1,
                    maxStorageMb: 1024,
                    maxAutoDms: 500,
                    maxApiCalls: 10000,
                    rateLimitPerMin: 10,
                    hasAnalytics: true,
                    hasPrioritySupport: false,
                    hasCustomDomain: false,
                    hasTeamCollaboration: false,
                    hasWebhooks: false,
                    features: [
                        { name: 'Digital Products', included: true },
                        { name: 'Basic Analytics', included: true },
                        { name: 'AutoDM (500/mo)', included: true },
                        { name: 'Custom Domain', included: false },
                    ],
                    isActive: true,
                    isVisible: true,
                    sortOrder: 1,
                },
                {
                    name: 'Pro',
                    description: 'Scale your influence with advanced tools.',
                    tier: 'pro',
                    billingPeriod: ['monthly', 'yearly'],
                    monthlyPrice: 199900,  // ₹1,999 in paise
                    yearlyPrice: 1999900,  // ₹19,999 in paise (Save ~₹4k)
                    maxUsers: 3,
                    maxStorageMb: 5120,
                    maxAutoDms: 2000,
                    maxApiCalls: 50000,
                    rateLimitPerMin: 30,
                    hasAnalytics: true,
                    hasPrioritySupport: true,
                    hasCustomDomain: true,
                    hasTeamCollaboration: false,
                    hasWebhooks: true,
                    features: [
                        { name: 'Unlimited Products', included: true },
                        { name: 'Advanced Analytics', included: true },
                        { name: 'AutoDM (2000/mo)', included: true },
                        { name: 'Custom Domain', included: true },
                        { name: 'Priority Support', included: true },
                        { name: 'Webhooks', included: true },
                    ],
                    isActive: true,
                    isVisible: true,
                    sortOrder: 2,
                },
            ];

            await Plan.insertMany(defaultPlans, { ordered: false });
            console.log('[plan-cache] Auto-seeded default plans');

            // Re-query after seeding
            plans = await Plan.find({ isActive: true, isVisible: true })
                .select('name tier monthlyPrice yearlyPrice hasAnalytics hasCustomDomain hasPrioritySupport hasTeamCollaboration hasWebhooks maxUsers maxStorageMb razorpayMonthlyPlanId razorpayYearlyPlanId sortOrder description')
                .sort({ sortOrder: 1, monthlyPrice: 1 })
                .lean() as any[];
        } catch (seedErr) {
            console.error('[plan-cache] Auto-seed failed:', seedErr);
        }
    }

    return plans.map(p => ({
        id: p._id.toString(),
        name: p.name,
        tier: p.tier,
        monthlyPrice: p.monthlyPrice,
        yearlyPrice: p.yearlyPrice,
        description: p.description,
        razorpayMonthlyPlanId: p.razorpayMonthlyPlanId,
        razorpayYearlyPlanId: p.razorpayYearlyPlanId,
        isActive: p.isActive,
        sortOrder: p.sortOrder || 0,
        features: [
            p.hasAnalytics && 'Advanced Analytics',
            p.hasCustomDomain && 'Custom Domain',
            p.hasPrioritySupport && 'Priority Support',
            p.hasTeamCollaboration && 'Team Collaboration',
            p.hasWebhooks && 'Webhooks',
            p.maxUsers > 1 && `Up to ${p.maxUsers} team members`,
            p.maxStorageMb && `${p.maxStorageMb >= 1024 ? `${p.maxStorageMb / 1024}GB` : `${p.maxStorageMb}MB`} storage`,
            p.maxAutoDms && `${p.maxAutoDms.toLocaleString('en-IN')} AutoDMs/mo`,
        ].filter(Boolean) as string[],
    }));
}


export const getCachedPlans = async () => {
    return await getCached('plans:all', 300, fetchActivePlans);
};

