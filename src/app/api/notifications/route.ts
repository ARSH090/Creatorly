import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { NotificationService } from '@/lib/services/notification';

/**
 * GET /api/notifications - Get unread notifications for current user
 * PATCH /api/notifications - Mark all as read
 */
async function handler(req: NextRequest, user: any) {
    if (req.method === 'GET') {
        const notifications = await NotificationService.getUnread(user._id);
        return NextResponse.json(notifications);
    }

    if (req.method === 'PATCH') {
        const body = await req.json();
        if (body.id) {
            await NotificationService.markAsRead(body.id);
        } else {
            await NotificationService.markAllAsRead(user._id);
        }
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export const GET = withAuth(handler);
export const PATCH = withAuth(handler);
