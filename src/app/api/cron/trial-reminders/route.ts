import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Subscription } from '@/lib/models/Subscription';
import { User } from '@/lib/models/User';
import { sendTrialReminderEmail } from '@/lib/services/email';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectToDatabase();
        const now = new Date();

        // Reminder 1: Trial ends in 3 days
        const threeDaysOut = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        const threeDaysRangeStart = new Date(threeDaysOut);
        threeDaysRangeStart.setHours(0, 0, 0, 0);
        const threeDaysRangeEnd = new Date(threeDaysOut);
        threeDaysRangeEnd.setHours(23, 59, 59, 999);

        // Reminder 2: Trial ends in 1 day
        const oneDayOut = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
        const oneDayRangeStart = new Date(oneDayOut);
        oneDayRangeStart.setHours(0, 0, 0, 0);
        const oneDayRangeEnd = new Date(oneDayOut);
        oneDayRangeEnd.setHours(23, 59, 59, 999);

        const trialsToRemind = await Subscription.find({
            status: 'trialing',
            trialEndsAt: {
                $or: [
                    { $gte: threeDaysRangeStart, $lte: threeDaysRangeEnd },
                    { $gte: oneDayRangeStart, $lte: oneDayRangeEnd }
                ]
            }
        });

        let sentCount = 0;
        for (const sub of trialsToRemind) {
            const user = await User.findById(sub.userId).lean();
            if (!user?.email) continue;

            const daysLeft = Math.ceil((sub.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            await sendTrialReminderEmail(user.email, {
                daysLeft,
                name: user.displayName || user.username || 'there'
            });
            sentCount++;
        }

        return NextResponse.json({ success: true, sent: sentCount });

    } catch (error: any) {
        console.error('[Cron] Trial reminder error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
