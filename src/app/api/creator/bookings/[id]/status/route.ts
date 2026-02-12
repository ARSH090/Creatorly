import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Booking } from '@/lib/models/Booking';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * PUT /api/creator/bookings/:id/status
 * Update booking status
 * Body: { status: 'confirmed' | 'completed' | 'cancelled' | 'no_show' }
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const bookingId = params.id;

    const body = await req.json();
    const { status, notes } = body;

    const validStatuses = ['confirmed', 'completed', 'cancelled', 'no_show'];
    if (!status || !validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const booking = await Booking.findOne({
        _id: bookingId,
        creatorId: user._id
    });

    if (!booking) {
        throw new Error('Booking not found');
    }

    booking.status = status;
    if (notes) booking.notes = notes;
    booking.updatedAt = new Date();

    if (status === 'completed') {
        booking.completedAt = new Date();
    }

    await booking.save();

    // TODO: Send status update email to customer

    return {
        success: true,
        booking,
        message: `Booking ${status}`
    };
}

export const PUT = withCreatorAuth(withErrorHandler(handler));
