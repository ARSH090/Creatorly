import Subscriber from '@/lib/models/Subscriber';
import Order from '@/lib/models/Order';

export async function getSubscribersForCampaign(
    creatorId: string,
    targetAudience: string,
    targetProductId?: string,
    targetTags?: string[]
): Promise<{ email: string; firstName: string; unsubscribeToken: string; userId: string }[]> {

    const base: any = { creatorId, status: 'active' };

    if (targetAudience === 'buyers') {
        const buyerEmails: string[] = await Order.distinct('buyerEmail', { creatorId, status: 'completed' });
        base.email = { $in: buyerEmails.map((e) => e.toLowerCase()) };
    } else if (targetAudience === 'non_buyers') {
        const buyerEmails: string[] = await Order.distinct('buyerEmail', { creatorId, status: 'completed' });
        base.email = { $nin: buyerEmails.map((e) => e.toLowerCase()) };
    } else if (targetAudience === 'product_buyers' && targetProductId) {
        const buyerEmails: string[] = await Order.distinct('buyerEmail', {
            'items.productId': targetProductId, status: 'completed',
        });
        base.email = { $in: buyerEmails.map((e) => e.toLowerCase()) };
    } else if (targetAudience === 'tagged' && targetTags?.length) {
        base.tags = { $all: targetTags };
    } else if (targetAudience === 'inactive') {
        const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        base.$or = [
            { lastOpenedAt: { $lt: cutoff } },
            { lastOpenedAt: { $exists: false } },
        ];
    }
    // 'all' = no extra filter beyond base

    const docs = await Subscriber.find(base).select('email name unsubscribeToken _id').lean();

    return docs.map((d: any) => ({
        email: d.email,
        firstName: d.name?.split(' ')[0] || '',
        unsubscribeToken: d.unsubscribeToken || '',
        userId: d._id.toString(),
    }));
}
