import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Message from '@/lib/models/Message';
import { withAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/chat/messages?otherUserId=xxx
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get('otherUserId');

    if (!otherUserId) {
        throw new Error('otherUserId is required');
    }

    const messages = await Message.find({
        $or: [
            { senderId: user._id, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: user._id }
        ]
    })
        .sort({ createdAt: 1 })
        .limit(100);

    return { messages };
}

export const GET = withAuth(withErrorHandler(handler));
