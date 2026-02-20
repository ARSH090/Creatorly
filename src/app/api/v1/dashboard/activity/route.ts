
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import DashboardActivityLog from '@/lib/models/DashboardActivityLog';
import { getMongoUser } from '@/lib/auth/get-user';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const activityType = searchParams.get('activity_type');
        const dateFrom = searchParams.get('date_from');
        const dateTo = searchParams.get('date_to');

        const query: any = { creatorId: user._id };

        if (activityType) {
            query.activityType = activityType;
        }

        if (dateFrom && dateTo) {
            query.createdAt = {
                $gte: new Date(dateFrom),
                $lte: new Date(dateTo)
            };
        }

        const skip = (page - 1) * limit;

        const activities = await DashboardActivityLog.find(query)
            .sort('-createdAt')
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await DashboardActivityLog.countDocuments(query);

        return NextResponse.json({
            activities,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('Error fetching activity log:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
