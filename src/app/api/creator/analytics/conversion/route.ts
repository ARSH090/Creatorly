import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import mongoose from 'mongoose';

async function handler(req: NextRequest, user: any) {
    try {
        const creatorId = user._id;
        await connectToDatabase();

        // 1. Get clicks per product
        const clickStats = await AnalyticsEvent.aggregate([
            {
                $match: {
                    creatorId: new mongoose.Types.ObjectId(creatorId),
                    eventType: 'product_view',
                    productId: { $exists: true }
                }
            },
            {
                $group: {
                    _id: "$productId",
                    clicks: { $sum: 1 }
                }
            }
        ]);

        // 2. Get purchases per product
        const orderStats = await Order.aggregate([
            {
                $match: {
                    creatorId: new mongoose.Types.ObjectId(creatorId),
                    status: 'success'
                }
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    sales: { $sum: 1 }
                }
            }
        ]);

        // 3. Merge and compute conversion rates
        const statsMap: Record<string, { clicks: number, sales: number }> = {};

        clickStats.forEach(c => {
            const id = c._id.toString();
            statsMap[id] = { clicks: c.clicks, sales: 0 };
        });

        orderStats.forEach(o => {
            const id = o._id.toString();
            if (statsMap[id]) {
                statsMap[id].sales = o.sales;
            } else {
                statsMap[id] = { clicks: 0, sales: o.sales };
            }
        });

        const conversionData = Object.keys(statsMap).map(productId => {
            const { clicks, sales } = statsMap[productId];
            const rate = clicks > 0 ? (sales / clicks) * 100 : 0;
            return {
                productId,
                clicks,
                sales,
                conversionRate: parseFloat(rate.toFixed(2))
            };
        });

        return NextResponse.json(conversionData);

    } catch (error) {
        console.error('[Conversion Stats] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export const GET = withCreatorAuth(handler);
