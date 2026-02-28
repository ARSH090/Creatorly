import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Announcement from '@/lib/models/Announcement';
import { withAdminAuth } from '@/lib/auth/withAuth';
import AuditLog from '@/lib/models/AuditLog';

// PATCH /api/admin/announcements/[id]
export const PATCH = withAdminAuth(async (req, user, context) => {
    try {
        const { id } = context.params;
        const body = await req.json();
        await connectToDatabase();

        const announcement = await Announcement.findByIdAndUpdate(id, body, { new: true });

        await AuditLog.create({
            adminId: user.id,
            action: 'UPDATE_ANNOUNCEMENT',
            entityType: 'announcement',
            entityId: id,
            details: { body },
            ipAddress: req.headers.get('x-forwarded-for') || 'local'
        });

        return NextResponse.json({ success: true, announcement });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

// DELETE /api/admin/announcements/[id]
export const DELETE = withAdminAuth(async (req, user, context) => {
    try {
        const { id } = context.params;
        await connectToDatabase();

        await Announcement.findByIdAndDelete(id);

        await AuditLog.create({
            adminId: user.id,
            action: 'DELETE_ANNOUNCEMENT',
            entityType: 'announcement',
            entityId: id,
            ipAddress: req.headers.get('x-forwarded-for') || 'local'
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
