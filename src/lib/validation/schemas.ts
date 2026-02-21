import { z } from 'zod';

// Product Validation
export const ProductSchema = z.object({
    name: z.string().min(3).max(100),
    type: z.enum(['digital', 'course', 'membership', 'physical', 'coaching']),
    price: z.number().min(0),
    currency: z.string().default('INR'),
    category: z.string().min(2),
    image: z.string().url(),
    description: z.string().optional(),
    isPublic: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    isFeaturedInCollections: z.boolean().default(false).optional(),
    files: z.array(z.object({
        name: z.string(),
        url: z.string().url(),
        size: z.number().optional(),
        mimeType: z.string().optional()
    })).optional(),

    // Variants
    hasVariants: z.boolean().optional(),
    variants: z.array(z.object({
        id: z.string(),
        title: z.string(),
        price: z.number().or(z.string().transform(val => Number(val))),
        stock: z.number().optional().nullable(),
        isActive: z.boolean().optional()
    })).optional()
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
