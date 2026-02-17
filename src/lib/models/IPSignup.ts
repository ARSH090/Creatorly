import mongoose, { Schema, Document } from 'mongoose';

export interface IIPSignup extends Document {
    ipAddress: string;
    userId: mongoose.Types.ObjectId;
    country?: string;
    isProxy?: boolean;
    isVPN?: boolean;
    createdAt: Date;
}

const IPSignupSchema: Schema = new Schema({
    ipAddress: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    country: String,
    isProxy: {
        type: Boolean,
        default: false
    },
    isVPN: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Compound index for IP-based queries
IPSignupSchema.index({ ipAddress: 1, createdAt: -1 });
IPSignupSchema.index({ createdAt: -1 });

export const IPSignup = mongoose.models.IPSignup ||
    mongoose.model<IIPSignup>('IPSignup', IPSignupSchema);
export default IPSignup;
