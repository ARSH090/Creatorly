import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductFile {
    name: string;
    url: string;
    size?: number;
    mimeType?: string;
    downloadLimit?: number;
}

export interface ILesson {
    id: string;
    title: string;
    type: 'video' | 'text' | 'quiz' | 'file';
    content: string; // URL for video/file, Markdown for text, JSON for quiz
    duration?: string;
    isFreePreview?: boolean;
}

export interface IModule {
    id: string;
    title: string;
    lessons: ILesson[];
}

export interface IProduct extends Document {
    creatorId: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number;
    currency: string;
    paymentType: 'one_time' | 'subscription' | 'payment_plan';
    category: string;
    image: string;
    thumbnail?: string;

    // Multi-type support
    type: 'digital' | 'course' | 'membership' | 'physical' | 'coaching';

    // Pricing & Billing
    billingCycle?: 'monthly' | 'yearly';
    razorpayPlanId?: string;

    // Assets & Delivery
    files: IProductFile[];
    digitalFileUrl?: string; // Legacy support

    // Course Specific
    curriculum?: IModule[];

    // Logic & Scheduling
    accessRules: {
        immediateAccess: boolean;
        dripSchedule?: Date;
        requiresApproval: boolean;
        expirationDays?: number;
    };

    // SEO & Discovery
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        keywords?: string[];
    };

    isActive: boolean;
    isFeatured: boolean;
    inventoryCount?: number; // For physical goods

    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    currency: { type: String, default: 'INR' },
    paymentType: {
        type: String,
        enum: ['one_time', 'subscription', 'payment_plan'],
        default: 'one_time'
    },
    category: { type: String, required: true },
    image: { type: String, required: true },
    thumbnail: { type: String },

    type: {
        type: String,
        enum: ['digital', 'course', 'membership', 'physical', 'coaching'],
        default: 'digital',
        index: true
    },

    billingCycle: {
        type: String,
        enum: ['monthly', 'yearly'],
    },
    razorpayPlanId: String,

    files: [{
        name: { type: String, required: true },
        url: { type: String, required: true },
        size: Number,
        mimeType: String,
        downloadLimit: { type: Number, default: 0 } // 0 = unlimited
    }],
    digitalFileUrl: { type: String },

    curriculum: [{
        id: String,
        title: String,
        lessons: [{
            id: String,
            title: String,
            type: { type: String, enum: ['video', 'text', 'quiz', 'file'], default: 'video' },
            content: String,
            duration: String,
            isFreePreview: { type: Boolean, default: false }
        }]
    }],

    accessRules: {
        immediateAccess: { type: Boolean, default: true },
        dripSchedule: Date,
        requiresApproval: { type: Boolean, default: false },
        expirationDays: Number
    },

    seo: {
        metaTitle: String,
        metaDescription: String,
        keywords: [String]
    },

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    inventoryCount: { type: Number, default: 0 }
}, { timestamps: true });

// Performance & Discovery Indexes
ProductSchema.index({ creatorId: 1, type: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1, isFeatured: 1 });
ProductSchema.index({ createdAt: -1 });

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export { Product };
export default Product;
