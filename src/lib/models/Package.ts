import mongoose, { Schema, Document } from 'mongoose';

export interface IPackage extends Document {
    creatorId: mongoose.Types.ObjectId;
    serviceId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    sessionsTotal: number;
    price: number;
    validityDays: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PackageSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'BookingService', required: true },
    name: { type: String, required: true },
    description: { type: String },
    sessionsTotal: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true },
    validityDays: { type: Number, required: true, default: 30 },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

export const Package = mongoose.models.Package || mongoose.model<IPackage>('Package', PackageSchema);

// PackagePurchase to track client credits
export interface IPackagePurchase extends Document {
    creatorId: mongoose.Types.ObjectId;
    clientEmail: string;
    packageId: mongoose.Types.ObjectId;
    sessionsUsed: number;
    sessionsTotal: number;
    paidAmount: number;
    purchasedAt: Date;
    expiresAt: Date;
    status: 'active' | 'expired' | 'used';
}

const PackagePurchaseSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    clientEmail: { type: String, required: true, index: true },
    packageId: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
    sessionsUsed: { type: Number, default: 0 },
    sessionsTotal: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
    purchasedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ['active', 'expired', 'used'], default: 'active' }
}, {
    timestamps: true
});

export const PackagePurchase = mongoose.models.PackagePurchase || mongoose.model<IPackagePurchase>('PackagePurchase', PackagePurchaseSchema);
