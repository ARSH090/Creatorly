import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Payout from '@/lib/models/Payout';
import { withAdminAuth } from '@/lib/firebase/withAuth';
import { logAdminAction } from '@/lib/admin/logger';

/**
 * POST /api/admin/payouts/:id/approve
 * Approve payout request
 */
async function approveHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const payoutId = params.id;

    const body = await req.json();
    const { notes } = body;

    const payout = await Payout.findById(payoutId);
    if (!payout) {
        return NextResponse.json(
            { success: false, error: 'Payout not found' },
            { status: 404 }
        );
    }

    if (payout.status !== 'pending') {
        return NextResponse.json(
            { success: false, error: 'Payout is not pending' },
            { status: 400 }
        );
    }

    payout.status = 'approved';
    payout.processedBy = user.email;
    payout.processedAt = new Date();
    if (notes) payout.notes = notes;

    await payout.save();

    // Log action
    await logAdminAction(
        user.email,
        'APPROVE_PAYOUT',
        'payout',
        payoutId,
        { amount: payout.amount, creatorId: payout.creatorId },
        req
    );

    return NextResponse.json({
        success: true,
        data: { payout },
        message: 'Payout approved successfully'
    });
}

/**
 * POST /api/admin/payouts/:id/reject
 * Reject payout request
 */
async function rejectHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const payoutId = params.id;

    const body = await req.json();
    const { reason } = body;

    if (!reason) {
        return NextResponse.json(
            { success: false, error: 'Rejection reason is required' },
            { status: 400 }
        );
    }

    const payout = await Payout.findById(payoutId);
    if (!payout) {
        return NextResponse.json(
            { success: false, error: 'Payout not found' },
            { status: 404 }
        );
    }

    payout.status = 'rejected';
    payout.processedBy = user.email;
    payout.processedAt = new Date();
    payout.rejectionReason = reason;

    await payout.save();

    // Log action
    await logAdminAction(
        user.email,
        'REJECT_PAYOUT',
        'payout',
        payoutId,
        { reason, amount: payout.amount },
        req
    );

    return NextResponse.json({
        success: true,
        data: { payout },
        message: 'Payout rejected successfully'
    });
}

/**
 * POST /api/admin/payouts/:id/process
 * Mark payout as paid
 */
async function processHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const payoutId = params.id;

    const body = await req.json();
    const { transactionId } = body;

    if (!transactionId) {
        return NextResponse.json(
            { success: false, error: 'Transaction ID is required' },
            { status: 400 }
        );
    }

    const payout = await Payout.findById(payoutId);
    if (!payout) {
        return NextResponse.json(
            { success: false, error: 'Payout not found' },
            { status: 404 }
        );
    }

    payout.status = 'paid';
    payout.transactionId = transactionId;
    payout.processedBy = user.email;
    payout.processedAt = new Date();

    await payout.save();

    // Log action
    await logAdminAction(
        user.email,
        'PROCESS_PAYOUT',
        'payout',
        payoutId,
        { transactionId, amount: payout.amount },
        req
    );

    return NextResponse.json({
        success: true,
        data: { payout },
        message: 'Payout marked as paid successfully'
    });
}

export const POST = withAdminAuth(async (req, user, context) => {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'approve') return approveHandler(req, user, context);
    if (action === 'reject') return rejectHandler(req, user, context);
    if (action === 'process') return processHandler(req, user, context);

    return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
    );
});
