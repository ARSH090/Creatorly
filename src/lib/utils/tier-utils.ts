import crypto from 'crypto';
import { BLOCKED_EMAIL_DOMAINS } from '../constants/tier-limits'

    ;

/**
 * Hash phone number using SHA256
 * Always use this before storing phone numbers
 */
export function hashPhoneNumber(phone: string): string {
    // Normalize: remove spaces, dashes, ensure +91 prefix
    const normalized = phone.replace(/[\s\-]/g, '');
    const withPrefix = normalized.startsWith('+91') ? normalized : `+91${normalized}`;

    return crypto.createHash('sha256').update(withPrefix).digest('hex');
}

/**
 * Validate Indian phone number format
 */
export function isValidIndianPhone(phone: string): boolean {
    // Must be exactly 10 digits after +91
    const cleaned = phone.replace(/[\s\-+]/g, '');
    const indiaRegex = /^(91)?[6-9]\d{9}$/;
    return indiaRegex.test(cleaned);
}

/**
 * Check if email domain is disposable/blocked
 */
export function isBlockedEmailDomain(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return true;

    return BLOCKED_EMAIL_DOMAINS.includes(domain);
}

/**
 * Calculate platform fee based on tier
 */
export function calculatePlatformFee(
    amountPaise: number,
    tier: 'free' | 'starter' | 'pro' | 'business'
): { grossAmount: number; platformFee: number; creatorPayout: number; feePercent: number } {
    let feePercent: number;

    switch (tier) {
        case 'free':
            feePercent = 10;
            break;
        case 'starter':
            feePercent = 5;
            break;
        case 'pro':
            feePercent = 2;
            break;
        case 'business':
            feePercent = 0;
            break;
        default:
            feePercent = 10;
    }

    const platformFee = Math.floor((amountPaise * feePercent) / 100);
    const creatorPayout = amountPaise - platformFee;

    return {
        grossAmount: amountPaise,
        platformFee,
        creatorPayout,
        feePercent
    };
}

/**
 * Detect if IP is likely VPN/Proxy/Tor
 * In production, use a service like ipqualityscore.com or ip-api.com
 */
export async function checkIPQuality(ipAddress: string): Promise<{
    isProxy: boolean;
    isVPN: boolean;
    isTor: boolean;
    country: string;
}> {
    try {
        // Using ip-api.com (free tier, 45 req/min)
        const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,proxy`);
        const data = await response.json();

        if (data.status === 'success') {
            return {
                isProxy: data.proxy || false,
                isVPN: false, // ip-api free tier doesn't detect VPN, upgrade to pro
                isTor: false,
                country: data.country || 'Unknown'
            };
        }
    } catch (error) {
        console.error('IP quality check failed:', error);
    }

    // Default fallback
    return {
        isProxy: false,
        isVPN: false,
        isTor: false,
        country: 'Unknown'
    };
}

/**
 * Validate device fingerprint format
 */
export function isValidDeviceFingerprint(fingerprint: string): boolean {
    // Must be a valid hash-like string (alphanumeric, 32+ chars)
    return /^[a-f0-9]{32,}$/i.test(fingerprint);
}

/**
 * Generate upgrade URL based on feature
 */
export function getUpgradeUrl(featureCode: string): string {
    return `/pricing?feature=${featureCode}`;
}

/**
 * Check if user should be downgraded (expired subscription)
 */
export function shouldDowngrade(
    subscriptionStatus: string,
    subscriptionEndAt?: Date
): boolean {
    if (subscriptionStatus === 'banned' || subscriptionStatus === 'expired') {
        return true;
    }

    if (subscriptionStatus === 'cancelled' && subscriptionEndAt) {
        return new Date() > new Date(subscriptionEndAt);
    }

    if (subscriptionStatus === 'active' && subscriptionEndAt) {
        // Grace period: 3 days per business requirements
        const gracePeriodEnd = new Date(subscriptionEndAt);
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);
        return new Date() > gracePeriodEnd;
    }

    return false;
}
