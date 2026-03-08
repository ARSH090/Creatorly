import { getPlanById } from './planCache';
import User from './models/User';
import { connectToDatabase } from './db/mongodb';

type FeatureKey = 'autoDMHub' | 'schedulify' | 'emailMarketing' |
    'affiliateSystem' | 'advancedAnalytics' | 'customDomain';

/**
 * Gate check for plan features.
 * Returns { allowed: true } or { allowed: false, response: Response }
 */
export async function requirePlanFeature(
    userId: string,
    feature: FeatureKey
): Promise<{ allowed: boolean; response?: Response }> {
    await connectToDatabase();
    const user = await User.findById(userId).select('subscriptionTier plan');
    if (!user) {
        return {
            allowed: false,
            response: Response.json({ error: 'User not found' }, { status: 404 })
        };
    }

    // Use subscriptionTier if present, fallback to plan
    const tier = user.subscriptionTier || user.plan || 'free';
    const plan = await getPlanById(tier);

    const hasAccess = plan?.limits?.[feature] === true;

    if (!hasAccess) {
        return {
            allowed: false,
            response: Response.json({
                error: `${feature} requires a Pro or Elite plan.`,
                errorCode: 'UPGRADE_REQUIRED',
                upgradeRequired: 'pro',
                currentPlan: tier,
            }, { status: 403 })
        };
    }
    return { allowed: true };
}
