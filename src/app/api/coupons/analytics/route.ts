import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Coupon from '@/lib/models/Coupon';
import CouponUsage from '@/lib/models/CouponUsage';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { successResponse, errorResponse } from '@/types/api';

/**
 * GET /api/coupons/analytics - Get comprehensive coupon analytics
 */
export const GET = withCreatorAuth(async (req, user) => {
    try {
        await connectToDatabase();
        
        const { searchParams } = new URL(req.url);
        const timeframe = searchParams.get('timeframe') || '30d';
        const couponId = searchParams.get('couponId');
        
        // Calculate date range based on timeframe
        const now = new Date();
        let startDate = new Date();
        
        switch (timeframe) {
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(now.getDate() - 90);
                break;
            case '1y':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setDate(now.getDate() - 30);
        }
        
        // Base query for creator's coupons
        let couponMatch: any = { creatorId: user._id };
        if (couponId) {
            couponMatch._id = couponId;
        }
        
        // Overall coupon statistics
        const overallStats = await Coupon.aggregate([
            { $match: couponMatch },
            {
                $group: {
                    _id: null,
                    totalCoupons: { $sum: 1 },
                    activeCoupons: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$isActive', true] },
                                        {
                                            $or: [
                                                { $eq: ['$expiresAt', null] },
                                                { $gt: ['$expiresAt', now] }
                                            ]
                                        }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    totalUses: { $sum: '$usedCount' },
                    totalRevenue: { $sum: '$totalRevenueDriven' },
                    avgDiscountValue: { $avg: '$discountValue' }
                }
            }
        ]);
        
        // Usage over time (daily breakdown)
        const usageOverTime = await CouponUsage.aggregate([
            {
                $match: {
                    creatorId: user._id,
                    usedAt: { $gte: startDate, $lte: now },
                    ...(couponId && { couponId })
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$usedAt'
                        }
                    },
                    uses: { $sum: 1 },
                    revenue: { $sum: '$finalAmount' },
                    discountAmount: { $sum: '$discountAmount' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);
        
        // Top performing coupons
        const topCoupons = await Coupon.find(couponMatch)
            .sort({ totalRevenueDriven: -1 })
            .limit(10)
            .select('code discountType discountValue usedCount totalRevenueDriven expiresAt isActive')
            .lean();
        
        // Recent usage activity
        const recentUsage = await CouponUsage.find({
            creatorId: user._id,
            usedAt: { $gte: startDate },
            ...(couponId && { couponId })
        })
        .sort({ usedAt: -1 })
        .limit(20)
        .populate('productId', 'title')
        .lean();
        
        // Conversion metrics
        const conversionMetrics = await CouponUsage.aggregate([
            {
                $match: {
                    creatorId: user._id,
                    usedAt: { $gte: startDate },
                    ...(couponId && { couponId })
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$productId',
                    productName: { $first: '$product.title' },
                    totalUses: { $sum: 1 },
                    totalRevenue: { $sum: '$finalAmount' },
                    avgDiscount: { $avg: '$discountAmount' },
                    uniqueCustomers: { $addToSet: '$buyerEmail' }
                }
            },
            {
                $addFields: {
                    uniqueCustomerCount: { $size: '$uniqueCustomers' }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 10 }
        ]);
        
        // Coupon type performance
        const typePerformance = await Coupon.aggregate([
            { $match: couponMatch },
            {
                $group: {
                    _id: '$discountType',
                    count: { $sum: 1 },
                    totalUses: { $sum: '$usedCount' },
                    totalRevenue: { $sum: '$totalRevenueDriven' },
                    avgDiscountValue: { $avg: '$discountValue' }
                }
            }
        ]);
        
        const analytics = {
            timeframe,
            dateRange: {
                start: startDate,
                end: now
            },
            overall: overallStats[0] || {
                totalCoupons: 0,
                activeCoupons: 0,
                totalUses: 0,
                totalRevenue: 0,
                avgDiscountValue: 0
            },
            usageOverTime,
            topCoupons: JSON.parse(JSON.stringify(topCoupons)),
            recentUsage: JSON.parse(JSON.stringify(recentUsage)),
            conversionMetrics,
            typePerformance
        };
        
        return NextResponse.json(successResponse('Analytics retrieved successfully', JSON.parse(JSON.stringify(analytics))));
    } catch (error: any) {
        console.error('Coupon Analytics Error:', error);
        return NextResponse.json(errorResponse('Failed to fetch analytics', error.message), { status: 500 });
    }
});
