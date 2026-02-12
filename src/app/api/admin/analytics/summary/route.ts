import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import Product from '@/lib/models/Product';
import { Order } from '@/lib/models/Order';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import { withAdminAuth } from '@/lib/firebase/withAdminAuth';

/**
 * GET /api/admin/analytics/summary
 * Platform-wide summary metrics
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.setDate(startDate.getDate() - days);

    // Total users
    const totalUsers = await User.countDocuments();
    const creators = await User.countDocuments({ role: 'creator' });
    const newUsers = await User.countDocuments({
        createdAt: { $gte: startDate }
    });

    // Total products
    const totalProducts = await Product.countDocuments();
    const publishedProducts = await Product.countDocuments({ status: 'published' });

    // Total orders and revenue
    const revenueStats = await Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$total' },
                totalOrders: { $sum: 1 }
            }
        }
    ]);

    const stats = revenueStats[0] || { totalRevenue: 0, totalOrders: 0 };

    // Recent revenue (last 30 days)
    const recentRevenue = await Order.aggregate([
        {
            $match: {
                paymentStatus: 'paid',
                paidAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                revenue: { $sum: '$total' },
                orders: { $sum: 1 }
            }
        }
    ]);

    const recent = recentRevenue[0] || { revenue: 0, orders: 0 };

    // Total page views
    const totalViews = await AnalyticsEvent.countDocuments({
        eventType: 'store_view'
    });

    return NextResponse.json({
        success: true,
        data: {
            users: {
                total: totalUsers,
                creators,
                new: newUsers
            },
            products: {
                total: totalProducts,
                published: publishedProducts
            },
            revenue: {
                allTime: Math.round(stats.totalRevenue * 100) / 100,
                recent: Math.round(recent.revenue * 100) / 100,
                recentDays: days
            },
            orders: {
                allTime: stats.totalOrders,
                recent: recent.orders
            },
            views: {
                total: totalViews
            }
        }
    });
}

export const GET = withAdminAuth(handler);
