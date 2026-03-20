import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDailyMetric extends Document {
    creatorId: mongoose.Types.ObjectId;
    date: string; // YYYY-MM-DD
    eventType: string;
    count: number;
    revenue: number;
    updatedAt: Date;
}

const DailyMetricSchema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    eventType: { type: String, required: true },
    count: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
}, {
    timestamps: true,
});

DailyMetricSchema.index({ creatorId: 1, date: -1 });
DailyMetricSchema.index({ creatorId: 1, date: 1, eventType: 1 }, { unique: true });

const DailyMetric: Model<IDailyMetric> = mongoose.models.DailyMetric || mongoose.model<IDailyMetric>('DailyMetric', DailyMetricSchema);
export { DailyMetric };
export default DailyMetric;
