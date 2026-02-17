import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/profile
 * Get creator's public profile information
 */
async function getHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const profile = await User.findById(user._id).select(
        'displayName username email bio avatar storeSlug plan planExpiresAt'
    );

    return { profile };
}

/**
 * PUT /api/creator/profile
 * Update creator profile
 * Body: { displayName?, bio?, avatar?, storeSlug? }
 */
async function putHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const body = await req.json();
    const { displayName, bio, avatar, storeSlug } = body;

    const updates: any = {};
    if (displayName) updates.displayName = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (avatar) updates.avatar = avatar;
    if (storeSlug) {
        // Validate slug uniqueness
        const existing = await User.findOne({
            storeSlug,
            _id: { $ne: user._id }
        });

        if (existing) {
            throw new Error('Store slug already taken');
        }
        updates.storeSlug = storeSlug;
    }

    const updatedProfile = await User.findByIdAndUpdate(
        user._id,
        { $set: updates },
        { new: true }
    ).select('displayName username email bio avatar storeSlug');

    if (!updatedProfile) {
        throw new Error('Failed to update profile');
    }
    return { profile: updatedProfile };
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
export const PUT = withCreatorAuth(withErrorHandler(putHandler));
