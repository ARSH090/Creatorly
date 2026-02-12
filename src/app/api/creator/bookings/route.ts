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
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const query: any = { creatorId: user._id };

    if (status === 'upcoming') {
        query.scheduledAt = { $gte: new Date() };
        query.status = { $in: ['confirmed', 'pending'] };
    } else if (status === 'completed') {
        query.status = 'completed';
    } else if (status === 'cancelled') {
        query.status = 'cancelled';
    }

    const bookings = await Booking.find(query)
        .populate('productId', 'name durationMinutes')
        .sort({ scheduledAt: -1 })
        .lean();

    return {
        bookings,
        total: bookings.length
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
