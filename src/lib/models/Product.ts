import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
    creatorId: mongoose.Types.ObjectId;
    name: string;
    description: string;
    price: number;
    currency: string;
    category: string;
    image: string;
    digitalFileUrl?: string;
    isActive: boolean;
    type: 'Digital Goods' | 'Consultations' | 'Physical Goods';
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    category: { type: String, required: true },
    image: { type: String, required: true },
    digitalFileUrl: { type: String },
    isActive: { type: Boolean, default: true },
    type: {
        type: String,
        enum: ['Digital Goods', 'Consultations', 'Physical Goods'],
        default: 'Digital Goods'
    }
}, { timestamps: true });

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export { Product };
export default Product;
