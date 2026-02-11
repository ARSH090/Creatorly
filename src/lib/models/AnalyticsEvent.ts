import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnalyticsEvent extends Document {
    eventType: 'page_view' | 'product_view' | 'checkout_start' | 'purchase' | 'download' | 'error' | 'performance';

    creatorId: mongoose.Types.ObjectId;
    productId?: mongoose.Types.ObjectId;
    orderId?: mongoose.Types.ObjectId;
    ip?: string;
    userAgent?: string;
    referrer?: string;
    path: string;
    metadata?: Record<string, any>;
    createdAt: Date;
}

const AnalyticsEventSchema: Schema = new Schema({
    eventType: {
        type: String,
        required: true,
        index: true
    },
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        index: true
    },
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        index: true
    },
    ip: String,
    userAgent: String,
    referrer: String,
    path: String,
    metadata: Schema.Types.Mixed,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// TTL Index for analytics data (keep for 90 days to avoid DB bloat)
AnalyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const AnalyticsEvent: Model<IAnalyticsEvent> = mongoose.models.AnalyticsEvent || mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);
export { AnalyticsEvent };
export default AnalyticsEvent;
