import User from '@/lib/models/User';
import { sendUsageWarningEmail } from '@/lib/services/email';

/**
 * Service to handle usage monitoring and billing notifications
 */
export class BillingService {
    /**
     * Check current usage for a user and send notifications if thresholds are met
     */
    static async checkAndNotifyUsage(userId: string) {
        const user = await User.findById(userId);
        if (!user) return;

        const limits = user.planLimits;
        if (!limits) return;

        // 1. AI Content Generation Check
        const aiUsage = user.aiUsageCount || 0;
        const aiLimit = limits.maxAiGenerations || 10;
        await this.evaluateThreshold(user.email, 'AI Generations', aiUsage, aiLimit);

        // 2. Storage Check
        const storageUsage = user.storageUsageMb || 0;
        const storageLimit = limits.maxStorageMb || 100;
        await this.evaluateThreshold(user.email, 'Storage (MB)', storageUsage, storageLimit);
    }

    private static async evaluateThreshold(email: string, resource: string, current: number, limit: number) {
        const percentage = (current / limit) * 100;

        // Notify at 100% or 80% (with basic check to avoid duplicate flooding in real app we'd track lastNotifyPercentage)
        if (percentage >= 100) {
            await sendUsageWarningEmail(email, resource, 100);
            const { NotificationService } = await import('@/lib/services/notification');
            const User = (await import('@/lib/models/User')).default;
            const user = await User.findOne({ email });
            if (user) {
                await NotificationService.send({
                    userId: user._id.toString(),
                    type: 'usage_alert',
                    title: 'Limit Reached',
                    message: `You've used 100% of your ${resource} quota.`,
                    link: '/dashboard/billing'
                });
            }
        } else if (percentage >= 80) {
            // In a production system, we would store 'lastUsageNotification' in User model to only send once per tier
            await sendUsageWarningEmail(email, resource, 80);
        }
    }
}
