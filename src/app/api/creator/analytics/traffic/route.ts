import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import mongoose from 'mongoose';

async function handler(req: NextRequest, user: any) {
    try {
        const creatorId = user._id;
        await connectToDatabase();

        const results = await AnalyticsEvent.aggregate([
            {
                $match: {
                    creatorId: new mongoose.Types.ObjectId(creatorId),
                    eventType: 'page_view',
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
        const sources = results.map(r => {
            let name = r._id;
            if (name.includes('instagram.com')) name = 'Instagram';
            else if (name.includes('t.co') || name.includes('twitter.com') || name.includes('x.com')) name = 'Twitter/X';
            else if (name.includes('youtube.com')) name = 'YouTube';
            else if (name.includes('facebook.com')) name = 'Facebook';
            else if (name.includes('linkedin.com')) name = 'LinkedIn';
            else if (name === 'direct' || name.length < 5) name = 'Direct/Unknown';

            return { name, count: r.count };
        });

        // Sum up counts if multiple referrers mapped to the same name
        const groupedSources: Record<string, number> = {};
        sources.forEach(s => {
            groupedSources[s.name] = (groupedSources[s.name] || 0) + s.count;
        });

        const finalSources = Object.keys(groupedSources).map(name => ({
            name,
            count: groupedSources[name]
        })).sort((a, b) => b.count - a.count);

        return NextResponse.json(finalSources);

    } catch (error) {
        console.error('[Traffic Sources] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export const GET = withCreatorAuth(handler);
