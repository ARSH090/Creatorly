import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Announcement from '@/lib/models/Announcement';
import { withAdminAuth } from '@/lib/auth/withAuth';
import AuditLog from '@/lib/models/AuditLog';
import { successResponse, errorResponse } from '@/types/api';

// GET /api/admin/announcements
export const GET = withAdminAuth(async (req: NextRequest, user: any) => {
    try {
        await connectToDatabase();
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        return NextResponse.json(successResponse(announcements));
    } catch (error: any) {
        console.error('Admin Fetch Announcements Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch announcements', error.message), { status: 500 });
    }
});

// POST /api/admin/announcements
export const POST = withAdminAuth(async (req: NextRequest, user: any) => {
    try {
        const body = await req.json();
        await connectToDatabase();

        const announcement = await Announcement.create({
            ...body,
            createdBy: user.email || user._id?.toString() || 'admin'
        });

        await AuditLog.create({
            adminId: user._id,
            action: 'CREATE_ANNOUNCEMENT',
            entityType: 'announcement',
            entityId: announcement._id,
            details: { title: announcement.title },
            ipAddress: req.headers.get('x-forwarded-for') || 'local'
        });

        return NextResponse.json(successResponse(announcement, 'Announcement created successfully'), { status: 201 });
    } catch (error: any) {
        console.error('Admin Create Announcement Error:', error);
        return NextResponse.json(errorResponse('Failed to create announcement', error.message), { status: 500 });
    }
});
