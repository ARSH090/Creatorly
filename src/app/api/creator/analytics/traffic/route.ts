import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import mongoose from 'mongoose';

async function handler(req: NextRequest, user: any) {
    try {
        const creatorId = user._id;
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || 'source'; // source, medium, campaign
        const days = parseInt(searchParams.get('days') || '30');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        let groupField = '$utm_source';
        if (type === 'medium') groupField = '$utm_medium';
        if (type === 'campaign') groupField = '$utm_campaign';

        // 1. UTM Based Aggregation
        const utmResults = await AnalyticsEvent.aggregate([
            {
                $match: {
                    creatorId: new mongoose.Types.ObjectId(creatorId),
                    eventType: 'page_view',
                    createdAt: { $gte: startDate },
                    [type === 'source' ? 'utm_source' : type === 'medium' ? 'utm_medium' : 'utm_campaign']: { $exists: true, $ne: "" }
                }
            },
            {
                $group: {
                    _id: groupField,
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // 2. Referrer Based Aggregation (Fallback/Legacy)
        const referrerResults = await AnalyticsEvent.aggregate([
            {
                $match: {
                    creatorId: new mongoose.Types.ObjectId(creatorId),
                    eventType: 'page_view',
                    createdAt: { $gte: startDate },
                    referrer: { $exists: true, $ne: "" }
                }
            },
            {
                $group: {
                    _id: "$referrer",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Post-process to group common sources
        const processedReferrers = referrerResults.map(r => {
            let name = r._id;
            try {
                const url = new URL(name);
                name = url.hostname.replace('www.', '');
            } catch (e) { }

            if (name.includes('instagram.com')) name = 'Instagram';
            else if (name.includes('t.co') || name.includes('twitter.com') || name.includes('x.com')) name = 'Twitter/X';
            else if (name.includes('youtube.com')) name = 'YouTube';
            else if (name.includes('facebook.com')) name = 'Facebook';
            else if (name.includes('linkedin.com')) name = 'LinkedIn';
            else if (name === 'direct' || name.length < 5) name = 'Direct/Unknown';

            return { name, count: r.count };
        });

        const groupedSources: Record<string, number> = {};

        // Merge UTM sources
        utmResults.forEach(r => {
            groupedSources[r._id] = (groupedSources[r._id] || 0) + r.count;
        });

        // Merge Referrers (only if not already captured by UTM)
        processedReferrers.forEach(s => {
            if (!groupedSources[s.name]) {
                groupedSources[s.name] = (groupedSources[s.name] || 0) + s.count;
            } else {
                // If it's a major social network that we've already tracked via UTM, 
                // we only add it if the referrer count is significantly different? 
                // Actually, for a summary view, we just merge.
                groupedSources[s.name] += s.count;
            }
        });

        const finalSources = Object.keys(groupedSources).map(name => ({
            name,
            count: groupedSources[name]
        })).sort((a, b) => b.count - a.count).slice(0, 10);

        return NextResponse.json({
            type,
            sources: finalSources,
            utmBreakdown: utmResults.map(r => ({ name: r._id, count: r.count }))
        });

    } catch (error) {
        console.error('[Traffic Sources] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export const GET = withCreatorAuth(handler);
