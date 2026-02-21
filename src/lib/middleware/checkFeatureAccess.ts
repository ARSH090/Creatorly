import { NextRequest, NextResponse } from 'next/server';
import { TIER_LIMITS, FEATURE_GATE_ERRORS } from '../constants/tier-limits';
import { getCurrentUser } from '../auth/server-auth';
import { User } from '../models/User';
import { shouldDowngrade } from '../utils/tier-utils';

export type FeatureType =
    | 'products'
    | 'leadMagnets'
    | 'bookings'
    | 'leads'
    | 'ordersLifetime'
    | 'storage'
    | 'community'
    | 'emailBroadcasts'
    | 'customDomain'
    | 'affiliates'
    | 'discountCodes'
    | 'upsells'
    | 'analytics'
    | 'apiAccess'
    | 'teamMembers';

interface FeatureCheckResult {
    allowed: boolean;
    limit?: number;
    current?: number;
    errorCode?: string;
    upgradeUrl?: string;
    message?: string;
}

/**
 * Check if user has access to a specific feature
 * Call this before any tier-gated operation
 */
export async function checkFeatureAccess(
    userId: string,
    feature: FeatureType,
    currentCount?: number
): Promise<FeatureCheckResult> {
    try {
        // Fetch user with tier info
        const user = await User.findById(userId).select(
            'subscriptionTier subscriptionStatus subscriptionEndAt isFlagged freeTierOrdersCount freeTierLeadsCount storageUsageMb planLimits'
        );

        if (!user) {
            return {
                allowed: false,
                errorCode: 'USER_NOT_FOUND',
                message: 'User not found'
            };
        }

        // Check if account is banned
        if (user.subscriptionStatus === 'banned' || user.isFlagged) {
            return {
                allowed: false,
                errorCode: FEATURE_GATE_ERRORS.ACCOUNT_BANNED,
                message: user.flagReason || 'Account suspended. Contact support.'
            };
        }

        // Auto-downgrade if subscription expired
        let tier = user.subscriptionTier || 'free';
        if (shouldDowngrade(user.subscriptionStatus, user.subscriptionEndAt)) {
            tier = 'free';
            // Update DB (async, don't block)
            User.findByIdAndUpdate(userId, {
                subscriptionTier: 'free',
                subscriptionStatus: 'expired'
            }).exec();
        }

        // Get tier limits
        // 1. Check for User-specific overrides or trial limits stored in the user record
        const userLimits = user.planLimits as any;

        let limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS] as Record<string, any>;

        // 2. If user has explicit planLimits (from trial setup), use those
        if (userLimits) {
            limits = { ...limits, ...userLimits };
            // Map common keys if they differ (e.g. maxProducts vs products)
            if (userLimits.maxProducts !== undefined) limits.products = userLimits.maxProducts;
            if (userLimits.maxStorageMb !== undefined) limits.storage = userLimits.maxStorageMb;
            if (userLimits.maxTeamMembers !== undefined) limits.teamMembers = userLimits.maxTeamMembers;
            if (userLimits.maxAiGenerations !== undefined) limits.aiGenerations = userLimits.maxAiGenerations;
        }

        if (!limits) {
            return {
                allowed: false,
                errorCode: 'INVALID_TIER',
                message: 'Invalid subscription tier'
            };
        }

        // Check specific feature limit
        const limitKey = feature === 'storage' ? 'storageMb' : feature;
        const limit = limits[limitKey];

        // Boolean features (community, customDomain, etc.)
        if (typeof limit === 'boolean') {
            if (!limit) {
                return {
                    allowed: false,
                    errorCode: FEATURE_GATE_ERRORS[feature.toUpperCase() as keyof typeof FEATURE_GATE_ERRORS] || 'FEATURE_GATE',
                    upgradeUrl: `/pricing?feature=${feature}`,
                    message: `Upgrade required to access ${feature}`
                };
            }
            return { allowed: true };
        }

        // Numeric limits
        if (typeof limit === 'number') {
            let usage = currentCount ?? 0;

            // Special handling for monotonic counters
            if (feature === 'ordersLifetime') {
                usage = user.freeTierOrdersCount || 0;
            } else if (feature === 'leads') {
                usage = user.freeTierLeadsCount || 0;
            } else if (feature === 'storage') {
                usage = user.storageUsageMb || 0;
            }

            if (limit === Infinity || usage < limit) {
                return {
                    allowed: true,
                    limit,
                    current: usage
                };
            }

            return {
                allowed: false,
                errorCode: FEATURE_GATE_ERRORS[feature.toUpperCase() as keyof typeof FEATURE_GATE_ERRORS] || 'FEATURE_GATE',
                limit,
                current: usage,
                upgradeUrl: `/pricing?feature=${feature}`,
                message: `${feature} limit reached (${usage}/${limit}). Upgrade to continue.`
            };
        }

        // Default: allow if not explicitly limited
        return { allowed: true };

    } catch (error) {
        console.error('Feature access check failed:', error);
        return {
            allowed: false,
            errorCode: 'CHECK_FAILED',
            message: 'Failed to verify feature access'
        };
    }
}

/**
 * Middleware factory for feature gating
 * Usage: router.post('/api/products', auth, checkFeatureGate('products'), handler)
 */
export function checkFeatureGate(feature: FeatureType, getCurrentCount?: (userId: string) => Promise<number>) {
    return async (req: NextRequest) => {
        try {
            const user = await getCurrentUser();

            if (!user) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }

            const currentCount = getCurrentCount ? await getCurrentCount(user._id.toString()) : undefined;
            const check = await checkFeatureAccess(user._id.toString(), feature, currentCount);

            if (!check.allowed) {
                return NextResponse.json({
                    error: check.message || 'Upgrade required',
                    code: check.errorCode,
                    limit: check.limit,
                    current: check.current,
                    upgrade_url: check.upgradeUrl
                }, { status: 403 });
            }

            // Store check result in request for handler to use
            (req as any).featureCheck = check;

        } catch (error) {
            console.error('Feature gate middleware error:', error);
            return NextResponse.json(
                { error: 'Feature access check failed' },
                { status: 500 }
            );
        }
    };
}

/**
 * Get tier status for a user (for frontend display)
 */
export async function getTierStatus(userId: string) {
    const user = await User.findById(userId).select(
        'subscriptionTier subscriptionStatus subscriptionEndAt freeTierOrdersCount freeTierLeadsCount storageUsageMb'
    );

    if (!user) {
        throw new Error('User not found');
    }

    let tier = user.subscriptionTier || 'free';
    if (shouldDowngrade(user.subscriptionStatus, user.subscriptionEndAt)) {
        tier = 'free';
    }

    const limits = TIER_LIMITS[tier];

    // TODO: Fetch actual product/lead counts from DB
    // For now, using placeholder logic

    return {
        tier,
        status: user.subscriptionStatus,
        subscription_end_at: user.subscriptionEndAt,
        limits: {
            products: { used: 0, limit: limits.products },
            leadMagnets: { used: 0, limit: limits.leadMagnets },
            bookings: { used: 0, limit: limits.bookings },
            leads: { used: user.freeTierLeadsCount || 0, limit: limits.leads },
            orders: {
                lifetime_used: user.freeTierOrdersCount || 0,
                limit: limits.ordersLifetime
            },
            storage_mb: { used: user.storageUsageMb || 0, limit: limits.storageMb }
        },
        platform_fee_percent: limits.feePercent,
        upgrade_url: '/pricing'
    };
}
