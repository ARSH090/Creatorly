import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Booking } from '@/lib/models/Booking';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/bookings
 * List all bookings
 * Query params: status (upcoming, completed, cancelled)
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const query: any = { creatorId: user._id };

    if (status === 'upcoming') {
        query.startTime = { $gte: new Date() };
        query.status = { $in: ['confirmed', 'pending'] };
    } else if (status === 'completed') {
        query.status = 'completed';
    } else if (status === 'cancelled') {
        query.status = 'canceled';
    }

    const bookings = await (Booking as any).find(query)
        .populate('productId', 'name duration')
        .sort({ startTime: -1 })
        .lean();

    return {
        bookings,
        total: bookings.length
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
