import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { CreatorProfile } from '@/lib/models/CreatorProfile';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/profile
 * Get creator's profile and storefront information
 */
async function getHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const userData = await User.findById(user._id).select(
        'displayName username email bio avatar storeSlug plan planExpiresAt'
    );

    let creatorProfile = await CreatorProfile.findOne({ creatorId: user._id });

    // If profile doesn't exist, create a default one
    if (!creatorProfile) {
        creatorProfile = await CreatorProfile.create({
            creatorId: user._id,
            storeName: userData?.displayName || user.username || 'My Store',
        });
    }

    return {
        profile: userData,
        theme: creatorProfile.theme,
        layout: creatorProfile.layout,
        links: creatorProfile.links,
        socialLinks: creatorProfile.socialLinks,
        storefrontData: creatorProfile
    };
}

/**
 * PATCH /api/creator/profile
 * Update creator profile and storefront
 */
async function patchHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const body = await req.json();
    const {
        displayName, bio, avatar, storeSlug,
        theme, layout, links, socialLinks, customDomain
    } = body;

    const userUpdates: any = {};
    if (displayName) userUpdates.displayName = displayName;
    if (bio !== undefined) userUpdates.bio = bio;
    if (avatar) userUpdates.avatar = avatar;
    if (storeSlug) {
        const existing = await User.findOne({
            storeSlug,
            _id: { $ne: user._id }
        });
        if (existing) throw new Error('Store slug already taken');
        userUpdates.storeSlug = storeSlug;
    }

    if (Object.keys(userUpdates).length > 0) {
        await User.findByIdAndUpdate(user._id, { $set: userUpdates });
    }

    const profileUpdates: any = {};
    if (theme) profileUpdates.theme = theme;
    if (layout) profileUpdates.layout = layout;
    if (links) profileUpdates.links = links;
    if (socialLinks) profileUpdates.socialLinks = socialLinks;
    if (customDomain !== undefined) profileUpdates.customDomain = customDomain;

    const updatedProfile = await CreatorProfile.findOneAndUpdate(
        { creatorId: user._id },
        { $set: profileUpdates },
        { new: true, upsert: true }
    );

    return {
        success: true,
        profile: userUpdates,
        storefront: updatedProfile
    };
}

/**
 * PUT /api/creator/profile
 * Compatibility wrapper for PUT (Redirects to PATCH logic)
 */
async function putHandler(req: NextRequest, user: any, context: any) {
    return patchHandler(req, user, context);
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
export const PATCH = withCreatorAuth(withErrorHandler(patchHandler));
export const PUT = withCreatorAuth(withErrorHandler(putHandler));
