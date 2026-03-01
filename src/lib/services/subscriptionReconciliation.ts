import { connectToDatabase } from '@/lib/db/mongodb';
import Subscription from '@/lib/models/Subscription';
import User from '@/lib/models/User';
import { razorpay } from '@/lib/payments/razorpay';

/**
 * Reconciles local subscription state with Razorpay
 * Fixes drift in status and dates
 */
export async function reconcileSubscriptions() {
    console.log('[Reconciliation] Starting subscription sync...');
    await connectToDatabase();

    const subscriptions = await Subscription.find({
        status: { $in: ['active', 'past_due'] },
        // Simple heuristic: check those that might have changed status recently or about to
    });

    let fixedCount = 0;

    for (const sub of subscriptions) {
        try {
            const razorpaySub = await razorpay.subscriptions.fetch(sub.razorpaySubscriptionId);

            // Fix status drift
            if (razorpaySub.status !== sub.status) {
                console.log(`[Reconciliation] Status drift detected for Sub ${sub._id}: DB ${sub.status} vs RZP ${razorpaySub.status}`);

                sub.status = razorpaySub.status as any;
                if (razorpaySub.charge_at) {
                    sub.endDate = new Date(razorpaySub.charge_at * 1000);
                }
                await sub.save();

                // If cancelled, ensure user plan is downgraded (example logic)
                if (razorpaySub.status === 'cancelled' || razorpaySub.status === 'expired') {
                    await User.findByIdAndUpdate(sub.userId, {
                        status: 'active', // User remains active but maybe plan changes
                        // TODO: Update user.planId if applicable
                    });
                }

                fixedCount++;
            }
        } catch (error) {
            console.error(`[Reconciliation] Failed to fetch Sub ${sub.razorpaySubscriptionId}:`, error);
        }
    }

    return { total: subscriptions.length, fixed: fixedCount };
}
