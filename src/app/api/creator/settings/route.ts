import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/settings
 * Get store settings
 */
async function getHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const creator = await User.findById(user._id).select(
        'displayName username email bio avatar storeSlug plan payoutMethod payoutStatus'
    );

    if (!creator) {
        throw new Error('Creator not found');
    }

    return {
        settings: {
            profile: {
                displayName: creator.displayName,
                username: creator.username,
                email: creator.email,
                bio: creator.bio,
                avatar: creator.avatar,
                storeSlug: creator.storeSlug
            },
            plan: {
                current: creator.plan || 'free',
                payoutMethod: creator.payoutMethod,
                payoutStatus: creator.payoutStatus
            }
        }
    };
}

/**
 * PUT /api/creator/settings
 * Update store settings
 */
async function putHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const body = await req.json();
    const { payoutMethod, notifications, storeName, storeDescription } = body;

    const updates: any = {};
    if (payoutMethod) updates.payoutMethod = payoutMethod;
    // Add other settings as needed

    const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $set: updates },
        { new: true }
    ).select('displayName username payoutMethod');

    if (!updatedUser) {
        throw new Error('Failed to update settings');
    }

    return {
        success: true,
        settings: updatedUser,
        message: 'Settings updated successfully'
    };
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
export const PUT = withCreatorAuth(withErrorHandler(putHandler));
