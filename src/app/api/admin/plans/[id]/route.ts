import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import Plan from '@/lib/models/Plan';
import { Subscription } from '@/lib/models/Subscription';
import { authOptions } from '@/lib/auth';
import { validatePriceChange } from '@/lib/middleware/subscriptionMiddleware';

async function checkAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin' && (session.user as any).role !== 'super-admin') {
        return false;
    }
    return true;
}

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        if (!await checkAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const { id } = await context.params;
        const plan = await Plan.findById(id);
        if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

        return NextResponse.json({ plan });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        if (!await checkAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const body = await req.json();
        const { id } = await context.params;
        const oldPlan = await Plan.findById(id);
        if (!oldPlan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

        // Check for active subscribers to enforce price/feature protection
        const activeSubCount = await Subscription.countDocuments({ planId: id, status: 'active' });

        try {
            await validatePriceChange(oldPlan, body, activeSubCount);
        } catch (validationError: any) {
            return NextResponse.json({ error: validationError.message }, { status: 400 });
        }

        const updatedPlan = await Plan.findByIdAndUpdate(id, body, { new: true, runValidators: true });
        return NextResponse.json({ success: true, plan: updatedPlan });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        if (!await checkAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        // Check if there are ANY subscribers (even canceled ones) for data integrity
        const { id } = await context.params;
        const subCount = await Subscription.countDocuments({ planId: id });
        if (subCount > 0) {
            // Logic for archiving instead of deleting
            await Plan.findByIdAndUpdate(id, { isActive: false, isVisible: false });
            return NextResponse.json({ message: 'Plan archived because it has associated subscriptions.' });
        }

        await Plan.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Plan deleted successfully.' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
