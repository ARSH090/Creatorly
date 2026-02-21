import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { Order } from '@/lib/models/Order';
import { Product } from '@/lib/models/Product';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

async function getHandler(req: NextRequest) {
    await dbConnect();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Parallelize queries for performance
    const [
        totalUsers,
        activeCreators,
        totalProducts,
        revenueStats,
        dailyRevenue,
        topCreators,
        topProducts
    ] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ role: 'creator' }),
        Product.countDocuments({ status: { $ne: 'archived' } }),
        Order.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Order.aggregate([
            { $match: { status: 'completed', createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    total: { $sum: "$amount" }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        Order.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: '$creatorId',
                    totalEarned: { $sum: '$amount' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalEarned: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'creator'
                }
            },
            { $unwind: '$creator' },
            {
                $project: {
                    name: '$creator.displayName',
                    email: '$creator.email',
                    totalEarned: 1,
                    orderCount: 1
                }
            }
        ]),
        Order.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: '$productId',
                    totalRevenue: { $sum: '$amount' },
                    salesCount: { $sum: 1 }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $project: {
                    name: '$product.name',
                    totalRevenue: 1,
                    salesCount: 1
                }
            }
        ])
    ]);

    const totalRevenue = revenueStats[0]?.total || 0;

    // Format daily revenue for frontend
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const formattedDaily = dailyRevenue.map(d => ({
        date: days[new Date(d._id).getDay()],
        value: d.total
    }));

    return NextResponse.json({
        totalUsers,
        activeCreators,
        totalProducts,
        totalRevenue,
        recentRevenue: formattedDaily,
        topCreators,
        topProducts
    });
}

export const GET = withAdminAuth(withErrorHandler(getHandler));

