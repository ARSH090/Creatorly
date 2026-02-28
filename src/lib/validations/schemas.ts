import { z } from 'zod';

/**
 * Centralized Zod validation schemas for ALL API route inputs.
 * Import from here instead of defining inline.
 */

// ── Auth Schemas ──
export const LoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const RegisterSchema = z.object({
    email: z.string().email('Invalid email address').max(255),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, hyphens, and underscores'),
    displayName: z.string().min(1, 'Display name is required').max(100),
});

export const ForgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});

// ── Product Schemas ──
export const CreateProductSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title max 200 characters'),
    description: z.string().max(5000, 'Description max 5000 characters').optional().default(''),
    price: z.number().min(0, 'Price cannot be negative').max(999999, 'Price too high').optional().default(0),
    productType: z.enum(['digital', 'course', 'coaching', 'membership', 'template', 'ebook', 'other']).optional().default('digital'),
    pricingType: z.enum(['fixed', 'pwyw', 'free']).optional().default('fixed'),
    thumbnail: z.string().url().optional().or(z.literal('')),
    files: z.array(z.object({
        key: z.string(),
        name: z.string(),
        size: z.number().optional(),
        type: z.string().optional(),
    })).optional().default([]),
    tags: z.array(z.string()).max(20, 'Max 20 tags').optional().default([]),
    category: z.string().max(100).optional().default(''),
    isPublic: z.boolean().optional().default(false),
    downloadLimit: z.number().int().min(1).max(100).optional().default(3),
    currency: z.string().length(3).optional().default('INR'),
});

export const UpdateProductSchema = CreateProductSchema.partial();

// ── Order Schemas ──
export const CreateOrderSchema = z.object({
    productId: z.string().min(1),
    buyerEmail: z.string().email(),
    buyerName: z.string().min(1).max(200).optional(),
    paymentMethod: z.enum(['razorpay', 'stripe', 'paypal', 'upi', 'bank']),
    couponCode: z.string().optional(),
});

// ── User Settings Schema ──
export const UpdateSettingsSchema = z.object({
    autoSendEnabled: z.boolean().optional(),
    notificationPrefs: z.object({
        email: z.boolean().optional(),
        whatsapp: z.boolean().optional(),
    }).optional(),
    storeSlug: z.string()
        .min(3).max(30)
        .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
        .optional(),
});

// ── Coupon Schema ──
export const CouponSchema = z.object({
    code: z.string().min(3).max(20).regex(/^[A-Z0-9_-]+$/),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().positive(),
    maxUses: z.number().int().positive().optional(),
    expiresAt: z.string().datetime().optional(),
    productIds: z.array(z.string()).optional(),
});

// ── Email Blast Schema ──
export const EmailBlastSchema = z.object({
    subject: z.string().min(1, 'Subject is required').max(200),
    content: z.string().min(1, 'Content is required').max(50000),
    targetGroup: z.enum(['all', 'free', 'starter', 'pro', 'business']),
});

/**
 * Safe parse helper — returns typed data or null + errors
 */
export function validateBody<T extends z.ZodType>(schema: T, data: unknown): {
    success: boolean;
    data: z.infer<T> | null;
    errors: z.ZodError | null;
} {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data, errors: null };
    }
    return { success: false, data: null, errors: result.error };
}
