import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import EmailSequence from '@/lib/models/EmailSequence';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { hasFeature } from '@/lib/utils/planLimits';

/**
 * GET /api/creator/email/automations/[id]
 * Get sequence details
 */
async function getHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();
    const params = await context.params;
    const { id } = params;

    const sequence = await EmailSequence.findOne({
        _id: id,
        creatorId: user._id
    });

    if (!sequence) {
        throw new Error('Sequence not found');
    }

    return { sequence };
}

/**
 * PUT /api/creator/email/automations/[id]
 * Update sequence
 */
async function putHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();
    const params = await context.params;
    const { id } = params;
    const body = await req.json();

    const sequence = await EmailSequence.findOneAndUpdate(
        { _id: id, creatorId: user._id },
        { ...body },
        { new: true }
    );

    if (!sequence) {
        throw new Error('Sequence not found');
    }

    return { success: true, sequence };
}

/**
 * DELETE /api/creator/email/automations/[id]
 * Delete sequence
 */
async function deleteHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();
    const params = await context.params;
    const { id } = params;

    const sequence = await EmailSequence.findOneAndDelete({
        _id: id,
        creatorId: user._id
    });

    if (!sequence) {
        throw new Error('Sequence not found');
    }

    return { success: true };
}

// Wrap handlers
export const GET = withCreatorAuth(withErrorHandler(getHandler));
export const PUT = withCreatorAuth(withErrorHandler(putHandler));
export const DELETE = withCreatorAuth(withErrorHandler(deleteHandler));
