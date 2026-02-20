import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
    creatorId: mongoose.Types.ObjectId;
    productType: 'digital_download' | 'course' | 'service' | 'subscription';
    title: string;
    slug: string;
    description: string;
    shortDescription?: string;

    // Pricing
    pricing: {
        basePrice: number;
        salePrice?: number;
        currency: string;
        taxInclusive: boolean;
    };

    // Status & Organization
    status: 'draft' | 'active' | 'archived';
    categoryId?: mongoose.Types.ObjectId;
    tags?: string[]; // Array of tag names or IDs

    // Media
    coverImageUrl?: string;

    // Legacy / Backward Comp.
    name?: string; // mapped to title
    price?: number; // mapped from pricing.basePrice
    isActive?: boolean; // mapped from status
    isFeatured?: boolean;
    currency?: string; // mapped from pricing.currency
    coachingDuration?: number;
    files?: any[];
    digitalFileUrl?: string;
    hasVariants?: boolean;
    variants?: any[];
    stock?: number;
    type?: string;
    paymentType?: 'one_time' | 'subscription';
    razorpayPlanId?: string;
    billingCycle?: string;
    maxDownloads?: number;
    downloadExpiryDays?: number;
    hasUpsell?: boolean;
    upsellProductId?: string;
    image?: string;
    thumbnail?: string;
    curriculum?: any[];
    discountCodes?: any[];
    compareAtPrice?: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    deletedAt?: Date;
}

const ProductSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productType: {
        type: String,
        enum: ['digital_download', 'course', 'service', 'subscription'],
        required: true,
        default: 'digital_download'
    },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 300 },

    pricing: {
        basePrice: { type: Number, required: true, min: 0 },
        salePrice: { type: Number, min: 0 },
        currency: { type: String, default: 'INR' },
        taxInclusive: { type: Boolean, default: false }
    },

    isFeatured: { type: Boolean, default: false },
    coachingDuration: { type: Number }, // in minutes
    type: { type: String }, // Legacy product type string

    status: {
        type: String,
        enum: ['draft', 'active', 'archived'],
        default: 'draft',
        index: true
    },
    isActive: { type: Boolean, default: false, index: true },

    categoryId: { type: Schema.Types.ObjectId, ref: 'ProductCategory' },
    tags: [{ type: String }],

    coverImageUrl: String,

    publishedAt: Date,
    deletedAt: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Backward compatibility virtuals
ProductSchema.virtual('name').get(function (this: any) { return this.title; }).set(function (this: any, v: string) { this.title = v; });
ProductSchema.virtual('price').get(function (this: any) { return this.pricing?.basePrice; });
ProductSchema.virtual('currency').get(function (this: any) { return this.pricing?.currency || 'INR'; });

// Indexes
ProductSchema.index({ creatorId: 1, status: 1 });
ProductSchema.index({ creatorId: 1, slug: 1 }, { unique: true });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ tags: 1 });

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export { Product };
export default Product;
