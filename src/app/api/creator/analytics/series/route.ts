import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import mongoose from 'mongoose';

async function handler(req: NextRequest, user: any) {
    try {
        const creatorId = user._id;
        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get('days') || '7');

        await connectToDatabase();

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // Grouping events and orders by day
        const results = await AnalyticsEvent.aggregate([
            {
                $match: {
                    creatorId: new mongoose.Types.ObjectId(creatorId),
                    createdAt: { $gte: startDate }
                }
            },
            {
                $facet: {
                    visits: [
                        { $match: { eventType: 'page_view' } },
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { "_id": 1 } }
                    ],
                    productClicks: [
                        { $match: { eventType: 'product_view' } },
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { "_id": 1 } }
                    ]
                }
            }
        ]);

        // Separately fetch Revenue series as it's from the Order model
        const revenueSeries = await Order.aggregate([
            {
                $match: {
                    creatorId: new mongoose.Types.ObjectId(creatorId),
                    status: 'completed',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    amount: { $sum: "$amount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        return NextResponse.json({
            visits: results[0].visits,
            productClicks: results[0].productClicks,
            revenue: revenueSeries
        });

    } catch (error) {
        console.error('[Analytics Series] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export const GET = withCreatorAuth(handler);
