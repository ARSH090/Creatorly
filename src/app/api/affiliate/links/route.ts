import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Affiliate } from '@/lib/models/Affiliate';
import { withAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/affiliate/links
 * Get affiliate's unique tracking links for all active programs
 * Affiliate-facing endpoint
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const affiliatePrograms = await Affiliate.find({
        affiliateId: user._id,
        status: 'active'
    }).populate('creatorId', 'displayName username storeSlug')
        .populate('productIds', 'name slug');

    const links = affiliatePrograms.map(program => ({
        programId: program._id,
        creator: program.creatorId,
        commissionRate: program.commissionRate,
        affiliateLink: `${process.env.NEXT_PUBLIC_APP_URL}?ref=${program.uniqueLinkCode}`,
        products: program.productIds,
        status: program.status,
        totalEarned: program.totalCommission,
        paidOut: program.paidCommission,
        pending: program.totalCommission - program.paidCommission
    }));

    return { links };
}

export const GET = withAuth(withErrorHandler(handler));
