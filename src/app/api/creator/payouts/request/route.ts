import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Payout } from '@/lib/models/Payout';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * POST /api/creator/payouts/request
 * Request a manual payout
 * Body: { amount?, description? }
 * If amount not provided, requests payout for all pending revenue
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const body = await req.json();
    const { amount: requestedAmount, description } = body;

    // Calculate available balance
    const orders = await Order.find({
        creatorId: user._id,
        paymentStatus: 'paid'
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

    const existingPayouts = await Payout.find({
        creatorId: user._id,
        status: { $in: ['paid', 'processing'] }
    });

    const paidOut = existingPayouts.reduce((sum, p) => sum + p.amount, 0);
    const availableBalance = totalRevenue - paidOut;

    if (availableBalance <= 0) {
        throw new Error('No funds available for payout');
    }

    const payoutAmount = requestedAmount || availableBalance;

    if (payoutAmount > availableBalance) {
        throw new Error(`Requested amount (₹${payoutAmount}) exceeds available balance (₹${availableBalance})`);
    }

    // Create payout request
    const payout = await Payout.create({
        creatorId: user._id,
        amount: payoutAmount,
        currency: 'INR',
        status: 'pending',
        payoutMethod: user.payoutMethod?.type || 'bank',
        description,
        createdAt: new Date()
    });

    return {
        success: true,
        payout,
        message: 'Payout request submitted. It will be processed within 3-5 business days.'
    };
}

export const POST = withCreatorAuth(withErrorHandler(handler));
