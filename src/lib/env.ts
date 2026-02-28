import { z } from 'zod';

const envSchema = z.object({
    // Required Database
    MONGODB_URI: z.string().url(),

    // Optional Firebase Admin (legacy — primary auth is Clerk)
    FIREBASE_PROJECT_ID: z.string().min(1).optional(),
    FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
    FIREBASE_PRIVATE_KEY: z.string().min(1).optional(),

    // Optional Firebase Client (legacy)
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1).optional(),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1).optional(),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1).optional(),

    // Required Razorpay
    RAZORPAY_KEY_ID: z.string().min(1).optional(),
    RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
    NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1).optional(),

    // Required AWS S3 (for product uploads)
    AWS_REGION: z.string().min(1).optional(),
    AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
    AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    AWS_S3_BUCKET_NAME: z.string().min(1).optional(),

    // Application
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    JWT_SECRET: z.string().min(1).optional(),
});

export const validateEnv = () => {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('❌ Invalid environment variables:');
            console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
            throw new Error('Invalid environment variables');
        }
        throw error;
    }
};

export const env = validateEnv();
