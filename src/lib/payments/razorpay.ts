
import Razorpay from 'razorpay';
import crypto from 'crypto';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('Razorpay credentials missing in environment variables');
}

export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id_for_build',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret_for_build',
});

/**
 * Returns a Razorpay instance. If credentials are provided, it returns a custom instance (for P2P).
 * Otherwise, it returns the global platform instance.
 */
export const getRazorpayInstance = (credentials?: { keyId: string; keySecret: string }) => {
    if (credentials?.keyId && credentials?.keySecret) {
        return new Razorpay({
            key_id: credentials.keyId,
            key_secret: credentials.keySecret,
        });
    }
    return razorpay;
};

export interface IRazorpayOrderOptions {
    amount: number; // in paise
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
}

export const createRazorpayOrder = async (options: IRazorpayOrderOptions, credentials?: { keyId: string; keySecret: string }) => {
    try {
        const instance = getRazorpayInstance(credentials);
        const order = await instance.orders.create(options);
        return order;
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw error;
    }
};

export const verifyRazorpaySignature = (
    orderId: string,
    paymentId: string,
    signature: string
): boolean => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error('Razorpay secret not found');

    const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    return generatedSignature === signature;
};

/**
 * Creates or updates a Plan in Razorpay
 */
export const syncRazorpayPlan = async (options: {
    name: string;
    description?: string;
    amount: number; // in INR
    interval: 'monthly' | 'yearly';
}) => {
    try {
        const plan = await razorpay.plans.create({
            period: options.interval === 'monthly' ? 'monthly' : 'yearly',
            interval: 1,
            item: {
                name: options.name + (options.interval === 'monthly' ? ' (Monthly)' : ' (Yearly)'),
                amount: options.amount, // already in paise
                currency: 'INR',
                description: options.description || `Creatorly ${options.name} ${options.interval} plan`
            }
        });
        return plan;
    } catch (error) {
        console.error(`Error syncing Razorpay plan (${options.interval}):`, error);
        throw error;
    }
};

/**
 * Creates an Offer in Razorpay for synchronization
 */
export const syncRazorpayOffer = async (options: {
    name: string;
    code: string;
    description?: string;
    type: 'percentage' | 'fixed';
    value: number;
    maxAmount?: number;
    validUntil?: Date;
}) => {
    try {
        const offer = await (razorpay as any).offers.create({
            name: options.name || options.code,
            display_name: options.description || `Discount code ${options.code}`,
            payment_method: 'all',
            type: 'discount',
            item_type: 'plan', // For subscriptions
            discount: {
                type: options.type === 'percentage' ? 'percentage' : 'flat',
                value: options.type === 'percentage' ? options.value : Math.round(options.value * 100) // to paise
            },
            max_amount: options.maxAmount ? Math.round(options.maxAmount * 100) : undefined,
            valid_till: options.validUntil ? Math.floor(options.validUntil.getTime() / 1000) : undefined,
        } as any); // Cast because types might be strict
        return offer;
    } catch (error) {
        console.error(`Error syncing Razorpay offer (${options.code}):`, error);
        throw error;
    }
};
