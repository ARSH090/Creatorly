import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Payout } from '@/lib/models/Payout';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { auditLog } from '@/lib/utils/auditLogger';

// PATCH /api/admin/withdrawals/[id]
export const PATCH = withAdminAuth(async (req, admin, context) => {
    try {
        const { id } = context.params;
        const body = await req.json();
        await connectToDatabase();

        const payout = await Payout.findById(id);
        if (!payout) return NextResponse.json({ error: 'Payout request not found' }, { status: 404 });

        const previousStatus = payout.status;

        // Update status and details
        if (body.status) payout.status = body.status;
        if (body.notes) payout.notes = body.notes;
        if (body.rejectionReason) payout.rejectionReason = body.rejectionReason;

        if (body.status === 'processed' || body.status === 'paid') {
            payout.processedAt = new Date();
            payout.processedBy = admin.id;
        }

        await payout.save();

        await auditLog({
            userId: admin.id,
            action: body.status === 'approved' ? 'APPROVE_PAYOUT' :
                body.status === 'rejected' ? 'REJECT_PAYOUT' :
                    body.status === 'paid' ? 'MARK_PAYOUT_PAID' : 'UPDATE_PAYOUT',
            resourceType: 'withdrawal',
            resourceId: id as string,
            metadata: { body },
            req
        });

        return NextResponse.json({ success: true, payout });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
