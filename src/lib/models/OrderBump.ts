import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderBump extends Document {
    creatorId: mongoose.Types.ObjectId;
    triggerProductId: mongoose.Types.ObjectId;
    bumpProductId: mongoose.Types.ObjectId;
    headline: string;
    description?: string;
    discountPct: number;
    isActive: boolean;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

const OrderBumpSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    triggerProductId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    bumpProductId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    headline: { type: String, required: true },
    description: { type: String },
    discountPct: { type: Number, default: 0, min: 0, max: 100 },
    isActive: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0 },
}, { timestamps: true });

// Ensure unique bump per trigger product for a creator
OrderBumpSchema.index({ triggerProductId: 1, bumpProductId: 1 }, { unique: true });

const OrderBump: Model<IOrderBump> = mongoose.models.OrderBump || mongoose.model<IOrderBump>('OrderBump', OrderBumpSchema);

export default OrderBump;
