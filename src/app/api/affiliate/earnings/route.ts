import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Affiliate } from '@/lib/models/Affiliate';
import { Order } from '@/lib/models/Order';
import { withAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/affiliate/earnings
 * Get affiliate's earnings dashboard
 * Shows total earnings, pending payouts, recent sales
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const affiliatePrograms = await Affiliate.find({
        affiliateId: user._id
    });

    // Aggregate earnings across all programs
    let totalEarnings = 0;
    let pendingPayouts = 0;
    let completedPayouts = 0;

    for (const program of affiliatePrograms) {
        totalEarnings += program.totalCommission;
        completedPayouts += program.paidCommission;
        pendingPayouts += (program.totalCommission - program.paidCommission);
    }

    // Get recent sales
    const recentSales = await Order.find({
        affiliateId: user._id,
        paymentStatus: 'paid'
    }).sort({ paidAt: -1 })
        .limit(20)
        .populate('creatorId', 'displayName')
        .lean();

    return {
        summary: {
            totalEarnings: Math.round(totalEarnings * 100) / 100,
            pendingPayouts: Math.round(pendingPayouts * 100) / 100,
            completedPayouts: Math.round(completedPayouts * 100) / 100
        },
        programs: affiliatePrograms.map(p => ({
            programId: p._id,
            creatorId: p.creatorId,
            commissionRate: p.commissionRate,
            totalEarned: p.totalCommission,
            paid: p.paidCommission,
            pending: p.totalCommission - p.paidCommission,
            status: p.status
        })),
        recentSales: recentSales.map(order => ({
            orderId: order._id,
            date: order.paidAt,
            amount: order.total,
            commission: order.commissionAmount,
            creator: order.creatorId,
            status: order.paymentStatus
        }))
    };
}

export const GET = withAuth(withErrorHandler(handler));
