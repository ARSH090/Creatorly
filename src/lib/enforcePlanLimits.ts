import { connectToDatabase } from './db/mongodb';
import { User } from './models/User';
import Product from './models/Product';
// import { emailQueue } from './queues/email'; // Assume exists or will be added

export async function enforceDecreasedLimit(
    planId: string,
    feature: string,
    newLimit: number
) {
    if (feature !== 'products') return;
    // Extend for other features as needed

    await connectToDatabase();

    // Find all active users on this plan
    const users = await User.find({
        subscriptionTier: planId as any,
        subscriptionStatus: { $in: ['active', 'trialing'] }
    }).select('_id email');

    for (const user of users) {
        // Get their active products sorted oldest first
        const products = await Product.find({
            creatorId: user._id,
            status: { $in: ['published', 'active'] },
        }).sort({ createdAt: 1 }).select('_id');

        if (products.length > newLimit && newLimit !== -1) {
            // Products beyond limit get hidden
            const excessIds = products
                .slice(newLimit)
                .map(p => p._id);

            await Product.updateMany(
                { _id: { $in: excessIds } },
                { $set: { hiddenByPlanLimit: true } }
            );

            console.log(`Enforced ${feature} limit for user ${user._id}: hid ${excessIds.length} items.`);

            /* 
            await emailQueue.add('plan-limit-enforcement', {
              userId: user._id,
              email: user.email,
              feature,
              newLimit,
              excessCount: excessIds.length,
            });
            */
        }
    }
}

export async function restoreAfterLimitIncrease(
    planId: string,
    feature: string
) {
    if (feature !== 'products') return;

    await connectToDatabase();

    const users = await User.find({ subscriptionTier: planId as any })
        .select('_id');

    const userIds = users.map(u => u._id);

    const result = await Product.updateMany(
        {
            creatorId: { $in: userIds },
            hiddenByPlanLimit: true,
        },
        { $set: { hiddenByPlanLimit: false } }
    );

    console.log(`Restored ${feature} limit for plan ${planId}: updated ${result.modifiedCount} items.`);
}
