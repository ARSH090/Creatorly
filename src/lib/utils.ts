import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { NextRequest } from "next/server"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getClientIp(req: NextRequest | Request) {
    const forwarded = (req as any).headers?.get?.('x-forwarded-for') || (req as any).headers?.['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    return '127.0.0.1';
}

export function getClientUserAgent(req: NextRequest | Request) {
    return (req as any).headers?.get?.('user-agent') || (req as any).headers?.['user-agent'] || 'unknown';
}

/**
 * Generate a unique referral code based on userId.
 */
export function generateReferralCode(userId: string): string {
    // Simple: take last 6 chars of userId and add random suffix
    const suffix = userId.slice(-6);
    const random = Math.random().toString(36).substring(2, 6);
    return `ref_${suffix}${random}`;
}

