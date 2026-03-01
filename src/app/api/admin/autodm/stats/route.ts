import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { AutoDMRule } from '@/lib/models/AutoDMRule';
import { AutoDMLog } from '@/lib/models/AutoDMLog';
// Use your platform settings model if exists, or a simple cached variable for toggle
// import { PlatformSettings } from '@/lib/models/PlatformSettings';

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    try {
        await dbConnect();
        const adminUser = await User.findOne({ clerkId: userId, role: { $in: ['admin', 'super-admin'] } });

        if (!adminUser) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const totalActiveRules = await AutoDMRule.countDocuments({ isActive: true });

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const dmsSentToday = await AutoDMLog.countDocuments({ dmSent: true, createdAt: { $gte: startOfDay } });
        const failedDMsToday = await AutoDMLog.countDocuments({ dmSent: false, createdAt: { $gte: startOfDay } });

        const creatorsUsingAutoDM = await User.countDocuments({ 'instagramConnection.isConnected': true });

        // Mock Platform flag for the toggle button
        const autoDMEnabled = true;

        return NextResponse.json({
            totalActiveRules,
            dmsSentToday,
            failedDMsToday,
            creatorsUsingAutoDM,
            autoDMEnabled,
            apiQuotaUsedPercent: 'N/A' // Requires external tracking
        });

    } catch (err) {
        return new NextResponse('Server Error', { status: 500 });
    }
}

