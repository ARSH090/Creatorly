import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Availability } from '@/lib/models/Availability';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/availability
 * Get calendar availability settings
 */
async function getHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const availability = await Availability.findOne({ creatorId: user._id });

    if (!availability) {
        return {
            availability: {
                timezone: 'UTC',
                schedule: [],
                bufferMinutes: 15,
                maxBookingsPerDay: 10
            }
        };
    }

    return { availability };
}

/**
 * POST /api/creator/availability
 * Set calendar availability
 * Body: { timezone?, schedule, bufferMinutes?, maxBookingsPerDay? }
 */
async function postHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const body = await req.json();
    const { timezone, schedule, bufferMinutes, maxBookingsPerDay } = body;

    if (!schedule || !Array.isArray(schedule)) {
        throw new Error('schedule is required and must be an array');
    }

    const availabilityData = {
        creatorId: user._id,
        timezone: timezone || 'UTC',
        schedule,
        bufferMinutes: bufferMinutes || 15,
        maxBookingsPerDay: maxBookingsPerDay || 10,
        updatedAt: new Date()
    };

    const availability = await Availability.findOneAndUpdate(
        { creatorId: user._id },
        { $set: availabilityData },
        { upsert: true, new: true }
    );

    return {
        success: true,
        availability,
        message: 'Availability settings updated'
    };
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
export const POST = withCreatorAuth(withErrorHandler(postHandler));
