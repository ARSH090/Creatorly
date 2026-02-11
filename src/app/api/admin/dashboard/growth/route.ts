import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import { withAdminAuth } from '@/lib/firebase/withAuth';
import { checkAdminPermission } from '@/lib/middleware/adminAuth';

export const dynamic = 'force-dynamic';

export const GET = withAdminAuth(async (req, user) => {
    try {
        if (!checkAdminPermission('view_dashboard', user.role)) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        await connectToDatabase();

        // 1. Fetch Growth Data for the last 6 months
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const [userGrowth, revenueGrowth] = await Promise.all([
            User.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id": 1 } }
            ]),
            Order.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo }, status: 'success' } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        revenue: { $sum: "$totalAmount" }
                    }
                },
                { $sort: { "_id": 1 } }
            ])
        ]);

        return NextResponse.json({
            userGrowth,
            revenueGrowth,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Growth API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch growth statistics' }, { status: 500 });
    }
});
