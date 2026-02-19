import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/admin/[...nextauth]/route';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { Order } from '@/lib/models/Order';
import { Product } from '@/lib/models/Product';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

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
        // For real implementation: Order.aggregate group by date
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

    } catch (error) {
        console.error('Analytics Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

