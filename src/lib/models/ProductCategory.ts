import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductCategory extends Document {
    creatorId: mongoose.Types.ObjectId;
    name: string;
    slug: string; // URL-friendly name
    parentCategoryId?: mongoose.Types.ObjectId; // For nested categories
    createdAt: Date;
    updatedAt: Date;
}

const ProductCategorySchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    parentCategoryId: { type: Schema.Types.ObjectId, ref: 'ProductCategory', default: null },
}, {
    timestamps: true
});

// Ensure unique slug per creator
ProductCategorySchema.index({ creatorId: 1, slug: 1 }, { unique: true });

const ProductCategory: Model<IProductCategory> = mongoose.models.ProductCategory || mongoose.model<IProductCategory>('ProductCategory', ProductCategorySchema);
export { ProductCategory };
export default ProductCategory;
