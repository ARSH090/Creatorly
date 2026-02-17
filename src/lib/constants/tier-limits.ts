// Tier Management Constants
export const TIER = {
    FREE: 'free',
    CREATOR: 'creator',
    PRO: 'pro'
} as const;

export const SUBSCRIPTION_STATUS = {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
    BANNED: 'banned'
} as const;

export const KYC_STATUS = {
    NONE: 'none',
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected'
} as const;

// Tier Limits Configuration
export const TIER_LIMITS = {
    [TIER.FREE]: {
        products: 1,
        leadMagnets: 1,
        bookings: 1,
        leads: 100,
        ordersLifetime: 50,
        storageMb: 200,
        feePercent: 10,
        analytics: false,
        emailBroadcasts: false,
        community: false,
        customDomain: false,
        watermark: true,
        affiliates: false,
        discountCodes: false,
        upsells: false
    },
    [TIER.CREATOR]: {
        products: Infinity,
        leadMagnets: Infinity,
        bookings: Infinity,
        leads: Infinity,
        ordersLifetime: Infinity,
        storageMb: 20480, // 20GB
        feePercent: 2,
        analytics: true,
        emailBroadcasts: true,
        community: true,
        customDomain: true,
        watermark: false,
        affiliates: true,
        discountCodes: true,
        upsells: true
    },
    [TIER.PRO]: {
        products: Infinity,
        leadMagnets: Infinity,
        bookings: Infinity,
        leads: Infinity,
        ordersLifetime: Infinity,
        storageMb: 102400, // 100GB
        feePercent: 0,
        analytics: true,
        emailBroadcasts: true,
        community: true,
        customDomain: true,
        watermark: false,
        affiliates: true,
        discountCodes: true,
        upsells: true,
        prioritySupport: true,
        whiteLabel: true,
        advancedAnalytics: true,
        teamMembers: 5,
        apiAccess: true
    }
} as const;

// Disposable Email Domains (Auto-block)
export const BLOCKED_EMAIL_DOMAINS = [
    'tempmail.com',
    'mailinator.com',
    'guerrillamail.com',
    'yopmail.com',
    'throwam.com',
    'sharklasers.com',
    'trashmail.com',
    'fakeinbox.com',
    'maildrop.cc',
    '10minutemail.com',
    'temp-mail.org',
    'getnada.com',
    'emailondeck.com',
    'mohmal.com',
    'trashmail.net'
];

// IP Signup Limits
export const IP_SIGNUP_LIMITS = {
    MAX_ACCOUNTS_PER_IP: 3,
    WINDOW_DAYS: 30
};

// Subscription Billing
export const SUBSCRIPTION_PLANS = {
    CREATOR_MONTHLY: {
        tier: TIER.CREATOR,
        period: 'monthly',
        priceINR: 999,
        pricePaise: 99900
    },
    CREATOR_YEARLY: {
        tier: TIER.CREATOR,
        period: 'yearly',
        priceINR: 8999,
        pricePaise: 899900
    },
    PRO_MONTHLY: {
        tier: TIER.PRO,
        period: 'monthly',
        priceINR: 2499,
        pricePaise: 249900
    },
    PRO_YEARLY: {
        tier: TIER.PRO,
        period: 'yearly',
        priceINR: 22999,
        pricePaise: 2299900
    }
};

// Feature Gate Error Codes
export const FEATURE_GATE_ERRORS = {
    PRODUCTS: 'FEATURE_GATE_PRODUCTS',
    LEAD_MAGNETS: 'FEATURE_GATE_LEAD_MAGNETS',
    BOOKINGS: 'FEATURE_GATE_BOOKINGS',
    LEADS: 'FEATURE_GATE_LEADS',
    ORDERS: 'FEATURE_GATE_ORDERS_LIFETIME',
    STORAGE: 'FEATURE_GATE_STORAGE',
    COMMUNITY: 'FEATURE_GATE_COMMUNITY',
    EMAIL_BROADCASTS: 'FEATURE_GATE_EMAIL_BROADCASTS',
    CUSTOM_DOMAIN: 'FEATURE_GATE_CUSTOM_DOMAIN',
    AFFILIATES: 'FEATURE_GATE_AFFILIATES',
    DISCOUNT_CODES: 'FEATURE_GATE_DISCOUNT_CODES',
    UPSELLS: 'FEATURE_GATE_UPSELLS',
    ANALYTICS: 'FEATURE_GATE_ANALYTICS',
    API_ACCESS: 'FEATURE_GATE_API_ACCESS',
    TEAM_MEMBERS: 'FEATURE_GATE_TEAM_MEMBERS',
    ACCOUNT_BANNED: 'ACCOUNT_BANNED'
};

export type TierType = typeof TIER[keyof typeof TIER];
export type SubscriptionStatusType = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS];
export type KYCStatusType = typeof KYC_STATUS[keyof typeof KYC_STATUS];
