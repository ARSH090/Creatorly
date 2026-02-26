import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { successResponse, errorResponse } from '@/types/api';
import { startOfDay, startOfMonth } from 'date-fns';

async function handler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();

        const now = new Date();
        const todayStart = startOfDay(now);
        const monthStart = startOfMonth(now);

        const [productStats, revenueStats] = await Promise.all([
            Product.aggregate([
                { $match: { creatorId: user._id, isArchived: { $ne: true } } },
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        publishedProducts: {
                            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] }
                        },
                        totalSales: { $sum: "$totalSales" },
                        avgRating: { $avg: "$avgRating" }
                    }
                }
            ]),
            Order.aggregate([
                {
                    $match: {
                        creatorId: user._id,
                        status: { $in: ['completed', 'success'] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        allTimeRevenue: { $sum: "$total" },
                        todayRevenue: {
                            $sum: {
                                $cond: [{ $gte: ["$createdAt", todayStart] }, "$total", 0]
                            }
                        },
                        monthlyRevenue: {
                            $sum: {
                                $cond: [{ $gte: ["$createdAt", monthStart] }, "$total", 0]
                            }
                        }
                    }
                }
            ])
        ]);

        const stats = productStats[0] || {
            totalProducts: 0,
            publishedProducts: 0,
            totalSales: 0,
            avgRating: 0
        };

        const revenue = revenueStats[0] || {
            allTimeRevenue: 0,
            todayRevenue: 0,
            monthlyRevenue: 0
        };

        // Combine and convert Paise to Rupees (assuming 100 paise = 1 INR)
        const finalStats = {
            ...stats,
            allTimeRevenue: (revenue.allTimeRevenue || 0) / 100,
            todayRevenue: (revenue.todayRevenue || 0) / 100,
            monthlyRevenue: (revenue.monthlyRevenue || 0) / 100,
            totalSales: stats.totalSales || 0 // Already aggregated from products
        };

        return NextResponse.json(finalStats);
    } catch (error: any) {
        console.error('Creator Products Stats Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch stats', error.message), { status: 500 });
    }
}

export const GET = withCreatorAuth(handler);

