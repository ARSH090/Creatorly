import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Plan } from '@/lib/models/Plan';
import { PlanTier, BillingPeriod } from '@/lib/models/plan.types';
import { withAdminAuth } from '@/lib/auth/withAuth';

const plansData = [
    {
        name: 'Starter',
        description: 'Perfect for new creators getting started.',
        tier: PlanTier.STARTER,
        billingPeriod: [BillingPeriod.MONTHLY, BillingPeriod.YEARLY],
        monthlyPrice: 99900,
        yearlyPrice: 999900,
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
        sortOrder: 1,
        razorpayMonthlyPlanId: 'plan_starter_monthly',
        razorpayYearlyPlanId: 'plan_starter_yearly',
        features: [
            { name: 'Digital Products', included: true, value: '2' },
            { name: 'Transaction Fee', included: true, value: '5%' },
            { name: 'Basic Analytics', included: true },
            { name: 'Custom Domain', included: false }
        ],
        limits: {
            maxProducts: 2,
            maxStorageMb: 1024,
            maxTeamMembers: 1,
            maxAiGenerations: 5,
            customDomain: false,
            canRemoveBranding: false
        },
        trialLimits: {
            maxProducts: 2,
            maxStorageMb: 1024,
            maxTeamMembers: 1,
            maxAiGenerations: 5,
            customDomain: false,
            canRemoveBranding: false
        }
    },
    {
        name: 'Pro',
        description: 'Scale your influence with advanced tools.',
        tier: PlanTier.PRO,
        billingPeriod: [BillingPeriod.MONTHLY, BillingPeriod.YEARLY],
        monthlyPrice: 199900,
        yearlyPrice: 1999900,
        maxUsers: 1,
        maxStorageMb: 5120,
        maxAutoDms: 2000,
        maxApiCalls: 50000,
        rateLimitPerMin: 30,
        hasAnalytics: true,
        hasPrioritySupport: true,
        hasCustomDomain: true,
        hasTeamCollaboration: false,
        hasWebhooks: true,
        sortOrder: 2,
        razorpayMonthlyPlanId: 'plan_pro_monthly',
        razorpayYearlyPlanId: 'plan_pro_yearly',
        features: [
            { name: 'All Starter features', included: true },
            { name: 'Digital Products', included: true, value: 'Unlimited' },
            { name: 'Transaction Fee', included: true, value: '1%' },
            { name: 'Custom Domain', included: true },
            { name: 'Advanced Analytics', included: true }
        ],
        limits: {
            maxProducts: 999,
            maxStorageMb: 5120,
            maxTeamMembers: 1,
            maxAiGenerations: 50,
            customDomain: true,
            canRemoveBranding: true
        },
        trialLimits: {
            maxProducts: 5,
            maxStorageMb: 2048,
            maxTeamMembers: 1,
            maxAiGenerations: 10,
            customDomain: true,
            canRemoveBranding: true
        }
    },
    {
        name: 'Business',
        description: 'For established brands and agencies.',
        tier: PlanTier.BUSINESS,
        billingPeriod: [BillingPeriod.MONTHLY, BillingPeriod.YEARLY],
        monthlyPrice: 399900,
        yearlyPrice: 3999900,
        maxUsers: 5,
        maxStorageMb: 51200,
        maxAutoDms: 10000,
        maxApiCalls: 250000,
        rateLimitPerMin: 100,
        hasAnalytics: true,
        hasPrioritySupport: true,
        hasCustomDomain: true,
        hasTeamCollaboration: true,
        hasWebhooks: true,
        sortOrder: 3,
        razorpayMonthlyPlanId: 'plan_biz_monthly',
        razorpayYearlyPlanId: 'plan_biz_yearly',
        features: [
            { name: 'All Pro features', included: true },
            { name: 'Team Members', included: true, value: 'Up to 5' },
            { name: 'White-labeling', included: true },
            { name: 'Priority Support', included: true },
            { name: 'API Access', included: true }
        ],
        limits: {
            maxProducts: 999,
            maxStorageMb: 51200,
            maxTeamMembers: 5,
            maxAiGenerations: 500,
            customDomain: true,
            canRemoveBranding: true
        },
        trialLimits: {
            maxProducts: 10,
            maxStorageMb: 10240,
            maxTeamMembers: 3,
            maxAiGenerations: 50,
            customDomain: true,
            canRemoveBranding: true
        }
    }
];

async function seedPlansHandler(req: NextRequest, admin: any) {
    // SECURITY: Prevent accidental execution in production without explicit confirmation
    if (process.env.NODE_ENV === 'production') {
        const confirm = req.headers.get('x-admin-confirm');
        if (confirm !== 'seed-plans-confirmed') {
            return NextResponse.json({
                error: 'In production, set header x-admin-confirm: seed-plans-confirmed to proceed.'
            }, { status: 403 });
        }
    }

    try {
        await connectToDatabase();

        console.log(`[Seed Plans] Triggered by admin: ${admin.email}`);

        const results = [];
        for (const plan of plansData) {
            const updated = await Plan.findOneAndUpdate(
                { tier: plan.tier },
                plan,
                { upsert: true, new: true }
            );
            results.push({ tier: plan.tier, id: updated._id });
        }

        return NextResponse.json({ success: true, message: 'Plans seeded successfully.', results });
    } catch (error: any) {
        console.error('Error seeding plans via API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withAdminAuth(seedPlansHandler);
