import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Announcement from '@/lib/models/Announcement';
import { withAdminAuth } from '@/lib/auth/withAuth';
import AuditLog from '@/lib/models/AuditLog';

// GET /api/admin/announcements
export const GET = withAdminAuth(async () => {
    try {
        await connectToDatabase();
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        return NextResponse.json({ announcements });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

// POST /api/admin/announcements
export const POST = withAdminAuth(async (req, user) => {
    try {
        const body = await req.json();
        await connectToDatabase();

        const announcement = await Announcement.create({
            ...body,
            createdBy: user.emailAddresses[0]?.emailAddress || user.id
        });

        await AuditLog.create({
            adminId: user.id,
            action: 'CREATE_ANNOUNCEMENT',
            entityType: 'announcement',
            entityId: announcement._id,
            details: { title: announcement.title },
            ipAddress: req.headers.get('x-forwarded-for') || 'local'
        });

        return NextResponse.json({ success: true, announcement });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
