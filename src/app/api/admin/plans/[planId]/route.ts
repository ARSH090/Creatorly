import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Plan from '@/lib/models/Plan';
import PlanChangeLog from '@/lib/models/PlanChangeLog';
import { User } from '@/lib/models/User';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { invalidatePlanCache } from '@/lib/planCache';
import { enforceDecreasedLimit, restoreAfterLimitIncrease } from '@/lib/enforcePlanLimits';

function flattenObject(obj: any, prefix = '') {
    const result: any = {};
    for (const key in obj) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            Object.assign(result, flattenObject(obj[key], newKey));
        } else {
            result[newKey] = obj[key];
        }
    }
    return result;
}

export const PATCH = withAdminAuth(async (req, user, context) => {
    try {
        const planId = context.params.planId;
        const body = await req.json();
        const adminId = user.id;
        const adminEmail = user.emailAddresses[0]?.emailAddress;

        await connectToDatabase();
        const plan = await Plan.findOne({ id: planId });
        if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

        if (planId === 'free' && (body.price !== undefined || body.razorpayPlanId !== undefined)) {
            return NextResponse.json({ error: 'Cannot edit price or Razorpay ID of the Free plan' }, { status: 400 });
        }

        const updates: any = {};
        const logEntries: any[] = [];

        // Handle Price specifically
        if (body.price !== undefined && body.price !== plan.price) {
            updates.previousPrice = plan.price;
            updates.priceChangedAt = new Date();
            updates.price = body.price;

            const affectedCount = await User.countDocuments({
                subscriptionTier: planId,
                subscriptionStatus: 'active'
            });

            logEntries.push({
                planId,
                changedBy: adminId,
                changedByEmail: adminEmail,
                changeType: 'price_changed',
                fieldChanged: 'price',
                previousValue: plan.price,
                newValue: body.price,
                affectedSubscriberCount: affectedCount,
                note: body.note || '',
            });
        }

        // Handle Limits
        if (body.limits) {
            const affectedCount = await User.countDocuments({
                subscriptionTier: planId,
                subscriptionStatus: 'active'
            });

            for (const [key, newValue] of Object.entries(body.limits)) {
                const prevValue = (plan.limits as any)[key];
                if (prevValue !== newValue) {
                    logEntries.push({
                        planId,
                        changedBy: adminId,
                        changedByEmail: adminEmail,
                        changeType: newValue === true || newValue === false ? 'feature_toggled' : 'limit_changed',
                        fieldChanged: `limits.${key}`,
                        previousValue: prevValue,
                        newValue: newValue,
                        affectedSubscriberCount: affectedCount,
                        note: body.note || '',
                    });

                    // Enforce if numeric limit decreased
                    if (typeof newValue === 'number' && typeof prevValue === 'number') {
                        if (newValue < prevValue && newValue !== -1) {
                            // Fire and forget enforcement
                            enforceDecreasedLimit(planId, key, newValue).catch(console.error);
                        } else if (newValue > prevValue || newValue === -1) {
                            restoreAfterLimitIncrease(planId, key).catch(console.error);
                        }
                    }
                }
            }
            updates.limits = { ...plan.limits, ...body.limits };
        }

        // Handle other simple fields
        const simpleFields = ['name', 'description', 'badge', 'isHighlighted', 'displayOrder', 'features', 'razorpayPlanId'];
        for (const field of simpleFields) {
            if (body[field] !== undefined && JSON.stringify(body[field]) !== JSON.stringify((plan as any)[field])) {
                logEntries.push({
                    planId,
                    changedBy: adminId,
                    changedByEmail: adminEmail,
                    changeType: field === 'razorpayPlanId' ? 'razorpay_linked' : `${field}_changed`,
                    fieldChanged: field,
                    previousValue: (plan as any)[field],
                    newValue: body[field],
                    note: body.note || '',
                });
                updates[field] = body[field];
            }
        }

        if (logEntries.length > 0) {
            await PlanChangeLog.insertMany(logEntries);
            const flattened = flattenObject(updates);
            const updatedPlan = await Plan.findOneAndUpdate(
                { id: planId },
                { $set: flattened },
                { new: true }
            );
            await invalidatePlanCache(planId);
            return NextResponse.json({ success: true, plan: updatedPlan });
        }

        return NextResponse.json({ message: 'No changes detected' });
    } catch (error: any) {
        console.error('Plan Update Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

export const POST = withAdminAuth(async (req, user, context) => {
    try {
        const planId = context.params.planId;
        const { action } = await req.json();
        const adminId = user.id;
        const adminEmail = user.emailAddresses[0]?.emailAddress;

        await connectToDatabase();
        const plan = await Plan.findOne({ id: planId });
        if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

        if (action === 'toggle') {
            if (planId === 'free') return NextResponse.json({ error: 'Cannot disable Free plan' }, { status: 400 });
            const newStatus = !plan.isActive;
            await Plan.updateOne({ id: planId }, { isActive: newStatus });

            const activeCount = await User.countDocuments({ subscriptionTier: planId, subscriptionStatus: 'active' });
            await PlanChangeLog.create({
                planId,
                changedBy: adminId,
                changedByEmail: adminEmail,
                changeType: newStatus ? 'plan_enabled' : 'plan_disabled',
                previousValue: plan.isActive,
                newValue: newStatus,
                affectedSubscriberCount: activeCount,
            });

            await invalidatePlanCache(planId);
            return NextResponse.json({ success: true, isActive: newStatus });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
