import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Plan } from '@/lib/models/Plan';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/plans
 * Returns a list of all active subscription plans
 */
async function handler(req: NextRequest) {
    await connectToDatabase();

    const plans = await Plan.find({
        isActive: true,
        isVisible: true
    })
        .sort({ sortOrder: 1, monthlyPrice: 1 })
        .lean();

    return NextResponse.json({
        plans: plans.map(plan => ({
            id: plan._id,
            name: plan.name,
            description: plan.description,
            tier: plan.tier,
            monthlyPrice: plan.monthlyPrice,
            yearlyPrice: plan.yearlyPrice,
            features: [
                plan.hasAnalytics && 'Advanced Analytics',
                plan.hasCustomDomain && 'Custom Domains',
                plan.hasPrioritySupport && 'Priority Support',
                plan.hasTeamCollaboration && 'Team Collaboration',
                plan.hasWebhooks && 'Webhooks',
                `Up to ${plan.maxUsers} Users`,
                `Up to ${plan.maxStorageMb}MB Storage`,
            ].filter(Boolean),
            interval: plan.billingPeriod[0] // Primary interval
        }))
    });
}

export const GET = withErrorHandler(handler);
