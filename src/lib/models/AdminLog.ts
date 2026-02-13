import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminLog extends Document {
  adminEmail: string;
  action: string;
  targetType: string;
  targetId?: mongoose.Types.ObjectId;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const adminLogSchema = new Schema<IAdminLog>({
  adminEmail: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  targetType: {
    type: String,
    required: true,
    enum: ['user', 'product', 'order', 'payout', 'coupon', 'settings', 'system']
  },
  targetId: {
    type: Schema.Types.ObjectId
  },
  changes: {
    type: Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes
adminLogSchema.index({ adminEmail: 1, timestamp: -1 });
adminLogSchema.index({ targetType: 1, targetId: 1 });
adminLogSchema.index({ timestamp: -1 });

const AdminLog = mongoose.models.AdminLog || mongoose.model<IAdminLog>('AdminLog', adminLogSchema);
export { AdminLog };
export default AdminLog;
