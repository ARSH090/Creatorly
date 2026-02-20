
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDashboardMetricCache extends Document {
    creatorId: mongoose.Types.ObjectId;
    metricType: 'revenue_24h' | 'revenue_30d' | 'leads_total' | 'conversion_rate' | 'avg_order_value' | 'ai_usage' | 'active_subscribers';
    metricValue: number | Record<string, any>; // Support simple numbers or JSON objects
    calculatedAt: Date;
    expiresAt: Date;
}

const DashboardMetricCacheSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    metricType: {
        type: String,
        enum: ['revenue_24h', 'revenue_30d', 'leads_total', 'conversion_rate', 'avg_order_value', 'ai_usage', 'active_subscribers'],
        required: true
    },
    metricValue: { type: Schema.Types.Mixed, required: true },
    calculatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } } // TTL index
}, {
    timestamps: false
});

// Compound index to quickly find specific metric for a creator
DashboardMetricCacheSchema.index({ creatorId: 1, metricType: 1 }, { unique: true });

const DashboardMetricCache: Model<IDashboardMetricCache> = mongoose.models.DashboardMetricCache || mongoose.model<IDashboardMetricCache>('DashboardMetricCache', DashboardMetricCacheSchema);
export { DashboardMetricCache };
export default DashboardMetricCache;
