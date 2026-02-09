import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { User } from '@/lib/models/User';
import { Plan } from '@/lib/models/Plan';
import { PlanTier } from '@/lib/models/plan.types';
// Note: In a real app, you'd have utility functions for these checks.
// These are placeholders for the logic requested.

export async function enforceFreeTierLimits(userId: string) {
    // Cast to any to avoid production build type errors with missing schema fields
    const user = await User.findById(userId).populate('activeSubscription') as any;
    if (!user || !user.activeSubscription) return { allowed: true };

    const plan = await Plan.findById(user.activeSubscription.planId);
    if (!plan || plan.tier !== PlanTier.FREE) return { allowed: true };

    // 1. API Rate Limiting (Simulated)
    // In production, use Redis to track today's API calls
    const todayApiCalls = 0; // await getTodayAPICalls(userId);
    if (todayApiCalls >= plan.maxApiCalls) {
        return { allowed: false, error: 'Free tier API limit reached', code: 429 };
    }

    // 2. Storage Limit (Simulated)
    const storageUsed = 0; // await getStorageUsed(userId);
    if (storageUsed > plan.maxStorageMb * 1024 * 1024) {
        return { allowed: false, error: 'Storage limit exceeded', code: 403 };
    }

    // 3. Team Member Limit
    if ((user as any).teamMembers && (user as any).teamMembers.length > plan.maxUsers - 1) {
        return { allowed: false, error: 'Free tier supports only 1 user', code: 403 };
    }

    return { allowed: true };
}

export async function validatePriceChange(oldPlan: any, newPlan: any, activeSubCount: number) {
    if (oldPlan.tier === PlanTier.FREE && newPlan.tier !== PlanTier.FREE) {
        throw new Error('Cannot convert free plan to paid');
    }

    if (activeSubCount > 0) {
        // Price increase protection (max 10% increase if there are active subscribers)
        if (newPlan.monthlyPrice > oldPlan.monthlyPrice * 1.1) {
            throw new Error('Price increase limited to 10% for plans with active subscribers. Notify users 30 days in advance.');
        }

        // Feature removal protection
        const criticalFeatures: Array<keyof any> = [
            'hasAnalytics', 'hasPrioritySupport', 'hasCustomDomain', 'hasTeamCollaboration', 'hasWebhooks'
        ];

        for (const feature of criticalFeatures) {
            if (oldPlan[feature] === true && newPlan[feature] === false) {
                throw new Error(`Cannot remove feature ${String(feature)} from a plan with active subscribers.`);
            }
        }

        // Limit reduction protection
        if (newPlan.maxStorageMb < oldPlan.maxStorageMb || newPlan.maxApiCalls < oldPlan.maxApiCalls) {
            throw new Error('Cannot reduce limits for a plan with active subscribers.');
        }
    }
}
