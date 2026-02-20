import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { Order } from '@/lib/models/Order';
import { Product } from '@/lib/models/Product';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

async function getHandler(req: NextRequest) {
    await dbConnect();

    // Parallelize queries for performance
    const [
        totalUsers,
        activeCreators,
        totalProducts,
        revenueStats
    ] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ role: 'creator' }),
        Product.countDocuments({ status: { $ne: 'archived' } }), // Exclude archived
        Order.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ])
    ]);

    const totalRevenue = revenueStats[0]?.total || 0;

    // Mock growth data for now (or implement real aggregation)
    const recentRevenue = [
        { date: 'Mon', value: 1200 },
        { date: 'Tue', value: 2100 },
        { date: 'Wed', value: 800 },
        { date: 'Thu', value: 1600 },
        { date: 'Fri', value: 2400 },
        { date: 'Sat', value: 3200 },
        { date: 'Sun', value: 4800 },
    ];

    return NextResponse.json({
        totalUsers,
        activeCreators,
        totalProducts,
        totalRevenue,
        recentRevenue
    });
}

export const GET = withAdminAuth(withErrorHandler(getHandler));

