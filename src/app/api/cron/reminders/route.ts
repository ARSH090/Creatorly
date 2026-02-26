import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Subscription } from '@/lib/models/Subscription';
import { User } from '@/lib/models/User';
import { sendTrialReminderEmail } from '@/lib/services/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/reminders
 * Vercel Cron job to send trial reminder emails.
 */
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const now = new Date();
        const threeDaysOut = new Date();
        threeDaysOut.setDate(now.getDate() + 3);

        const oneDayOut = new Date();
        oneDayOut.setDate(now.getDate() + 1);

        // 1. Find subscriptions ending in 3 days (approx)
        const day3Subs = await Subscription.find({
            status: 'trialing',
            trialEndsAt: {
                $lte: threeDaysOut,
                $gt: new Date(threeDaysOut.getTime() - 24 * 60 * 60 * 1000) // Within the next 24h window of "3 days away"
            },
            trialReminder3Sent: { $ne: true }
        }).populate('userId');

        // 2. Find subscriptions ending in 1 day (approx)
        const day1Subs = await Subscription.find({
            status: 'trialing',
            trialEndsAt: {
                $lte: oneDayOut
            },
            trialReminder1Sent: { $ne: true }
        }).populate('userId');

        let sentCount = 0;

        // Process 3-day reminders
        for (const sub of day3Subs) {
            const user = sub.userId as any;
            if (user && user.email) {
                await sendTrialReminderEmail(user.email, {
                    daysLeft: 3,
                    name: user.displayName || user.username
                });
                sub.trialReminder3Sent = true;
                await sub.save();
                sentCount++;
            }
        }

        // Process 1-day reminders
        for (const sub of day1Subs) {
            const user = sub.userId as any;
            if (user && user.email) {
                await sendTrialReminderEmail(user.email, {
                    daysLeft: 1,
                    name: user.displayName || user.username
                });
                sub.trialReminder1Sent = true;
                await sub.save();
                sentCount++;
            }
        }

        return NextResponse.json({
            success: true,
            remindersSent: sentCount,
            message: `Sent ${sentCount} trial reminders.`
        });

    } catch (error: any) {
        console.error('[CRON REMINDERS] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
