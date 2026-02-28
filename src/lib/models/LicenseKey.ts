import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILicenseKey extends Document {
    productId: mongoose.Types.ObjectId;
    key: string;
    isUsed: boolean;
    orderId?: mongoose.Types.ObjectId;
    buyerEmail?: string;
    assignedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const LicenseKeySchema: Schema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    key: {
        type: String,
        required: true,
        trim: true
    },
    isUsed: {
        type: Boolean,
        default: false,
        index: true
    },
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        index: true
    },
    buyerEmail: {
        type: String,
        trim: true
    },
    assignedAt: {
        type: Date
    }
}, { timestamps: true });

// Ensure keys are unique within the same product
LicenseKeySchema.index({ productId: 1, key: 1 }, { unique: true });

const LicenseKey: Model<ILicenseKey> = mongoose.models.LicenseKey || mongoose.model<ILicenseKey>('LicenseKey', LicenseKeySchema);
export { LicenseKey };
export default LicenseKey;
