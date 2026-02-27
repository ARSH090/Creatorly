import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { CreatorProfile } from '@/lib/models/CreatorProfile';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { revalidatePath } from 'next/cache';
import { invalidateCache } from '@/lib/cache';

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
        themeV2: creatorProfile.themeV2,
        layout: creatorProfile.layout,
        blocksLayout: creatorProfile.blocksLayout,
        links: creatorProfile.links,
        socialLinks: creatorProfile.socialLinks,
        customDomain: creatorProfile.customDomain,
        domainVerified: creatorProfile.isCustomDomainVerified,
        storefrontData: creatorProfile
    };
}

import { z } from 'zod';

const profileUpdateSchema = z.object({
    displayName: z.string().min(1).max(50).optional(),
    bio: z.string().max(500).optional(),
    avatar: z.string().url().optional().or(z.literal('')),
    storeSlug: z.string().regex(/^[a-z0-9-]+$/).min(3).max(30).optional(),
    theme: z.object({
        primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
        secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
        accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
        backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
        textColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
        fontFamily: z.string().optional(),
        borderRadius: z.string().optional(),
        buttonStyle: z.enum(['pill', 'square', 'rounded']).optional(),
        backgroundImage: z.string().optional().or(z.literal('')),
        productLayout: z.enum(['grid', 'list']).optional(),
        buttonColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
        buttonTextColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    }).optional(),
    layout: z.array(z.object({
        id: z.string(),
        type: z.string(),
        enabled: z.boolean().optional(),
        order: z.number().optional()
    })).optional(),
    links: z.array(z.object({
        id: z.string(),
        title: z.string(),
        url: z.string().url(),
        thumbnail: z.string().url().optional().or(z.literal('')),
        isActive: z.boolean().optional(),
        order: z.number().optional()
    })).optional(),
    socialLinks: z.object({
        instagram: z.string().optional(),
        twitter: z.string().optional(),
        youtube: z.string().optional(),
        tiktok: z.string().optional(),
        linkedin: z.string().optional(),
        website: z.string().url().optional().or(z.literal('')),
    }).optional(),
    customDomain: z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/).optional().or(z.literal('')),
    testimonials: z.array(z.any()).optional(),
    faqs: z.array(z.any()).optional(),
    blocksLayout: z.array(z.any()).optional(),
    themeV2: z.record(z.any()).optional(),
    showProfilePhoto: z.boolean().optional(),
    currency: z.string().optional(),
    isPublished: z.boolean().optional(),
});

/**
 * PATCH /api/creator/profile
 * Update creator profile and storefront
 */
async function patchHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const body = await req.json();

    // Validate request body
    const validation = profileUpdateSchema.safeParse(body);
    if (!validation.success) {
        throw new Error(`Validation Error: ${validation.error.issues[0].message} at ${validation.error.issues[0].path.join('.')}`);
    }

    const {
        displayName, bio, avatar, storeSlug,
        theme, layout, links, socialLinks, customDomain,
        testimonials, faqs, blocksLayout, themeV2,
        showProfilePhoto, currency, isPublished
    } = validation.data;

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
    if (testimonials) profileUpdates.testimonials = testimonials;
    if (faqs) profileUpdates.faqs = faqs;
    if (showProfilePhoto !== undefined) profileUpdates.showProfilePhoto = showProfilePhoto;
    if (blocksLayout) profileUpdates.blocksLayout = blocksLayout;
    if (themeV2) profileUpdates.themeV2 = themeV2;
    if (currency) profileUpdates.currency = currency;
    if (isPublished !== undefined) profileUpdates.isPublished = isPublished;

    // Handle Domain Changes
    if (customDomain !== undefined) {
        const oldProfile = await CreatorProfile.findOne({ creatorId: user._id }).select('customDomain');

        // 1. If domain changed or removed, clean up Redis
        if (oldProfile?.customDomain && oldProfile.customDomain !== customDomain) {
            try {
                const { Redis } = await import('@upstash/redis');
                const redis = Redis.fromEnv();

                // Remove the domain mapping so it's not misrouted
                await redis.del(`domain:${oldProfile.customDomain}`);

                // Also clear profile cache since routing might depend on it
                const userData = await User.findById(user._id).select('username');
                if (userData?.username) {
                    await redis.del(`username:${userData.username}`);
                }
            } catch (err) {
                console.error('Redis cleanup error:', err);
            }
        }

        profileUpdates.customDomain = customDomain;
        // 2. Reset verification status if changing domains
        if (customDomain !== oldProfile?.customDomain) {
            profileUpdates.isCustomDomainVerified = false;
        }
    }

    const updatedProfile = await CreatorProfile.findOneAndUpdate(
        { creatorId: user._id },
        { $set: profileUpdates },
        { new: true, upsert: true }
    );

    // Revalidate public storefront
    const userData = await User.findById(user._id).select('username storeSlug');
    if (userData?.username) {
        revalidatePath(`/u/${userData.username}`);
        await invalidateCache(`storefront:${userData.username.toLowerCase()}`).catch(() => null);
    }
    if (userData?.storeSlug) {
        revalidatePath(`/u/${userData.storeSlug}`);
        await invalidateCache(`storefront:${userData.storeSlug.toLowerCase()}`).catch(() => null);
    }

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
