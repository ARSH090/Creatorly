
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createCircuitBreaker } from '@/lib/resilience/circuitBreaker';

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

// Create the circuit breaker once at module level (not inside the function)
const _razorpayOrderCreate = async (instance: any, options: IRazorpayOrderOptions, requestOptions: any) => {
    return instance.orders.create(options, requestOptions);
};
const razorpayOrderBreaker = createCircuitBreaker(_razorpayOrderCreate);
razorpayOrderBreaker.fallback(() => {
    throw new Error('Razorpay is temporarily unavailable. Please try again in a moment.');
});

export const createRazorpayOrder = async (
    options: IRazorpayOrderOptions,
    credentials?: { keyId: string; keySecret: string },
    idempotencyKey?: string
) => {
    try {
        const instance = getRazorpayInstance(credentials);
        const requestOptions = idempotencyKey
            ? { headers: { 'X-Razorpay-Idempotency-Key': idempotencyKey } }
            : undefined;
        return await razorpayOrderBreaker.fire(instance, options, requestOptions);
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

/**
 * Razorpay X — Instant Payout API
 * Sends money directly to creator's UPI ID or bank account instantly
 */
export interface RazorpayXPayoutOptions {
    accountNumber: string; // Razorpay X account number (from dashboard)
    amount: number; // in paise
    currency: string;
    mode: 'UPI' | 'IMPS' | 'NEFT';
    purpose: 'payout';
    fund_account: {
        account_type: 'vpa' | 'bank_account';
        vpa?: { address: string }; // for UPI
        bank_account?: { name: string; ifsc: string; account_number: string }; // for bank
        contact: {
            name: string;
            email: string;
            contact: string;
            type: 'vendor';
        };
    };
    narration: string;
    reference_id: string;
}

export async function createRazorpayXPayout(options: RazorpayXPayoutOptions) {
    const keyId = process.env.RAZORPAY_X_KEY_ID;
    const keySecret = process.env.RAZORPAY_X_KEY_SECRET;
    const accountNumber = process.env.RAZORPAY_X_ACCOUNT_NUMBER;

    if (!keyId || !keySecret || !accountNumber) {
        throw new Error('Razorpay X credentials not configured. Set RAZORPAY_X_KEY_ID, RAZORPAY_X_KEY_SECRET, RAZORPAY_X_ACCOUNT_NUMBER');
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    // Step 1: Create contact
    const contactRes = await fetch('https://api.razorpay.com/v1/contacts', {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: options.fund_account.contact.name,
            email: options.fund_account.contact.email,
            contact: options.fund_account.contact.contact,
            type: 'vendor',
        }),
    });
    const contact = await contactRes.json();
    if (!contactRes.ok) throw new Error(`Contact creation failed: ${JSON.stringify(contact)}`);

    // Step 2: Create fund account
    const faPayload: any = {
        contact_id: contact.id,
        account_type: options.fund_account.account_type,
    };
    if (options.fund_account.account_type === 'vpa' && options.fund_account.vpa) {
        faPayload.vpa = { address: options.fund_account.vpa.address };
    } else if (options.fund_account.bank_account) {
        faPayload.bank_account = options.fund_account.bank_account;
    }

    const faRes = await fetch('https://api.razorpay.com/v1/fund_accounts', {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(faPayload),
    });
    const fundAccount = await faRes.json();
    if (!faRes.ok) throw new Error(`Fund account creation failed: ${JSON.stringify(fundAccount)}`);

    // Step 3: Create payout
    const payoutRes = await fetch('https://api.razorpay.com/v1/payouts', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
            'X-Payout-Idempotency': options.reference_id, // prevent duplicate payouts
        },
        body: JSON.stringify({
            account_number: accountNumber,
            fund_account_id: fundAccount.id,
            amount: options.amount,
            currency: options.currency,
            mode: options.mode,
            purpose: 'payout',
            narration: options.narration,
            reference_id: options.reference_id,
        }),
    });
    const payout = await payoutRes.json();
    if (!payoutRes.ok) throw new Error(`Payout creation failed: ${JSON.stringify(payout)}`);

    return payout;
}
