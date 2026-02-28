import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
    creatorId: mongoose.Types.ObjectId;
    productType: 'digital_download' | 'course' | 'service' | 'subscription' | 'ebook' | 'template' | 'preset' | 'audio' | 'video' | 'bundle' | 'membership' | 'software' | 'swipefile' | 'lead_magnet' | 'pay_what_you_want';
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

    // Social Proof & Info
    testimonials?: Array<{
        id: string;
        name: string;
        content: string;
        rating: number;
        avatar?: string;
    }>;
    faqs?: Array<{
        id: string;
        question: string;
        answer: string;
    }>;

    // Project Integration
    autoCreateProject?: boolean;
    projectTemplate?: {
        tasks: Array<{
            title: string;
            description?: string;
            priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
        }>;
    };

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    // Digital System enhancements
    tagline?: string;
    productNumber?: string;
    category?: string;
    language?: string;
    thumbnailKey?: string;
    galleryKeys?: string[];
    previewFileKey?: string;

    // Pricing System
    pricingType?: 'fixed' | 'pwyw' | 'free' | 'subscription';
    minPrice?: number;
    suggestedPrice?: number;
    compareAtPrice?: number;
    saleStartsAt?: Date;
    saleEndsAt?: Date;
    versionHistory?: Array<{
        version: string;
        changelog?: string;
        fileKeys: string[];
        createdAt: Date;
    }>;

    // Delivery & Protection
    downloadLimit?: number;
    downloadExpiryHours?: number;
    pdfWatermark?: boolean;
    pdfNoPrint?: boolean;
    pdfNoCopy?: boolean;
    accessExpiryDays?: number;

    deliveryMethod?: 'email' | 'redirect' | 'both';
    thankYouMessage?: string;
    thankYouRedirect?: string;

    // Advanced Structure
    files?: Array<{
        key?: string;
        name: string;
        size: number;
        type: string;
        url?: string;
        order?: number;
    }>;

    sections?: Array<{
        title: string;
        order: number;
        lessons: Array<{
            title: string;
            type: 'video' | 'audio' | 'pdf' | 'text' | 'quiz';
            fileKey?: string;
            duration?: number;
            description?: string;
            isFreePreview?: boolean;
            dripDelayDays?: number;
            resourceKeys?: string[];
            order: number;
        }>;
    }>;

    bundledProductIds?: mongoose.Types.ObjectId[];

    // Denormalized Stats
    totalSales: number;
    totalRevenue: number;
    avgRating: number;
    reviewCount: number;
    viewCount: number;

    // Status
    publishedAt?: Date;
    scheduledPublishAt?: Date;
    archivedAt?: Date;
    // Post-Purchase Automation (Area 3)
    postPurchaseEmailEnabled: boolean;
    postPurchaseEmailSubject?: string;
    postPurchaseEmailContent?: string;
    postPurchaseDmEnabled: boolean;
    postPurchaseDmText?: string;

    isArchived: boolean;
    deletedAt?: Date;

    // Admin moderation fields
    isFlagged?: boolean;
    flagReason?: string;
    adminNotes?: string;
}


const ProductSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productType: {
        type: String,
        enum: ['digital_download', 'course', 'service', 'subscription', 'ebook', 'template', 'preset', 'audio', 'video', 'bundle', 'membership', 'software', 'swipefile', 'lead_magnet', 'pay_what_you_want'],
        required: true,
        default: 'digital_download'
    },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 300 },

    pricing: {
        /**
         * Price in the smallest currency unit (e.g., Paise for INR).
         * Must be an integer to avoid float precision issues.
         */
        basePrice: { type: Number, required: true, min: 0, set: Math.round },
        /**
         * Sale price in the smallest currency unit.
         */
        salePrice: { type: Number, min: 0, set: Math.round },
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
    image: String,
    thumbnail: String,
    files: [{
        name: String,
        url: String,
        type: { type: String },
        size: Number
    }],
    digitalFileUrl: String,
    compareAtPrice: Number,

    testimonials: [{
        id: String,
        name: String,
        content: String,
        rating: { type: Number, min: 1, max: 5 },
        avatar: String
    }],
    faqs: [{
        id: String,
        question: String,
        answer: String
    }],

    // Digital System metadata
    tagline: { type: String, maxlength: 160 },
    productNumber: String,
    category: String,
    language: String,

    thumbnailKey: String,
    galleryKeys: [String],
    previewFileKey: String,

    pricingType: { type: String, default: 'fixed' },
    minPrice: Number,
    suggestedPrice: Number,
    saleStartsAt: Date,
    saleEndsAt: Date,
    versionHistory: [{
        version: String,
        changelog: String,
        fileKeys: [String],
        createdAt: { type: Date, default: Date.now }
    }],

    downloadLimit: Number,
    downloadExpiryHours: Number,
    pdfWatermark: Boolean,
    pdfNoPrint: Boolean,
    pdfNoCopy: Boolean,
    accessExpiryDays: Number,

    deliveryMethod: { type: String, default: 'both' },
    thankYouMessage: String,
    thankYouRedirect: String,

    sections: [{
        title: String,
        order: Number,
        lessons: [{
            title: String,
            type: { type: String, enum: ['video', 'audio', 'pdf', 'text', 'quiz'] },
            fileKey: String,
            duration: Number,
            description: String,
            isFreePreview: Boolean,
            dripDelayDays: Number,
            resourceKeys: [String],
            order: Number
        }]
    }],

    bundledProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],

    totalSales: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },

    isArchived: { type: Boolean, default: false, index: true },
    publishedAt: Date,
    scheduledPublishAt: Date,
    archivedAt: Date,
    deletedAt: Date,

    // Post-Purchase Automation (Area 3)
    postPurchaseEmailEnabled: { type: Boolean, default: false },
    postPurchaseEmailSubject: { type: String },
    postPurchaseEmailContent: { type: String },
    postPurchaseDmEnabled: { type: Boolean, default: false },
    postPurchaseDmText: { type: String, maxlength: 500 },

    sortOrder: { type: Number, default: 0 },
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String, default: '' },
    adminNotes: { type: String, default: '' },

    // Soft delete flag
    isDeleted: { type: Boolean, default: false, index: true },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Soft-delete: auto-filter deleted products from all queries
ProductSchema.pre('find', function () { this.where({ isDeleted: { $ne: true } }); });
ProductSchema.pre('findOne', function () { this.where({ isDeleted: { $ne: true } }); });
ProductSchema.pre('countDocuments', function () { this.where({ isDeleted: { $ne: true } }); });

// Auto-generate productNumber (e.g., PRD-001234)
ProductSchema.pre('save', async function () {
    if (this.isNew && !this.productNumber) {
        const count = await mongoose.model('Product').countDocuments();
        const nextId = (count + 1).toString().padStart(6, '0');
        this.productNumber = `PRD-${nextId}`;
    }
});

// Backward compatibility virtuals
ProductSchema.virtual('name').get(function (this: any) { return this.title; }).set(function (this: any, v: string) { this.title = v; });
ProductSchema.virtual('price').get(function (this: any) { return this.pricing?.basePrice; });
ProductSchema.virtual('currency').get(function (this: any) { return this.pricing?.currency || 'INR'; });

// Compound indexes for storefront and management
ProductSchema.index({ creatorId: 1, isActive: 1, sortOrder: 1 });
ProductSchema.index({ creatorId: 1, createdAt: -1 });
ProductSchema.index({ creatorId: 1, isPublished: 1 });

// Indexes
ProductSchema.index({ creatorId: 1, status: 1, sortOrder: 1 });
ProductSchema.index({ creatorId: 1, productType: 1 });
ProductSchema.index({ creatorId: 1, isArchived: 1, createdAt: -1 });
ProductSchema.index({ creatorId: 1, slug: 1 }, { unique: true });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ 'sections.lessons.fileKey': 1 }); // Index for lesson file lookups
ProductSchema.index({ bundledProductIds: 1 });
ProductSchema.index({ totalSales: -1 });
ProductSchema.index({ totalRevenue: -1 });

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export { Product };
export default Product;
