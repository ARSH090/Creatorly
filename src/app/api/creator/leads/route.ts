import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Lead from '@/lib/models/Lead';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/leads
 * Fetches all leads captured by the current creator
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const query = { creatorId: user._id };

    const [leads, total] = await Promise.all([
        Lead.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Lead.countDocuments(query)
    ]);

    return NextResponse.json({
        leads,
        pagination: {
            total,
            page,
            pages: Math.ceil(total / limit)
        }
    });
}

export const GET = withCreatorAuth(withErrorHandler(handler));
