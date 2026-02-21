import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import Lead from '@/lib/models/Lead';
import { DMLog } from '@/lib/models/DMLog';
import mongoose from 'mongoose';

async function handler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const creatorId = user._id;

        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get('days') || '30');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // 1. Lead Growth (Last X days)
        const leadGrowth = await Lead.aggregate([
            {
                $match: {
                    creatorId: new mongoose.Types.ObjectId(creatorId),
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 2. DM Performance Summary
        const dmSummary = await DMLog.aggregate([
            {
                $match: {
                    creatorId: new mongoose.Types.ObjectId(creatorId),
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // 3. DM Provider Breakdown
        const providerBreakdown = await DMLog.aggregate([
            {
                $match: {
                    creatorId: new mongoose.Types.ObjectId(creatorId),
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$provider',
                    count: { $sum: 1 },
                    success: {
                        $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
                    }
                }
            }
        ]);

        // 4. Calculate Total Stats
        const totalLeads = await Lead.countDocuments({ creatorId });
        const newLeads30d = leadGrowth.reduce((acc, curr) => acc + curr.count, 0);

        const totalDMs = dmSummary.reduce((acc, curr) => acc + curr.count, 0);
        const successfulDMs = dmSummary.find(s => s._id === 'success')?.count || 0;

        return NextResponse.json({
            leads: {
                total: totalLeads,
                growth30d: newLeads30d,
                chartData: leadGrowth.map(d => ({ date: d._id, count: d.count }))
            },
            dm: {
                totalSent: totalDMs,
                successRate: totalDMs > 0 ? Math.round((successfulDMs / totalDMs) * 100) : 0,
                providerBreakdown: providerBreakdown.map(p => ({
                    provider: p._id,
                    count: p.count,
                    successRate: p.count > 0 ? Math.round((p.success / p.count) * 100) : 0
                }))
            }
        });

    } catch (error) {
        console.error('[Lead Analytics] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export const GET = withCreatorAuth(handler);
