import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Subscription } from '@/lib/models/Subscription';
import { User } from '@/lib/models/User';
import { sendEmail } from '@/lib/services/email';

export async function GET(req: NextRequest) {
    // 1. Auth check for Vercel Cron
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        await connectToDatabase();

        const now = new Date();
        const elevenDaysAgo = new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000);
        const thirteenDaysAgo = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);

        // Find subscriptions starting their 11th or 13th day
        // Simplified: check for trialEndsAt being in 3 days or 1 day
        const threeDaysLeft = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const oneDayLeft = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

        const reminders = await Subscription.find({
            status: 'trialing',
            trialEndsAt: {
                $gte: new Date(now.setHours(0, 0, 0, 0)),
                $lte: new Date(now.setHours(23, 59, 59, 999) + 4 * 24 * 60 * 60 * 1000)
            }
        }).populate('userId');

        for (const sub of reminders) {
            const user = sub.userId as any;
            if (!user || !user.email) continue;

            const diffDays = Math.ceil((sub.trialEndsAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            if (diffDays === 3 || diffDays === 1) {
                await sendEmail({
                    to: user.email,
                    subject: `Creatorly: Your trial ends in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}!`,
                    html: `
                        <h1>Hi ${user.displayName || 'Creator'}!</h1>
                        <p>Your 14-day trial of Creatorly is coming to an end in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}.</p>
                        <p>To avoid any interruption to your AutoDMs and storefront, please ensure your payment method is active.</p>
                        <p>If you have any questions, just reply to this email!</p>
                        <br/>
                        <p>Best,<br/>The Creatorly Team</p>
                    `
                });
                console.log(`[CRON] Reminder sent to ${user.email} (${diffDays} days left)`);
            }
        }

        return NextResponse.json({ success: true, processed: reminders.length });

    } catch (error: any) {
        console.error('[CRON] Daily Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
