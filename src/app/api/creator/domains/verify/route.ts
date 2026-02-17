import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { CustomDomain } from '@/lib/models/CustomDomain';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { hasFeature } from '@/lib/utils/planLimits';

/**
 * POST /api/creator/domains/verify
 * Verify custom domain DNS configuration
 * Body: { domain }
 */
async function handler(req: NextRequest, user: any, context: any) {
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

    // Check if domain already exists
    let customDomain = await CustomDomain.findOne({
        domain,
        creatorId: user._id
    });

    if (!customDomain) {
        // Create new domain record
        customDomain = await CustomDomain.create({
            creatorId: user._id,
            domain,
            status: 'pending',
            verificationToken: generateVerificationToken()
        });
    }

    // TODO: Implement actual DNS verification
    // For now, simulate verification
    const isVerified = await verifyDNS(domain, customDomain.verificationToken || '');

    if (isVerified) {
        customDomain.status = 'verified';
        customDomain.verifiedAt = new Date();
        await customDomain.save();

        return {
            success: true,
            domain: customDomain,
            message: 'Domain verified successfully'
        };
    } else {
        return {
            success: false,
            domain: customDomain,
            message: 'DNS verification failed. Please check your DNS records.',
            instructions: {
                type: 'CNAME',
                name: domain,
                value: `${user.username}.creatorly.app`,
                txtRecord: `creatorly-verify=${customDomain.verificationToken}`
            }
        };
    }
}

// Helper functions
function generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

async function verifyDNS(domain: string, token: string): Promise<boolean> {
    // TODO: Implement actual DNS lookup
    // For now, return false to show verification instructions
    return false;
}

export const POST = withCreatorAuth(withErrorHandler(handler));
