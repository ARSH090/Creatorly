import { z } from 'zod';

export const UserRegistrationSchema = z.object({
    username: z.string().min(3).max(20).regex(/^[a-z0-9_-]+$/, "Username must be alphanumeric, hyphens, and underscores only"),
    email: z.string().email("Please enter a valid email"),
    password: z.string()
        .min(12, "Password must be at least 12 characters")
        .regex(/[A-Z]/, "Password must include an uppercase letter")
        .regex(/[a-z]/, "Password must include a lowercase letter")
        .regex(/[0-9]/, "Password must include a number")
        .regex(/[^A-Za-z0-9]/, "Password must include a special character"),
    displayName: z.string().min(2).max(50),
    fingerprint: z.string().optional(),
});

export const ProductSchema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().min(10),
    price: z.number().min(1),
    category: z.string(),
    type: z.enum(['Digital Goods', 'Consultations', 'Physical Goods']), // This might need to match the new enum in Product.ts if widely used
    image: z.string().url(),
    digitalFileUrl: z.string().optional(),
});

export const RazorpayOrderSchema = z.object({
    amount: z.number().min(1),
    productId: z.string(),
    creatorId: z.string(),
    customerEmail: z.string().email(),
});
