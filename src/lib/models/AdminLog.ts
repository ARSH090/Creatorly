import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminLog extends Document {
  adminId: string;
  adminEmail: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'BAN' | 'SUSPEND' | 'PROCESS_PAYOUT' | 'REFUND' | 'VIEW' | 'EXPORT' | 'OTHER';
  resource: 'USER' | 'PRODUCT' | 'ORDER' | 'PAYOUT' | 'COUPON' | 'CREATOR' | 'PAYMENT' | 'SETTINGS' | 'OTHER';
  resourceId?: string;
  resourceName?: string;
  description: string;
  changes?: Record<string, any>;
  previousValue?: any;
  newValue?: any;
  status: 'success' | 'failed' | 'attempted';
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  duration?: number; // in ms
  metadata?: Record<string, any>;
  affectedUsers?: number;
}

const AdminLogSchema = new Schema<IAdminLog>(
  {
    adminId: {
      type: String,
      required: true,
      index: true,
    },
    adminEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'BAN', 'SUSPEND', 'PROCESS_PAYOUT', 'REFUND', 'VIEW', 'EXPORT', 'OTHER'],
      required: true,
      index: true,
    },
    resource: {
      type: String,
      enum: ['USER', 'PRODUCT', 'ORDER', 'PAYOUT', 'COUPON', 'CREATOR', 'PAYMENT', 'SETTINGS', 'OTHER'],
      required: true,
      index: true,
    },
    resourceId: String,
    resourceName: String,
    description: {
      type: String,
      required: true,
    },
    changes: Schema.Types.Mixed,
    previousValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    status: {
      type: String,
      enum: ['success', 'failed', 'attempted'],
      default: 'success',
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    duration: Number,
    metadata: Schema.Types.Mixed,
    affectedUsers: Number,
  },
  { timestamps: true }
);

// Compound indexes for common queries
AdminLogSchema.index({ adminId: 1, timestamp: -1 });
AdminLogSchema.index({ resource: 1, action: 1, timestamp: -1 });
AdminLogSchema.index({ resourceId: 1, timestamp: -1 });
AdminLogSchema.index({ 'timestamp': 1 }, { expireAfterSeconds: 7776000 }); // 90-day TTL

export const AdminLog = mongoose.models.AdminLog || mongoose.model<IAdminLog>('AdminLog', AdminLogSchema);
