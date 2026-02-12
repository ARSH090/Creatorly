import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Affiliate } from '@/lib/models/Affiliate';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/affiliates/commissions
 * Get commission summary: pending vs paid
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const affiliates = await Affiliate.find({ creatorId: user._id })
        .populate('affiliateId', 'displayName email');

    // Calculate total pending and paid commissions
    let totalPending = 0;
    let totalPaid = 0;

    const commissionBreakdown = await Promise.all(
        affiliates.map(async (affiliate) => {
            const pending = affiliate.totalCommission - affiliate.paidCommission;
            totalPending += pending;
            totalPaid += affiliate.paidCommission;

            return {
                affiliateId: affiliate._id,
                affiliateName: affiliate.affiliateId?.displayName,
                affiliateEmail: affiliate.affiliateId?.email,
                totalEarned: affiliate.totalCommission,
                paid: affiliate.paidCommission,
                pending,
                sales: affiliate.totalSales
            };
        })
    );

    return {
        summary: {
            totalPending: Math.round(totalPending * 100) / 100,
            totalPaid: Math.round(totalPaid * 100) / 100,
            totalCommissions: Math.round((totalPending + totalPaid) * 100) / 100
        },
        affiliates: commissionBreakdown
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
