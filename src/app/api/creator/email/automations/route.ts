import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import EmailSequence from '@/lib/models/EmailSequence';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { hasFeature } from '@/lib/utils/planLimits';

/**
 * GET /api/creator/email/automations
 * List all email sequences
 */
async function getHandler(req: NextRequest, user: any) {
    await connectToDatabase();

    // Check plan feature
    if (!hasFeature(user.plan || 'free', 'emailMarketing')) {
        throw new Error('Email marketing requires Creator Pro plan');
    }

    const sequences = await EmailSequence.find({ creatorId: user._id })
        .sort({ createdAt: -1 })
        .lean();

    return { sequences };
}

/**
 * POST /api/creator/email/automations
 * Create a new email sequence
 */
async function postHandler(req: NextRequest, user: any) {
    await connectToDatabase();

    // Check plan feature
    if (!hasFeature(user.plan || 'free', 'emailMarketing')) {
        throw new Error('Email marketing requires Creator Pro plan');
    }

    const body = await req.json();
    const { name, triggerType, steps, isActive } = body;

    if (!name || !triggerType || !steps || !Array.isArray(steps)) {
        throw new Error('Invalid sequence data');
    }

    const sequence = await EmailSequence.create({
        creatorId: user._id,
        name,
        triggerType,
        steps,
        isActive: isActive || false,
        stats: { enrollments: 0, completed: 0 }
    });

    return {
        success: true,
        sequence,
        message: 'Sequence created successfully'
    };
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
export const POST = withCreatorAuth(withErrorHandler(postHandler));
