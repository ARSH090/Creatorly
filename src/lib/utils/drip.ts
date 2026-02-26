import Order from '@/lib/models/Order';
import mongoose from 'mongoose';

/**
 * Checks if a specific content (lesson/file) is unlocked for a user
 */
export async function isContentUnlocked(userId: string, productId: string, dripDelayDays: number = 0): Promise<{ unlocked: boolean; unlockDate?: Date; daysRemaining?: number }> {
    if (dripDelayDays === 0) return { unlocked: true };

    try {
        // 1. Find the earliest completed order for this product by this user
        const order = await Order.findOne({
            userId,
            'items.productId': productId,
            status: 'completed'
        }).sort({ paidAt: 1 });

        if (!order || !order.paidAt) {
            return { unlocked: false };
        }

        const purchaseDate = new Date(order.paidAt);
        const unlockDate = new Date(purchaseDate);
        unlockDate.setDate(purchaseDate.getDate() + dripDelayDays);

        const now = new Date();
        const unlocked = now >= unlockDate;

        if (!unlocked) {
            const diffTime = unlockDate.getTime() - now.getTime();
            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { unlocked: false, unlockDate, daysRemaining };
        }

        return { unlocked: true };

    } catch (error) {
        console.error('Error checking content unlock status:', error);
        return { unlocked: false };
    }
}
