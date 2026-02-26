import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { Subscription } from '@/lib/models/Subscription';
import { Plan } from '@/lib/models/Plan';
import { sendTrialReminderEmail } from '@/lib/services/email';

/**
 * GET /api/cron/trial-expiry
 * Daily job to handle trial notifications and downgrades
 */
export async function GET(req: NextRequest) {
    // 1. Auth check (Vercel Cron Secret)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectToDatabase();
        const now = new Date();

        // 2. Identify trials ending soon (3 days left)
        const day11 = new Date();
        day11.setDate(day11.getDate() + 3);
        const soonExpiring = await User.find({
            subscriptionStatus: 'trialing',
            subscriptionEndAt: { $gte: day11, $lt: new Date(day11.getTime() + 24 * 60 * 60 * 1000) }
        });

        // Send "3 days left" emails to trials ending soon
        for (const u of soonExpiring) {
            await sendTrialReminderEmail(u.email, { daysLeft: 3, name: u.displayName || u.username }).catch(console.error);
        }
        console.log(`[CRON] Sent Day-11 trial reminder to ${soonExpiring.length} users`);

        // 3. Identify trials ending tomorrow
        const day13 = new Date();
        day13.setDate(day13.getDate() + 1);
        const tomorrowExpiring = await User.find({
            subscriptionStatus: 'trialing',
            subscriptionEndAt: { $gte: day13, $lt: new Date(day13.getTime() + 24 * 60 * 60 * 1000) }
        });

        // Send "Tomorrow your plan starts" emails
        for (const u of tomorrowExpiring) {
            await sendTrialReminderEmail(u.email, { daysLeft: 1, name: u.displayName || u.username }).catch(console.error);
        }
        console.log(`[CRON] Sent Day-13 trial reminder to ${tomorrowExpiring.length} users`);

        // 4. Handle expired trials that FAILED to convert (Grace Period)
        // Note: Razorpay auto-charges on Day 14. If charge fails, Razorpay status changes.
        // This cron handles users whose trials ended but subscription is not 'active'.
        const expiredTrials = await User.find({
            subscriptionStatus: 'trialing',
            subscriptionEndAt: { $lt: now }
        });

        for (const user of expiredTrials) {
            // Check associated subscription status
            const sub = await Subscription.findOne({ razorpaySubscriptionId: user.razorpaySubscriptionId });

            if (sub && sub.status === 'active') {
                // Subscription is active (payment succeeded), but user status didn't update (webhook delay?)
                // Update user now
                user.subscriptionStatus = 'active';
                await user.save();
            } else {
                // Subscription failed or halted -> Activate Grace Period
                // Downgrade to free tier limits
                const freePlan = await Plan.findOne({ tier: 'free' });
                user.subscriptionTier = 'free';
                if (freePlan) {
                    user.planLimits = freePlan.limits;
                } else {
                    // Critical fallback if plan not found
                    user.planLimits = {
                        maxProducts: 1,
                        maxStorageMb: 100,
                        maxTeamMembers: 0,
                        maxAiGenerations: 0,
                        customDomain: false,
                        canRemoveBranding: false
                    };
                }
                await user.save();

                // TODO: Send "Trial ended, please update payment" email
            }
        }

        return NextResponse.json({ success: true, processed: expiredTrials.length });

    } catch (error: any) {
        console.error('Trial Expiry Cron Error:', error);
        return NextResponse.json({ error: 'Cron execution failed' }, { status: 500 });
    }
}
