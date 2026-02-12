import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Affiliate } from '@/lib/models/Affiliate';
import { Payout } from '@/lib/models/Payout';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * POST /api/creator/affiliates/pay
 * Mark affiliate commissions as paid
 * Body: { affiliateId, amount }
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const body = await req.json();
    const { affiliateId, amount } = body;

    if (!affiliateId || !amount) {
        throw new Error('affiliateId and amount are required');
    }

    const affiliate = await Affiliate.findOne({
        _id: affiliateId,
        creatorId: user._id
    });

    if (!affiliate) {
        throw new Error('Affiliate not found');
    }

    const pendingCommission = affiliate.totalCommission - affiliate.paidCommission;

    if (amount > pendingCommission) {
        throw new Error(`Amount (₹${amount}) exceeds pending commission (₹${pendingCommission})`);
    }

    // Update affiliate paid commission
    affiliate.paidCommission += amount;
    await affiliate.save();

    // Create payout record
    const payout = await Payout.create({
        creatorId: user._id,
        affiliateId: affiliate.affiliateId,
        amount,
        currency: 'INR',
        status: 'paid',
        payoutMethod: 'affiliate_commission',
        processedAt: new Date()
    });

    // TODO: Send payment confirmation email to affiliate

    return {
        success: true,
        payout,
        affiliate: {
            totalCommission: affiliate.totalCommission,
            paidCommission: affiliate.paidCommission,
            pendingCommission: affiliate.totalCommission - affiliate.paidCommission
        },
        message: `Paid ₹${amount} to affiliate`
    };
}

export const POST = withCreatorAuth(withErrorHandler(handler));
