import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { AutoDMRule } from '@/lib/models/AutoDMRule';
import { AutoDMLog } from '@/lib/models/AutoDMLog';
import { User } from '@/lib/models/User';

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    try {
        await dbConnect();
        const user = await User.findOne({ clerkId: userId }).select('_id');
        if (!user) return new NextResponse('User not found', { status: 404 });

        const activeRulesCount = await AutoDMRule.countDocuments({ creatorId: user._id, isActive: true });

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

        // Basic mock conversion rate calculation (DMs sent after follow / total follow gates triggered)
        const totalFollowGateBlocks = await AutoDMRule.aggregate([
            { $match: { creatorId: user._id } },
            { $group: { _id: null, totalBlocked: { $sum: '$totalFollowGateBlocked' }, totalConverted: { $sum: '$totalFollowGateConverted' } } }
        ]);

        let conversionRate = 'N/A';
        if (totalFollowGateBlocks[0] && totalFollowGateBlocks[0].totalBlocked > 0) {
            conversionRate = Math.round((totalFollowGateBlocks[0].totalConverted / totalFollowGateBlocks[0].totalBlocked) * 100) + '%';
        }

        return NextResponse.json({
            rulesActive: activeRulesCount,
            totalDMsSent,
            sentToday: dmsSentTodayCount,
            followGateWait: followGateWaitCount,
            conversionRate
        });
    } catch (err) {
        return new NextResponse('Server Error', { status: 500 });
    }
}

