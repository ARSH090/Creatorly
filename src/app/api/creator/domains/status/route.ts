import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { CustomDomain } from '@/lib/models/CustomDomain';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { hasFeature } from '@/lib/utils/planLimits';
import { verifyDNSConfiguration } from '@/lib/utils/dns';
import { getDomainStatusFromVercel } from '@/lib/services/vercel';

/**
 * GET /api/creator/domains/status
 * Get detailed status of a custom domain
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    // Check plan feature
    if (!hasFeature(user.plan || 'free', 'customDomain')) {
        throw new Error('Custom domain requires Creator Pro plan');
    }

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

    // Get DNS verification status
    let dnsVerified = false;
    let dnsDetails = null;
    
    if (customDomain.verificationToken) {
        const dnsResult = await verifyDNSConfiguration(
            domain,
            customDomain.verificationToken,
            `${user.username}.creatorly.app`
        );
        dnsVerified = dnsResult.success;
        dnsDetails = {
            txtRecordFound: dnsResult.txtRecordFound,
            cnameRecordFound: dnsResult.cnameRecordFound,
            error: dnsResult.error
        };
    }

    // Get Vercel status
    let vercelStatus = null;
    try {
        vercelStatus = await getDomainStatusFromVercel(domain);
    } catch (error: any) {
        console.error('Failed to get Vercel status:', error);
    }

    // Overall status
    const status = {
        domain: customDomain.domain,
        status: customDomain.status,
        verified: customDomain.status === 'verified',
        dnsVerified,
        dnsDetails,
        vercelStatus: vercelStatus ? {
            verified: vercelStatus.verified,
            sslIssued: vercelStatus.verified,
            cname: vercelStatus.verified
        } : null,
        createdAt: customDomain.createdAt,
        verifiedAt: customDomain.verifiedAt,
        instructions: dnsVerified ? null : {
            txt: {
                host: `_creatorly-verify.${domain}`,
                value: customDomain.verificationToken,
                type: 'TXT'
            },
            cname: {
                host: domain,
                value: `${user.username}.creatorly.app`,
                type: 'CNAME'
            }
        }
    };

    return { status };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
