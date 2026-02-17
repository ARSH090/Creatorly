import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/server-auth';
import Subscription from '@/lib/models/Subscription';
import { User } from '@/lib/models/User';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_SECRET!
});

/**
 * POST /api/subscription/cancel
 * Cancel current subscription (access until end of period)
 */
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find active subscription
        const subscription = await Subscription.findOne({
            userId: user._id,
            status: { $in: ['active', 'pending'] }
        });

        if (!subscription) {
            return NextResponse.json(
                { error: 'No active subscription found' },
                { status: 404 }
            );
        }

        // Cancel on Razorpay
        if (subscription.razorpaySubscriptionId) {
            try {
                await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId);
            } catch (rzpError: any) {
                console.error('Razorpay cancellation failed:', rzpError);
                // Continue anyway - we'll handle it in webhook
            }
        }

        // Update subscription status
        subscription.status = 'canceled';
        subscription.autoRenew = false;
        await subscription.save();

        // Update user status to cancelled (tier downgrades at subscription_end_at)
        await User.findByIdAndUpdate(user._id, {
            subscriptionStatus: 'cancelled'
            // DO NOT change subscriptionTier yet - access until end of period
        });

        return NextResponse.json({
            message: 'Subscription cancelled successfully. Access will continue until end of current billing period.',
            subscription: {
                id: subscription._id,
                status: 'canceled',
                endDate: subscription.endDate
            }
        });

    } catch (error: any) {
        console.error('Subscription cancellation error:', error);
        return NextResponse.json(
            { error: 'Failed to cancel subscription', details: error.message },
            { status: 500 }
        );
    }
}
