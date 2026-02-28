import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { User } from '@/lib/models/User';
import { Product } from '@/lib/models/Product';
import { Payout } from '@/lib/models/Payout';
import { withAdminAuth } from '@/lib/auth/withAuth';

// GET /api/admin/analytics
export const GET = withAdminAuth(async () => {
    try {
        await connectToDatabase();

        // 1. Revenue Metrics (Total Sales, Platform Commission)
        // Assuming Order has 'amount' and platform takes a commission (e.g. 5%)
        const orders = await Order.find({ status: 'paid' }).select('amount platformFee commission').lean();
        const totalRevenue = orders.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const platformEarnings = orders.reduce((acc, curr) => acc + (curr.platformFee || curr.commission || 0), 0);

        // 2. User Growth
        const totalCreators = await User.countDocuments({ role: 'creator' });
        const totalUsers = await User.countDocuments();

        // 3. Asset Performance
        const totalProducts = await Product.countDocuments();
        const flaggedProducts = await Product.countDocuments({ isFlagged: true });

        // 4. Payout Stats
        const totalPayouts = await Payout.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // 5. Monthly Revenue Chart Data (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyStats = await Order.aggregate([
            { $match: { status: 'paid', createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    revenue: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        return NextResponse.json({
            summary: {
                totalRevenue: totalRevenue / 100, // Assuming stored in paise/cents
                platformEarnings: platformEarnings / 100,
                totalCreators,
                totalUsers,
                totalProducts,
                flaggedProducts,
                totalPaidOut: (totalPayouts[0]?.total || 0)
            },
            chartData: monthlyStats.map(stat => ({
                month: new Date(0, stat._id - 1).toLocaleString('default', { month: 'short' }),
                revenue: stat.revenue / 100,
                orders: stat.count
            }))
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
