import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOTP extends Document {
    phone: string; // +91XXXXXXXXXX
    hashedOtp: string;
    expiresAt: Date;
    attempts: number;
    lockedUntil?: Date;
    createdAt: Date;
}

const OTPSchema: Schema = new Schema({
    phone: {
        type: String,
        required: true,
        index: true
    },
    hashedOtp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index for automatic deletion
    },
    attempts: {
        type: Number,
        default: 0
    },
    lockedUntil: {
        type: Date
    }
}, { timestamps: true });

// Ensure phone is indexed for quick lookups
OTPSchema.index({ phone: 1 });

export const OTP = mongoose.models.OTP || mongoose.model<IOTP>('OTP', OTPSchema);
export default OTP;
