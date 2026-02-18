import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Message from '@/lib/models/Message';
import { withAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import User from '@/lib/models/User';

/**
 * GET /api/chat/conversations
 * Returns a list of users the current user has chatted with, along with the last message.
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    // Get unique other users
    const results = await Message.aggregate([
        {
            $match: {
                $or: [
                    { senderId: user._id },
                    { receiverId: user._id }
                ]
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $group: {
                _id: {
                    $cond: [
                        { $eq: ["$senderId", user._id] },
                        "$receiverId",
                        "$senderId"
                    ]
                },
                lastMessage: { $first: "$$ROOT" },
                unreadCount: {
                    $sum: {
                        $cond: [
                            { $and: [{ $eq: ["$receiverId", user._id] }, { $eq: ["$isRead", false] }] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);

    // Populate user details
    const conversations = await Promise.all(results.map(async (res) => {
        const otherUser = await User.findById(res._id).select('displayName username avatar');
        return {
            user: otherUser,
            lastMessage: res.lastMessage,
            unreadCount: res.unreadCount
        };
    }));

    return { conversations };
}

export const GET = withAuth(withErrorHandler(handler));
