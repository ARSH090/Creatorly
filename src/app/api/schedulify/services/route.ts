import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { BookingService } from '@/lib/models/BookingService';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import slugify from 'slugify';

/**
 * GET /api/schedulify/services
 * Fetch all services for the logged-in creator
 */
async function getHandler(req: NextRequest, user: any) {
    await connectToDatabase();
    const services = await BookingService.find({ creatorId: user._id }).sort({ createdAt: -1 });
    return { services };
}

/**
 * POST /api/schedulify/services
 * Create a new bookable service
 */
async function postHandler(req: NextRequest, user: any) {
    await connectToDatabase();
    const body = await req.json();

    if (!body.name) {
        throw new Error('Service name is required');
    }

    // Generate unique slug
    const baseSlug = slugify(body.name, { lower: true, strict: true });
    let bookingSlug = baseSlug;
    let counter = 1;

    while (await BookingService.findOne({ creatorId: user._id, bookingSlug })) {
        bookingSlug = `${baseSlug}-${counter}`;
        counter++;
    }

    const service = await BookingService.create({
        ...body,
        creatorId: user._id,
        bookingSlug
    });

    return {
        success: true,
        service
    };
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
export const POST = withCreatorAuth(withErrorHandler(postHandler));
