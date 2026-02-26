import { NextRequest, NextResponse } from 'next/server';

/**
 * Stan Store Plan Limits Configuration
 * Defines feature access and limits for each subscription tier
 */
export const PLAN_LIMITS = {
    free: {
        products: 2,
        dmsPerMonth: 0,
        affiliates: false,
        customDomain: false,
        transactionFee: 0.10, // 10%
        analytics: 'basic',
        emailMarketing: false,
        upsells: false,
        discountCodes: false,
        paymentPlans: false,
        maxStorageMb: 100,
        maxTeamMembers: 1,
        maxAiGenerations: 5
    },
    creator: {
        products: Infinity,
        dmsPerMonth: 500,
        affiliates: false,
        customDomain: false,
        transactionFee: 0.05, // 5%
        analytics: 'advanced',
        emailMarketing: false,
        upsells: false,
        discountCodes: false,
        paymentPlans: false,
        maxStorageMb: 1024, // 1GB
        maxTeamMembers: 3,
        maxAiGenerations: 50
    },
    creator_pro: {
        products: Infinity,
        dmsPerMonth: 5000,
        affiliates: true,
        customDomain: true,
        transactionFee: 0, // 0%
        analytics: 'full',
        emailMarketing: true,
        upsells: true,
        discountCodes: true,
        paymentPlans: true,
        maxStorageMb: 10240, // 10GB
        maxTeamMembers: 10,
        maxAiGenerations: 500
    }
} as const;

// New IUser.subscriptionTier naming → mapped to PLAN_LIMITS keys
const TIER_ALIAS: Record<string, keyof typeof PLAN_LIMITS> = {
    'free': 'free',
    'starter': 'creator',
    'pro': 'creator_pro',
    'business': 'creator_pro', // Business has same feature set, higher limits can be added later
    // Legacy keys pass through as-is
    'creator': 'creator',
    'creator_pro': 'creator_pro',
};

export type PlanType = keyof typeof PLAN_LIMITS | 'starter' | 'pro' | 'business';
export type LimitType = keyof typeof PLAN_LIMITS['free'];

/**
 * Get plan limits for a specific plan
 */
export function getPlanLimits(plan: PlanType | string) {
    const resolvedKey = TIER_ALIAS[plan as string] ?? 'free';
    return PLAN_LIMITS[resolvedKey];
}

/**
 * Check if a feature is available for a given plan
 */
export function hasFeature(plan: PlanType | string, feature: LimitType): boolean {
    const limits = getPlanLimits(plan);
    return !!limits[feature];
}

/**
 * Middleware to check plan limits before operations
 * Usage: checkPlanLimit('products')
 */
export function checkPlanLimit(limitType: LimitType) {
    return async (user: any, currentCount: number): Promise<{ allowed: boolean; error?: any }> => {
        const plan = (user.plan || 'free') as PlanType;
        const limits = getPlanLimits(plan);
        const limit = limits[limitType];

        // Handle boolean features (affiliates, customDomain, etc.)
        if (typeof limit === 'boolean') {
            if (!limit) {
                return {
                    allowed: false,
                    error: {
                        code: 'FEATURE_NOT_AVAILABLE',
                        message: `This feature requires ${limitType === 'affiliates' ? 'Creator Pro' : 'an upgraded'} plan`,
                        current: plan,
                        required: 'creator_pro',
                        upgradeUrl: '/dashboard/billing'
                    }
                };
            }
            return { allowed: true };
        }

        // Handle numeric limits (products, dmsPerMonth, etc.)
        if (typeof limit === 'number' && limit !== Infinity) {
            if (currentCount >= limit) {
                return {
                    allowed: false,
                    error: {
                        code: 'LIMIT_REACHED',
                        message: `You have reached your plan limit of ${limit} ${limitType}`,
                        current: currentCount,
                        limit,
                        upgradeUrl: '/dashboard/billing'
                    }
                };
            }
        }

        return { allowed: true };
    };
}

/**
 * Calculate transaction fee for a plan
 */
export function calculateTransactionFee(plan: PlanType, amount: number): number {
    const limits = getPlanLimits(plan);
    return amount * limits.transactionFee;
}

/**
 * Check if plan has expired
 */
export function isPlanExpired(planExpiresAt?: Date): boolean {
    if (!planExpiresAt) return false;
    return new Date(planExpiresAt) < new Date();
}

/**
 * Get upgrade benefits message
 */
export function getUpgradeBenefits(fromPlan: PlanType, toPlan: PlanType): string[] {
    const fromLimits = getPlanLimits(fromPlan);
    const toLimits = getPlanLimits(toPlan);
    const benefits: string[] = [];

    if (toLimits.transactionFee < fromLimits.transactionFee) {
        benefits.push(`Lower transaction fees: ${toLimits.transactionFee * 100}% (from ${fromLimits.transactionFee * 100}%)`);
    }
    if (toLimits.affiliates && !fromLimits.affiliates) {
        benefits.push('Affiliate program access');
    }
    if (toLimits.customDomain && !fromLimits.customDomain) {
        benefits.push('Custom domain support');
    }
    if (toLimits.emailMarketing && !fromLimits.emailMarketing) {
        benefits.push('Email marketing campaigns');
    }
    if (toLimits.upsells && !fromLimits.upsells) {
        benefits.push('Product upsells');
    }
    if (toLimits.discountCodes && !fromLimits.discountCodes) {
        benefits.push('Discount codes');
    }

    return benefits;
}
