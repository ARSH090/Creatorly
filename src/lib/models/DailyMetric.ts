import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDailyMetric extends Document {
    creatorId: mongoose.Types.ObjectId;
    date: Date; // 00:00:00 of the day
    metricType: 'views' | 'orders' | 'revenue';
    source: string; // 'direct', 'google', 'instagram', or UTM source
    value: number;
    metadata?: Record<string, any>;
}

const DailyMetricSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, index: true },
    metricType: { type: String, enum: ['views', 'orders', 'revenue'], required: true, index: true },
    source: { type: String, required: true, index: true },
    value: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

// Ensure unique entry per type/source per day for a creator
DailyMetricSchema.index({ creatorId: 1, date: 1, metricType: 1, source: 1 }, { unique: true });

const DailyMetric: Model<IDailyMetric> = mongoose.models.DailyMetric || mongoose.model<IDailyMetric>('DailyMetric', DailyMetricSchema);

export default DailyMetric;
