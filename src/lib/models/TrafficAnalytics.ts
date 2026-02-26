import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITrafficAnalytics extends Document {
    creatorId: mongoose.Types.ObjectId;
    productId?: mongoose.Types.ObjectId;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    referrer?: string;
    ipHash?: string; // For unique visitor counting without storing PII
    userAgent?: string;
    path: string;
    createdAt: Date;
}

const TrafficAnalyticsSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', index: true },
    utmSource: { type: String, index: true },
    utmMedium: { type: String, index: true },
    utmCampaign: { type: String, index: true },
    utmTerm: String,
    utmContent: String,
    referrer: String,
    ipHash: { type: String, index: true },
    userAgent: String,
    path: { type: String, required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });

// Composite index for aggregation
TrafficAnalyticsSchema.index({ creatorId: 1, utmSource: 1, createdAt: -1 });

const TrafficAnalytics: Model<ITrafficAnalytics> = mongoose.models.TrafficAnalytics || mongoose.model<ITrafficAnalytics>('TrafficAnalytics', TrafficAnalyticsSchema);

export default TrafficAnalytics;
