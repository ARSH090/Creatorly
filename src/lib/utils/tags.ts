import Subscriber from '@/lib/models/Subscriber';
import SubscriberTag from '@/lib/models/SubscriberTag';
import Product from '@/lib/models/Product';
import mongoose from 'mongoose';

/**
 * Gets or creates a subscriber for a creator by email
 */
export async function getOrCreateSubscriber(creatorId: string, email: string, name?: string, source = 'manual') {
    let subscriber = await Subscriber.findOne({ creatorId, email: email.toLowerCase() });

    if (!subscriber) {
        subscriber = await Subscriber.create({
            creatorId,
            email: email.toLowerCase(),
            name,
            source,
            status: 'active'
        });
    } else if (name && !subscriber.name) {
        subscriber.name = name;
        await subscriber.save();
    }

    return subscriber;
}

/**
 * Applies purchase-related tags to a subscriber
 */
export async function applyPurchaseTags(creatorId: string, subscriberId: string, productId: string) {
    try {
        const product = await Product.findById(productId);
        if (!product) return;

        const tags = [
            'purchased',
            `purchased_${product.slug}`,
            'customer'
        ];

        // Bulk insert tags, ignore duplicates
        const operations = tags.map(tag => ({
            updateOne: {
                filter: { subscriberId: new mongoose.Types.ObjectId(subscriberId), tag },
                update: {
                    $setOnInsert: {
                        creatorId: new mongoose.Types.ObjectId(creatorId),
                        subscriberId: new mongoose.Types.ObjectId(subscriberId),
                        tag,
                        source: 'purchase',
                        createdAt: new Date()
                    }
                },
                upsert: true
            }
        }));

        await SubscriberTag.bulkWrite(operations as any);
    } catch (error) {
        console.error('Error applying purchase tags:', error);
    }
}
