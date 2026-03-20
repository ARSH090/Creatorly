import { withCronAuth } from '@/lib/auth/cron';

export const GET = withCronAuth(async (req: NextRequest) => {
    try {
        await connectToDatabase();
        const now = new Date();
        const gracePeriodDate = new Date();
        gracePeriodDate.setDate(gracePeriodDate.getDate() - 3); // 3-day grace period

        // 1. Find and process EXPIRED/CANCELLED subscriptions that have reached their end date
        // Note: For 'cancelled' with 'cancelAtPeriodEnd', we wait until endDate.
        const expiredSubscriptions = await Subscription.find({
            status: { $in: ['active', 'canceled'] },
            endDate: { $lt: gracePeriodDate }, // Apply grace period
            cancelAtPeriodEnd: true
        });

        log.info(`[Cron] Processing ${expiredSubscriptions.length} expired subscriptions`);

        let processedCount = 0;

        for (const sub of expiredSubscriptions) {
            try {
                // Downgrade Platform Tier
                if (sub.planId) {
                    await User.findByIdAndUpdate(sub.userId, {
                        subscriptionTier: 'free',
                        subscriptionStatus: 'expired',
                        plan: 'free'
                    });

                    // Deactivate products over FREE tier limit (keep first 1)
                    const products = await Product.find({
                        creatorId: sub.userId,
                        status: 'active'
                    }).sort({ createdAt: 1 });

                    if (products.length > 1) {
                        const toDeactivate = products.slice(1);
                        await Product.updateMany(
                            { _id: { $in: toDeactivate.map((p: any) => p._id) } },
                            { $set: { status: 'draft', isActive: false } }
                        );
                        log.info(`Deactivated ${toDeactivate.length} excess products for user ${sub.userId}`);
                    }
                }

                // Update Subscription status
                sub.status = 'expired';
                await sub.save();
                processedCount++;

                log.info(`Subscription ${sub.razorpaySubscriptionId || sub._id} marked as expired and user downgraded.`);
            } catch (err: any) {
                log.error(`[Cron] Failed to process expired subscription ${sub._id}`, { error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            processed: processedCount,
            message: `Processed ${processedCount} expired subscriptions`
        });

    } catch (error: any) {
        log.error('[Cron] Subscription cleanup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
});
