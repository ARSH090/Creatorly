import { IUser } from '@/lib/models/User';
import { AutoReplyRule } from '@/lib/models/AutoReplyRule';
import { PlanTier } from '@/lib/models/plan.types';
import Subscription from '@/lib/models/Subscription';
import Plan from '@/lib/models/Plan';

/**
 * Validates if the creator has permission to use Instagram Automation
 * Based on their current subscription/plan tier
 */
export async function checkAutomationEligibility(user: IUser): Promise<{ allowed: boolean; reason?: string }> {
    // 1. Check if user is a creator
    if (user.role !== 'creator' && user.role !== 'admin' && user.role !== 'super-admin') {
        return { allowed: false, reason: 'USER_ROLE_NOT_ELIGIBLE' };
    }

    // 2. Fetch Active Subscription & Plan
    const subscription = await Subscription.findOne({ userId: user._id, status: 'active' }).populate('planId');
    const plan = subscription?.planId as any;
    const tier = plan?.tier || PlanTier.FREE;

    // 3. Define Limits by Tier
    const limits = {
        [PlanTier.FREE]: 0,
        [PlanTier.STARTER]: 10,
        [PlanTier.PRO]: 100,
        [PlanTier.BUSINESS]: Infinity
    };

    const maxRules = limits[tier as PlanTier] || 0;
    const currentRulesCount = await AutoReplyRule.countDocuments({ creatorId: user._id, isActive: true });

    if (currentRulesCount >= maxRules) {
        return {
            allowed: false,
            reason: tier === PlanTier.FREE ? 'AUTOMATION_NOT_AVAILABLE_ON_FREE' : 'PLAN_RULE_LIMIT_REACHED'
        };
    }

    return { allowed: true };
}

