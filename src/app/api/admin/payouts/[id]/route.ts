import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Payout from '@/lib/models/Payout';
import AdminLog from '@/lib/models/AdminLog';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { checkAdminPermission } from '@/lib/middleware/adminAuth';

export const PUT = withAdminAuth(async (req: NextRequest, session: any, context: { params: Promise<{ id: string }> }) => {
    try {
        if (!checkAdminPermission('manage_payouts', session.role)) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const { id } = await context.params;
        const body = await req.json(); // { status: 'paid' | 'rejected', notes: string, transactionId?: string }

        await connectToDatabase();

        const payout = await Payout.findById(id);
        if (!payout) {
            return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
        }

        const oldStatus = payout.status;
        payout.status = body.status;

        if (body.status === 'paid' || body.status === 'processed') {
            payout.processedAt = new Date();
            if (body.transactionId) payout.transactionId = body.transactionId;
        }

        if (body.notes) payout.notes = body.notes;
        if (body.rejectionReason) payout.rejectionReason = body.rejectionReason;

        await payout.save();

        await AdminLog.create({
            adminEmail: session.email || session.user?.email,
            action: 'update_payout_status',
            targetType: 'payout',
            targetId: payout._id,
            changes: { from: oldStatus, to: body.status, notes: body.notes },
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown'
        });

        return NextResponse.json(payout);

    } catch (error: any) {
        console.error('Update Payout Error:', error);
        return NextResponse.json(
            { error: 'Failed to update payout' },
            { status: 500 }
        );
    }
});
