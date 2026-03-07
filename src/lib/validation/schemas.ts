import { z } from 'zod';

// Product Validation
export const ProductSchema = z.object({
    title: z.string().min(1).max(100).optional(),
    name: z.string().min(1).max(100).optional(), // Alias for title
    productType: z.enum(['digital_download', 'course', 'service', 'subscription', 'ebook', 'template', 'preset', 'audio', 'video', 'bundle', 'membership', 'software', 'swipefile', 'lead_magnet', 'pay_what_you_want']).default('digital_download'),
    price: z.number().min(0).optional(),
    currency: z.string().default('INR'),
    category: z.string().min(2).optional(),
    description: z.string().optional(),
    tagline: z.string().max(160).optional(),
    image: z.string().optional(),
    isPublic: z.boolean().optional(),
    isPublished: z.boolean().optional(), // Alias for isPublic
    isActive: z.boolean().optional(),    // Alias for isPublic
    isFeatured: z.boolean().optional(),
    isFeaturedInCollections: z.boolean().optional(),

    // Pricing
    pricingType: z.enum(['fixed', 'pwyw', 'free', 'subscription']).default('fixed'),
    minPrice: z.number().min(0).optional(),
    suggestedPrice: z.number().min(0).optional(),
    compareAtPrice: z.number().min(0).optional(),

    // Delivery & Protection
    downloadLimit: z.number().int().positive().optional(),
    downloadExpiryHours: z.number().int().positive().optional(),
    pdfWatermark: z.boolean().default(false),
    pdfNoPrint: z.boolean().default(false),
    pdfNoCopy: z.boolean().default(false),
    accessExpiryDays: z.number().int().positive().optional(),

    deliveryMethod: z.enum(['email', 'redirect', 'both']).default('both'),
    thankYouMessage: z.string().optional(),
    thankYouRedirect: z.string().url().optional(),

    // Content
    thumbnailKey: z.string().optional(),
    galleryKeys: z.array(z.string()).optional(),
    previewFileKey: z.string().optional(),

    files: z.array(z.object({
        key: z.string(),
        name: z.string(),
        size: z.number().optional(),
        type: z.string().optional(),
        order: z.number().int().default(0)
    })).optional(),

    // Course structure
    sections: z.array(z.object({
        title: z.string().min(1),
        order: z.number().int().default(0),
        lessons: z.array(z.object({
            title: z.string().min(1),
            type: z.enum(['video', 'audio', 'pdf', 'text', 'quiz']),
            fileKey: z.string().optional(),
            duration: z.number().optional(),
            description: z.string().optional(),
            isFreePreview: z.boolean().default(false),
            dripDelayDays: z.number().int().min(0).default(0),
            resourceKeys: z.array(z.string()).optional(),
            order: z.number().int().default(0)
        }))
    })).optional(),

    bundledProductIds: z.array(z.string()).optional(),

    // Status
    status: z.enum(['draft', 'published', 'scheduled', 'archived', 'active']).default('draft'),
    scheduledPublishAt: z.date().or(z.string().transform(val => new Date(val))).optional(),
    isArchived: z.boolean().default(false),
    hasVariants: z.boolean().optional(),
    variants: z.array(z.any()).optional(),

    // New fields
    previewImages: z.array(z.string()).optional(),
    previewVideo: z.string().optional(),
    isFree: z.boolean().default(false),
    seo: z.object({
        title: z.string().default(''),
        description: z.string().default(''),
        keywords: z.array(z.string()).default([])
    }).optional(),
    limitedStock: z.boolean().default(false),
    stockCount: z.number().int().default(-1),
    hiddenByPlanLimit: z.boolean().default(false),
});

// Newsletter Subscription
export const NewsletterSchema = z.object({
    email: z.string().email(),
    creatorId: z.any(),
    source: z.string().optional()
});

// User Update
export const UserUpdateSchema = z.object({
    displayName: z.string().min(2).max(50).optional(),
    username: z.string().regex(/^[a-zA-Z0-9_]+$/).min(3).max(30).optional(),
    avatar: z.string().url().optional(),
    bio: z.string().max(500).optional()
});

// Checkout Validation
export const CheckoutSchema = z.object({
    cart: z.array(z.object({
        id: z.string(),
        quantity: z.number().int().min(1),
        variantId: z.string().optional(),
        variantTitle: z.string().optional(),
        price: z.number().optional(),
        metadata: z.record(z.string(), z.any()).optional()
    })).min(1),
    customer: z.object({
        email: z.string().email(),
        name: z.string().min(1),
        phone: z.string().optional()
    }),
    couponCode: z.string().optional().nullable()
});

// Coupon Validation
export const CouponSchema = z.object({
    code: z.string().min(3).max(20).toUpperCase(),
    discountType: z.enum(['percentage', 'fixed', 'free', 'bogo']),
    discountValue: z.number().min(0),
    appliesTo: z.enum(['all', 'specific', 'type', 'minimum']).default('all'),
    applicableProducts: z.array(z.string()).optional(),
    minOrderAmount: z.number().min(0).default(0),
    usageLimit: z.number().int().min(0).default(0),
    usageLimitPerUser: z.number().int().min(0).default(0),
    validFrom: z.date().or(z.string().transform(val => new Date(val))).default(() => new Date()),
    validUntil: z.date().or(z.string().transform(val => new Date(val))).optional(),
    isActive: z.boolean().default(true),
    bogoConfig: z.object({
        buyQuantity: z.number().int().min(1).default(1),
        getQuantity: z.number().int().min(1).default(1),
        getDiscountValue: z.number().min(0).max(100).default(100)
    }).optional(),
    internalNote: z.string().optional(),
    showHintOnStorefront: z.boolean().default(false),
});
