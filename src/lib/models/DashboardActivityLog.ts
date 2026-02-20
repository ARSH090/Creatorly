
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDashboardActivityLog extends Document {
    creatorId: mongoose.Types.ObjectId;
    activityType: 'product_created' | 'order_completed' | 'lead_added' | 'ai_generated' | 'automation_triggered' | 'payout_processed';
    activityData: Record<string, any>; // JSON details
    createdAt: Date;
}

const DashboardActivityLogSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    activityType: {
        type: String,
        enum: ['product_created', 'order_completed', 'lead_added', 'ai_generated', 'automation_triggered', 'payout_processed'],
        required: true
    },
    activityData: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, index: true } // Index for sorting by time
}, {
    timestamps: false
});

// TTL: Keep logs for 60 days
DashboardActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

const DashboardActivityLog: Model<IDashboardActivityLog> = mongoose.models.DashboardActivityLog || mongoose.model<IDashboardActivityLog>('DashboardActivityLog', DashboardActivityLogSchema);
export { DashboardActivityLog };
export default DashboardActivityLog;
