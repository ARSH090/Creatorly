import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import SupportTicket from '@/lib/models/SupportTicket';
import SupportMessage from '@/lib/models/SupportMessage';
import { withAdminAuth } from '@/lib/auth/withAuth';
import AuditLog from '@/lib/models/AuditLog';

// GET /api/admin/support/[id] (Ticket Details + Messages)
export const GET = withAdminAuth(async (req, admin, context) => {
    try {
        const { id } = context.params;
        await connectToDatabase();

        const ticket = await SupportTicket.findById(id).populate('userId', 'displayName email storeSlug');
        if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

        const messages = await SupportMessage.find({ ticketId: id }).sort({ createdAt: 1 });

        return NextResponse.json({ ticket, messages });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

// POST /api/admin/support/[id] (Reply to Ticket)
export const POST = withAdminAuth(async (req, admin, context) => {
    try {
        const { id } = context.params;
        const body = await req.json();
        await connectToDatabase();

        const ticket = await SupportTicket.findById(id);
        if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

        const message = await SupportMessage.create({
            ticketId: id,
            senderId: admin.id,
            senderType: 'admin',
            senderName: admin.displayName || 'Administrator',
            message: body.message,
            attachments: body.attachments || []
        });

        // Update ticket status
        ticket.status = body.status || 'open';
        ticket.updatedAt = new Date();
        await ticket.save();

        await AuditLog.create({
            adminId: admin.id,
            action: 'REPLY_SUPPORT_TICKET',
            entityType: 'ticket',
            entityId: id,
            ipAddress: req.headers.get('x-forwarded-for') || 'local'
        });

        return NextResponse.json({ success: true, message });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

// PATCH /api/admin/support/[id] (Update Ticket Metadata)
export const PATCH = withAdminAuth(async (req, admin, context) => {
    try {
        const { id } = context.params;
        const body = await req.json();
        await connectToDatabase();

        const ticket = await SupportTicket.findByIdAndUpdate(id, body, { new: true });

        await AuditLog.create({
            adminId: admin.id,
            action: 'UPDATE_SUPPORT_TICKET',
            entityType: 'ticket',
            entityId: id,
            details: { body },
            ipAddress: req.headers.get('x-forwarded-for') || 'local'
        });

        return NextResponse.json({ success: true, ticket });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
