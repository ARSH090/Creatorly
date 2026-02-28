import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { withAdminAuth } from '@/lib/auth/withAuth';
import AuditLog from '@/lib/models/AuditLog';

// PATCH /api/admin/stores/[id]
export const PATCH = withAdminAuth(async (req, admin, context) => {
    try {
        const { id } = context.params;
        const body = await req.json();
        await connectToDatabase();

        const user = await User.findById(id);
        if (!user) return NextResponse.json({ error: 'Store (User) not found' }, { status: 404 });

        const previousStatus = user.storeStatus;

        // Update fields
        if (body.storeStatus) user.storeStatus = body.storeStatus;
        if (body.storeSuspensionReason !== undefined) user.storeSuspensionReason = body.storeSuspensionReason;
        if (body.adminNotes !== undefined) user.adminNotes = body.adminNotes;
        if (body.role) user.role = body.role;

        await user.save();

        await AuditLog.create({
            adminId: admin.id,
            action: body.storeStatus === 'suspended' && previousStatus !== 'suspended' ? 'SUSPEND_STORE' :
                body.storeStatus === 'active' && previousStatus === 'suspended' ? 'RESTORE_STORE' : 'UPDATE_STORE',
            entityType: 'store',
            entityId: user._id,
            details: { body },
            ipAddress: req.headers.get('x-forwarded-for') || 'local'
        });

        return NextResponse.json({ success: true, store: user });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

// DELETE /api/admin/stores/[id]
export const DELETE = withAdminAuth(async (req, admin, context) => {
    try {
        const { id } = context.params;
        await connectToDatabase();

        const user = await User.findById(id);
        if (!user) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

        // Permanent deletion or soft delete? 
        // In this platform, we usually archive or ban
        user.status = 'suspended';
        user.storeStatus = 'suspended';
        user.deletedAt = new Date();
        await user.save();

        await AuditLog.create({
            adminId: admin.id,
            action: 'DELETE_STORE',
            entityType: 'store',
            entityId: id,
            ipAddress: req.headers.get('x-forwarded-for') || 'local'
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
