import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Lead from '@/lib/models/Lead';
import AdminLog from '@/lib/models/AdminLog';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { checkAdminPermission } from '@/lib/middleware/adminAuth';

export const POST = withAdminAuth(async (req: NextRequest, session: any) => {
    try {
        if (!checkAdminPermission('delete_leads', session.role)) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const { leadIds } = await req.json();

        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            return NextResponse.json({ error: 'Invalid lead IDs' }, { status: 400 });
        }

        await connectToDatabase();

        const result = await Lead.deleteMany({ _id: { $in: leadIds } });

        // Log the action
        await AdminLog.create({
            adminEmail: session.email || session.user?.email,
            action: 'bulk_delete_leads',
            targetType: 'lead',
            changes: { leadIds, deletedCount: result.deletedCount },
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown'
        });

        return NextResponse.json({
            success: true,
            deletedCount: result.deletedCount
        });

    } catch (error: any) {
        console.error('Bulk Lead Delete Error:', error);
        return NextResponse.json(
            { error: 'Failed to delete leads' },
            { status: 500 }
        );
    }
});
