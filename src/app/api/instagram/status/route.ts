import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { AutoDMRule } from '@/lib/models/AutoDMRule';
import { AutoDMLog } from '@/lib/models/AutoDMLog';

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const user = await User.findOne({ clerkId: userId }).select('instagramConnection _id');

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isConnected = user.instagramConnection?.isConnected || false;

        // If connected, fetch stats
        let stats = null;
        if (isConnected) {
            const activeRulesCount = await AutoDMRule.countDocuments({ creatorId: user._id, isActive: true });

            // DMs Sent Today
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const dmsSentTodayCount = await AutoDMLog.countDocuments({
                creatorId: user._id,
                dmSent: true,
                createdAt: { $gte: startOfDay }
            });

            const totalDMsSent = await AutoDMLog.countDocuments({
                creatorId: user._id,
                dmSent: true
            });

            const followGateWaitCount = await AutoDMLog.countDocuments({
                creatorId: user._id,
                followGateUsed: true,
                dmSent: false,
                createdAt: { $gte: startOfDay }
            });

            stats = {
                activeRules: activeRulesCount,
                dmsSentToday: dmsSentTodayCount,
                totalDMsSent: totalDMsSent,
                followGateWait: followGateWaitCount,
                conversionRate: 'N/A' // Could be calculated based on pending follows vs completed
            };
        }

        return NextResponse.json({
            isConnected,
            username: user.instagramConnection?.username || null,
            profilePicUrl: user.instagramConnection?.profilePicUrl || null,
            stats
        });
    } catch (error) {
        console.error('Error fetching Instagram status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

