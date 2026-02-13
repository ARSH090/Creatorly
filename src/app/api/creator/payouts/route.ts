import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Payout from '@/lib/models/Payout';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/payouts
 * Get payout history for the creator
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const payouts = await Payout.find({ creatorId: user._id })
        .sort({ createdAt: -1 })
        .lean();

    // Calculate pending payout amount
    const pendingOrders = await Order.aggregate([
        {
            $match: {
                creatorId: user._id,
                paymentStatus: 'paid',
                paidAt: { $exists: true }
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$total' },
                count: { $sum: 1 }
            }
        }
    ]);

    const totalRevenue = pendingOrders[0]?.totalRevenue || 0;

    // Calculate reserved amount (payouts in progress or paid)
    // Cast strict types for reduce
    const reservedAmount = (payouts as any[])
        .filter((p: any) => !['failed', 'rejected'].includes(p.status))
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const paidOut = (payouts as any[])
        .filter((p: any) => p.status === 'paid')
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const availableForPayout = Math.max(0, totalRevenue - reservedAmount);

    return {
        payouts,
        summary: {
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            paidOut: Math.round(paidOut * 100) / 100,
            pending: Math.round((totalRevenue - paidOut) * 100) / 100, // Balance not yet PAID
            available: Math.round(availableForPayout * 100) / 100 // Balance available to REQUEST
        }
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
