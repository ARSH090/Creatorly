import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/analytics/top-sources
 * Returns traffic source breakdown (Instagram, TikTok, Twitter, Direct, etc.)
 * Shows where store visitors are coming from
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sources = await AnalyticsEvent.aggregate([
        {
            $match: {
                creatorId: user._id,
                eventType: 'page_view',
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    $cond: [
                        { $ne: ["$utm_source", null] },
                        "$utm_source",
                        {
                            $cond: [
                                { $ne: ["$referrer", null] },
                                {
                                    $switch: {
                                        branches: [
                                            { case: { $regexMatch: { input: "$referrer", regex: /instagram\.com/i } }, then: "Instagram" },
                                            { case: { $regexMatch: { input: "$referrer", regex: /facebook\.com/i } }, then: "Facebook" },
                                            { case: { $regexMatch: { input: "$referrer", regex: /t\.co|twitter\.com/i } }, then: "Twitter" },
                                            { case: { $regexMatch: { input: "$referrer", regex: /tiktok\.com/i } }, then: "TikTok" },
                                            { case: { $regexMatch: { input: "$referrer", regex: /google\.com/i } }, then: "Google" }
                                        ],
                                        default: "Other Referral"
                                    }
                                },
                                "Direct"
                            ]
                        }
                    ]
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        },
        {
            $project: {
                _id: 0,
                source: "$_id",
                visits: "$count"
            }
        }
    ]);

    const totalVisits = sources.reduce((sum, s) => sum + s.visits, 0);

    // Add percentage
    const sourcesWithPercentage = sources.map(s => ({
        ...s,
        percentage: totalVisits > 0 ? Math.round((s.visits / totalVisits) * 100 * 100) / 100 : 0
    }));

    return {
        days,
        totalVisits,
        sources: sourcesWithPercentage
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
