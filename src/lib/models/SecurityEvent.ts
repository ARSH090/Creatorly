import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISecurityEvent extends Document {
    eventId: string;
    eventType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    userId?: mongoose.Types.ObjectId;
    ipAddress: string;
    userAgent?: string;
    context: any;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
}

const SecurityEventSchema: Schema = new Schema({
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, index: true },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true,
        index: true
    },
    timestamp: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    ipAddress: { type: String, required: true },
    userAgent: String,
    context: Schema.Types.Mixed,
    acknowledged: { type: Boolean, default: false, index: true },
    acknowledgedBy: String,
    acknowledgedAt: Date
}, { timestamps: true });

// TTL Index to automatically delete events after 90 days
SecurityEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const SecurityEvent = (mongoose.models.SecurityEvent as Model<ISecurityEvent>) ||
    mongoose.model<ISecurityEvent>('SecurityEvent', SecurityEventSchema);

export { SecurityEvent };
export default SecurityEvent;
