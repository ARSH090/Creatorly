import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import Subscription from '@/lib/models/Subscription';
import Plan from '@/lib/models/Plan';
import mongoose from 'mongoose';

async function handler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const creatorId = user._id;

        // 1. Fetch all active subscriptions for this creator
        // Note: In our current model, subscriptions might be platform-level (creator to platform)
        // or product-level (customer to creator). 
        // For Creator Analytics, we focus on customers subscribing to the creator's products.
        const activeSubscriptions = await Subscription.find({
            creatorId: creatorId,
            status: 'active'
        }).populate('planId');

        // 2. Calculate MRR
        let totalMRR = 0;
        const planBreakdown: Record<string, { name: string, mrr: number, count: number }> = {};

        activeSubscriptions.forEach(sub => {
            const plan = sub.planId as any;
            if (!plan) return;

            const amount = plan.price || 0;
            // Standardize to monthly if billing cycle is different
            let monthlyAmount = amount;
            if (plan.billingCycle === 'yearly') monthlyAmount = amount / 12;
            else if (plan.billingCycle === 'weekly') monthlyAmount = amount * 4;

            totalMRR += monthlyAmount;

            if (!planBreakdown[plan._id.toString()]) {
                planBreakdown[plan._id.toString()] = {
                    name: plan.name,
                    mrr: 0,
                    count: 0
                };
            }
            planBreakdown[plan._id.toString()].mrr += monthlyAmount;
            planBreakdown[plan._id.toString()].count += 1;
        });

        // 3. Fetch Growth (New subs in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newSubscriptions = await Subscription.countDocuments({
            creatorId,
            status: 'active',
            createdAt: { $gte: thirtyDaysAgo }
        });

        // 4. Fetch Churn (Cancelled in last 30 days)
        const churnedSubscriptions = await Subscription.countDocuments({
            creatorId,
            status: 'cancelled',
            updatedAt: { $gte: thirtyDaysAgo }
        });

        return NextResponse.json({
            totalMRR: Math.round(totalMRR * 100) / 100,
            activeSubscribers: activeSubscriptions.length,
            newSubscribers30d: newSubscriptions,
            churnedSubscribers30d: churnedSubscriptions,
            planBreakdown: Object.values(planBreakdown),
            growthRate: activeSubscriptions.length > 0
                ? Math.round(((newSubscriptions - churnedSubscriptions) / (activeSubscriptions.length || 1)) * 100)
                : 0
        });

    } catch (error) {
        console.error('[MRR Analytics] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export const GET = withCreatorAuth(handler);
