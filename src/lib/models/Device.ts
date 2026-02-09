import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDevice extends Document {
    fingerprintHash: string; // From FingerprintJS
    userId?: mongoose.Types.ObjectId; // Linked user (if logged in)
    freeAccountUsed: boolean; // Has this device created a free account?
    freeAccountUserId?: mongoose.Types.ObjectId; // Who created the free account?
    trustScore: number; // 0-100
    isBlocked: boolean;
    metadata: {
        userAgent: string;
        browser: string;
        os: string;
        ip: string;
        country?: string;
        screenResolution?: string;
    };
    lastSeenAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const DeviceSchema: Schema = new Schema({
    fingerprintHash: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    freeAccountUsed: {
        type: Boolean,
        default: false,
        index: true,
    },
    freeAccountUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    trustScore: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
    },
    isBlocked: {
        type: Boolean,
        default: false,
        index: true,
    },
    metadata: {
        userAgent: String,
        browser: String,
        os: String,
        ip: String,
        country: String,
        screenResolution: String,
    },
    lastSeenAt: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true });

// Compound index for limit enforcement
DeviceSchema.index({ fingerprintHash: 1, freeAccountUsed: 1 });

export const Device = (mongoose.models.Device as Model<IDevice>) || mongoose.model<IDevice>('Device', DeviceSchema);
export default Device;
