import webpush from 'web-push';
import User from '@/lib/models/User';
import { connectToDatabase } from '@/lib/db/mongodb';

webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'admin@creatorly.in'}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
);

export async function sendSaleNotification(creatorId: string, saleData: {
    productName: string;
    amount: number;
    buyerEmail: string;
}) {
    try {
        await connectToDatabase();
        const user = await User.findById(creatorId).select('pushSubscription displayName');
        if (!user?.pushSubscription) return;

        const amountInRupees = Math.round(saleData.amount / 100);
        await webpush.sendNotification(
            user.pushSubscription,
            JSON.stringify({
                title: `New sale! ₹${amountInRupees.toLocaleString('en-IN')}`,
                body: `${saleData.productName} · ${saleData.buyerEmail.split('@')[0]}`,
                url: '/dashboard/orders',
            })
        );
    } catch (err: any) {
        if (err.statusCode === 410) {
            // Subscription expired — remove it
            await User.findByIdAndUpdate(creatorId, { $unset: { pushSubscription: 1 } });
        }
        console.error('Push notification failed:', err.message);
    }
}
