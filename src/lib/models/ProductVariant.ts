import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductVariant extends Document {
    productId: mongoose.Types.ObjectId;
    variantName: string;
    priceModifier: number; // Adjustment to base price
    inventoryQuantity: number; // -1 for unlimited
    metadata?: Record<string, any>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ProductVariantSchema: Schema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variantName: { type: String, required: true },
    priceModifier: { type: Number, default: 0 },
    inventoryQuantity: { type: Number, default: -1 }, // -1 = unlimited
    metadata: { type: Map, of: Schema.Types.Mixed },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

// Compound index for unique variant names per product
ProductVariantSchema.index({ productId: 1, variantName: 1 }, { unique: true });

const ProductVariant: Model<IProductVariant> = mongoose.models.ProductVariant || mongoose.model<IProductVariant>('ProductVariant', ProductVariantSchema);
export { ProductVariant };
export default ProductVariant;
