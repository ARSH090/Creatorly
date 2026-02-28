import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
    adminId: mongoose.Types.ObjectId;
    action: string;
    entityType: 'user' | 'product' | 'order' | 'coupon' | 'domain' | 'system' | 'announcement' | 'ticket' | 'message' | 'store' | 'settlement' | 'withdrawal' | 'setting';
    entityId?: mongoose.Types.ObjectId | string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
    adminId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        index: true
    },
    entityType: {
        type: String,
        enum: ['user', 'product', 'order', 'coupon', 'domain', 'system', 'announcement', 'ticket', 'message', 'store', 'settlement', 'withdrawal', 'setting', 'lead', 'finance'],
        required: true,
        index: true
    },
    entityId: {
        type: Schema.Types.Mixed,
        index: true
    },
    details: {
        type: Schema.Types.Mixed
    },
    ipAddress: String,
    userAgent: String
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

// Optimization for searching logs for a specific entity
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

const AuditLog = (mongoose.models.AuditLog as Model<IAuditLog>) || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export default AuditLog;
