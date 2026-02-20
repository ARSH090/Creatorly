import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductTag extends Document {
    creatorId: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}

const ProductTagSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
}, {
    timestamps: true
});

// Ensure unique slug per creator
ProductTagSchema.index({ creatorId: 1, slug: 1 }, { unique: true });

const ProductTag: Model<IProductTag> = mongoose.models.ProductTag || mongoose.model<IProductTag>('ProductTag', ProductTagSchema);
export { ProductTag };
export default ProductTag;
