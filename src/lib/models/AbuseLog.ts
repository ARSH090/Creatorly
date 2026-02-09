import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAbuseLog extends Document {
    fingerprintHash?: string;
    userId?: mongoose.Types.ObjectId;
    ip: string;
    type: 'MULTI_ACCOUNT' | 'VPN_DETECTED' | 'RATE_LIMIT' | 'SUSPICIOUS_LOGIN' | 'BRUTE_FORCE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    action: 'BLOCK' | 'FLAG' | 'CHALLENGE' | 'LOG_ONLY';
    metadata?: Record<string, any>;
    createdAt: Date;
}

const AbuseLogSchema: Schema = new Schema({
    fingerprintHash: { type: String, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    ip: { type: String, required: true },
    type: {
        type: String,
        enum: ['MULTI_ACCOUNT', 'VPN_DETECTED', 'RATE_LIMIT', 'SUSPICIOUS_LOGIN', 'BRUTE_FORCE'],
        required: true
    },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'LOW'
    },
    action: {
        type: String,
        enum: ['BLOCK', 'FLAG', 'CHALLENGE', 'LOG_ONLY'],
        default: 'LOG_ONLY'
    },
    metadata: { type: Object }
}, { timestamps: { createdAt: true, updatedAt: false } }); // Only createdAt needed for logs

// Index for finding recent abuse
AbuseLogSchema.index({ ip: 1, createdAt: -1 });

export const AbuseLog = (mongoose.models.AbuseLog as Model<IAbuseLog>) || mongoose.model<IAbuseLog>('AbuseLog', AbuseLogSchema);
export default AbuseLog;
