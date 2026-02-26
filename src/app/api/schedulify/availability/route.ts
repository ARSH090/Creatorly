import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { CreatorAvailability } from '@/lib/models/CreatorAvailability';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/schedulify/availability
 */
async function getHandler(req: NextRequest, user: any) {
    await connectToDatabase();
    let availability = await CreatorAvailability.findOne({ creatorId: user._id });

    if (!availability) {
        availability = await CreatorAvailability.create({
            creatorId: user._id,
            timezone: 'Asia/Kolkata',
            weeklySchedule: {
                monday: [{ start: '09:00', end: '17:00' }],
                tuesday: [{ start: '09:00', end: '17:00' }],
                wednesday: [{ start: '09:00', end: '17:00' }],
                thursday: [{ start: '09:00', end: '17:00' }],
                friday: [{ start: '09:00', end: '17:00' }],
                saturday: [],
                sunday: []
            }
        });
    }

    return { availability };
}

/**
 * PATCH /api/schedulify/availability
 */
async function patchHandler(req: NextRequest, user: any) {
    await connectToDatabase();
    const body = await req.json();

    const availability = await CreatorAvailability.findOneAndUpdate(
        { creatorId: user._id },
        { $set: body },
        { new: true, upsert: true }
    );

    return {
        success: true,
        availability
    };
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
export const PATCH = withCreatorAuth(withErrorHandler(patchHandler));
