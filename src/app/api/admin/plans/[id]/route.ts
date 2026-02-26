import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Plan from '@/lib/models/Plan';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { logAdminAction } from '@/lib/admin/logger';
import { syncRazorpayPlan } from '@/lib/payments/razorpay';
import { invalidateCache } from '@/lib/cache';
import { revalidatePath } from 'next/cache';

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

        // 1. Handle Price Changes (Sync to Razorpay with Rotation)
        if (plan.tier !== 'free') {
            const monthlyPriceChanged = body.monthlyPrice !== undefined && body.monthlyPrice !== plan.monthlyPrice;
            const yearlyPriceChanged = body.yearlyPrice !== undefined && body.yearlyPrice !== plan.yearlyPrice;

            if (monthlyPriceChanged || yearlyPriceChanged) {
                // Keep history of previous plans
                plan.razorpayPlanHistory = plan.razorpayPlanHistory || [];
                plan.razorpayPlanHistory.push({
                    razorpayPlanId: plan.razorpayMonthlyPlanId || plan.razorpayPlanId || '',
                    cycle: 'monthly',
                    price: plan.monthlyPrice,
                    createdAt: new Date(),
                    changedBy: user.email
                });

                if (plan.razorpayYearlyPlanId) {
                    plan.razorpayPlanHistory.push({
                        razorpayPlanId: plan.razorpayYearlyPlanId,
                        cycle: 'yearly',
                        price: plan.yearlyPrice,
                        createdAt: new Date(),
                        changedBy: user.email
                    });
                }

                const newMonthlyPrice = body.monthlyPrice ?? plan.monthlyPrice;
                const newYearlyPrice = body.yearlyPrice ?? plan.yearlyPrice;

                // Sync Monthly Plan
                if (newMonthlyPrice > 0) {
                    const monthlyRp = await syncRazorpayPlan({
                        name: body.name || plan.name,
                        description: body.description || plan.description,
                        amount: newMonthlyPrice,
                        interval: 'monthly'
                    });
                    body.razorpayMonthlyPlanId = monthlyRp.id;
                    body.razorpayPlanId = monthlyRp.id;
                } else {
                    body.razorpayMonthlyPlanId = undefined;
                    body.razorpayPlanId = undefined;
                }

                // Sync Yearly Plan
                if (newYearlyPrice > 0) {
                    const yearlyRp = await syncRazorpayPlan({
                        name: body.name || plan.name,
                        description: body.description || plan.description,
                        amount: newYearlyPrice,
                        interval: 'yearly'
                    });
                    body.razorpayYearlyPlanId = yearlyRp.id;
                } else {
                    body.razorpayYearlyPlanId = undefined;
                }
            }
        }

        // Update plan fields
        Object.assign(plan, body);
        await plan.save();
        await invalidateCache('plans:all');

        // Invalidate Pricing Cache (Multiple paths for safety)
        revalidatePath('/onboarding');
        revalidatePath('/pricing');
        revalidatePath('/dashboard/settings/billing');

        // Log action
        await logAdminAction(
            user.email,
            'UPDATE_PLAN',
            'plan',
            id,
            {
                updates: Object.keys(body),
                priceChanged: (body.monthlyPrice !== undefined || body.yearlyPrice !== undefined)
            },
            req
        );

        return NextResponse.json({
            success: true,
            plan,
            message: 'Plan updated successfully. New prices synced to Razorpay.'
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
        await invalidateCache('plans:all');

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
