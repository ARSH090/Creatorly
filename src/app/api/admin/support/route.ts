import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import SupportTicket from '@/lib/models/SupportTicket';
import SupportMessage from '@/lib/models/SupportMessage';
import { withAdminAuth } from '@/lib/auth/withAuth';
import AuditLog from '@/lib/models/AuditLog';

// GET /api/admin/support (List Tickets)
export const GET = withAdminAuth(async (req) => {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const status = searchParams.get('status');

        await connectToDatabase();

        const query: any = {};
        if (status && status !== 'all') query.status = status;

        const [tickets, total] = await Promise.all([
            SupportTicket.find(query)
                .sort({ updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('userId', 'displayName email storeSlug')
                .lean(),
            SupportTicket.countDocuments(query)
        ]);

        return NextResponse.json({
            tickets,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

// POST /api/admin/support (Create System Ticket/Notice)
export const POST = withAdminAuth(async (req, admin) => {
    try {
        const body = await req.json();
        await connectToDatabase();

        const ticket = await SupportTicket.create({
            ...body,
            createdBy: admin.id,
            ticketId: `TIC-${Date.now().toString().slice(-6)}`
        });

        return NextResponse.json({ success: true, ticket });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
