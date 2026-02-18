import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Message from '@/lib/models/Message';
import { pusherServer } from '@/lib/pusher';
import { withAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * POST /api/chat/send
 * Body: { receiverId, content, attachmentUrl? }
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const body = await req.json();
    const { receiverId, content, attachmentUrl } = body;

    if (!receiverId || !content) {
        throw new Error('Receiver and content are required');
    }

    const message = await Message.create({
        senderId: user._id,
        receiverId,
        content,
        attachmentUrl,
        isRead: false
    });

    // Determine channel name (sorted to ensure consistency between two users)
    const channelName = [user._id.toString(), receiverId.toString()].sort().join('--');

    // Trigger Pusher event
    await pusherServer.trigger(`chat--${channelName}`, 'new-message', {
        id: message._id,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt
    });

    return {
        success: true,
        message
    };
}

export const POST = withAuth(withErrorHandler(handler));
