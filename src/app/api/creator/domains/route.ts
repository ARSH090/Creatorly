import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { CustomDomain } from '@/lib/models/CustomDomain';
import { CreatorProfile } from '@/lib/models/CreatorProfile';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { hasFeature } from '@/lib/utils/planLimits';
import { isValidDomainFormat } from '@/lib/utils/dns';
import { addDomainToVercel, removeDomainFromVercel } from '@/lib/services/vercel';
import crypto from 'crypto';

/**
 * GET /api/creator/domains
 * List custom domains
 */
async function getHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    // Check plan feature
    if (!hasFeature(user.plan || 'free', 'customDomain')) {
        throw new Error('Custom domain requires Creator Pro plan');
    }

    const domains = await CustomDomain.find({ creatorId: user._id })
        .sort({ createdAt: -1 })
        .lean();

    return { domains };
}

/**
 * POST /api/creator/domains
 * Create/initialize a new custom domain
 */
async function postHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    // Check plan feature
    if (!hasFeature(user.plan || 'free', 'customDomain')) {
        throw new Error('Custom domain requires Creator Pro plan');
    }

    const body = await req.json();
    const { domain } = body;

    if (!domain) {
        throw new Error('domain is required');
    }

    // Validate domain format
    if (!isValidDomainFormat(domain)) {
        throw new Error('Invalid domain format');
    }

    // Check if domain already exists for another user
    const existingDomain = await CustomDomain.findOne({ domain: domain.toLowerCase() });
    if (existingDomain) {
        throw new Error('Domain is already in use');
    }

    // Check if user already has a custom domain
    const existingUserDomain = await CustomDomain.findOne({ creatorId: user._id });
    if (existingUserDomain) {
        throw new Error('You already have a custom domain. Please remove it first.');
    }

    // Generate verification token
    const verificationToken = `creatorly-verify-${crypto.randomBytes(16).toString('hex')}`;

    // Add domain to Vercel
    try {
        await addDomainToVercel(domain);
    } catch (error: any) {
        console.error('Vercel domain add error:', error);
        // Continue anyway - may already exist in Vercel
    }

    // Create domain record
    const customDomain = await CustomDomain.create({
        creatorId: user._id,
        domain: domain.toLowerCase(),
        status: 'pending',
        verificationToken,
        username: user.username
    });

    // Update creator profile
    await CreatorProfile.updateOne(
        { creatorId: user._id },
        {
            $set: {
                customDomain: domain.toLowerCase(),
                isCustomDomainVerified: false
            }
        }
    );

    return {
        success: true,
        domain: customDomain,
        message: 'Domain initialized. Please configure DNS records to verify ownership.'
    };
}

/**
 * DELETE /api/creator/domains
 * Remove custom domain
 */
async function deleteHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');

    if (!domain) {
        throw new Error('domain parameter is required');
    }

    // Find domain record
    const customDomain = await CustomDomain.findOne({
        domain: domain.toLowerCase(),
        creatorId: user._id
    });

    if (!customDomain) {
        throw new Error('Domain not found');
    }

    // Remove from Vercel if verified
    if (customDomain.status === 'verified') {
        try {
            await removeDomainFromVercel(customDomain.domain);
        } catch (error: any) {
            console.error('Failed to remove domain from Vercel:', error);
        }
    }

    // Delete domain record
    await CustomDomain.deleteOne({ _id: customDomain._id });

    // Update creator profile
    await CreatorProfile.updateOne(
        { creatorId: user._id },
        {
            $set: {
                customDomain: null,
                isCustomDomainVerified: false
            }
        }
    );

    return { success: true, message: 'Domain removed successfully' };
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
export const POST = withCreatorAuth(withErrorHandler(postHandler));
export const DELETE = withCreatorAuth(withErrorHandler(deleteHandler));
