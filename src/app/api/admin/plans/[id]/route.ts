import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Plan from '@/lib/models/Plan';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { logAdminAction } from '@/lib/admin/logger';
import { syncRazorpayPlan } from '@/lib/payments/razorpay';

/**
 * GET /api/admin/plans/[id]
 * Get a specific plan by ID
 */
async function getHandler(
    req: NextRequest,
    user: any,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await context.params;

        const plan = await Plan.findById(id);
        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, plan });
    } catch (error: any) {
        console.error('Plan fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/admin/plans/[id]
 * Update a plan
 */
async function putHandler(
    req: NextRequest,
    user: any,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await context.params;
        const body = await req.json();

        const plan = await Plan.findById(id);
        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        // 1. Handle Price Changes (Sync to Razorpay)
        // Note: Razorpay plans are immutable. If price changes, we create a new plan version.
        if (plan.tier !== 'free') {
            const monthlyPriceChanged = body.monthlyPrice !== undefined && body.monthlyPrice !== plan.monthlyPrice;
            const yearlyPriceChanged = body.yearlyPrice !== undefined && body.yearlyPrice !== plan.yearlyPrice;

            if (monthlyPriceChanged) {
                const monthlyRp = await syncRazorpayPlan({
                    name: body.name || plan.name,
                    description: body.description || plan.description,
                    amount: body.monthlyPrice,
                    interval: 'monthly'
                });
                body.razorpayMonthlyPlanId = monthlyRp.id;
                body.razorpayPlanId = monthlyRp.id; // Update legacy field too
            }

            if (yearlyPriceChanged) {
                const yearlyRp = await syncRazorpayPlan({
                    name: body.name || plan.name,
                    description: body.description || plan.description,
                    amount: body.yearlyPrice,
                    interval: 'yearly'
                });
                body.razorpayYearlyPlanId = yearlyRp.id;
            }
        }

        // Update plan fields
        Object.assign(plan, body);
        await plan.save();

        // Log action
        await logAdminAction(
            user.email,
            'UPDATE_PLAN',
            'plan',
            id,
            { updates: Object.keys(body) },
            req
        );

        return NextResponse.json({
            success: true,
            plan,
            message: 'Plan updated successfully'
        });
    } catch (error: any) {
        console.error('Plan update error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

/**
 * DELETE /api/admin/plans/[id]
 * Soft delete a plan (set isActive = false)
 */
async function deleteHandler(
    req: NextRequest,
    user: any,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await context.params;

        const plan = await Plan.findById(id);
        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        // Soft delete
        plan.isActive = false;
        await plan.save();

        // Log action
        await logAdminAction(
            user.email,
            'DELETE_PLAN',
            'plan',
            id,
            { name: plan.name },
            req
        );

        return NextResponse.json({
            success: true,
            message: 'Plan deactivated successfully'
        });
    } catch (error: any) {
        console.error('Plan delete error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withAdminAuth(getHandler);
export const PUT = withAdminAuth(putHandler);
export const DELETE = withAdminAuth(deleteHandler);
