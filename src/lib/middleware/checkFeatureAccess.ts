import { NextRequest, NextResponse } from 'next/server';
import { TIER_LIMITS, FEATURE_GATE_ERRORS } from '../constants/tier-limits';
import { getCurrentUser } from '../auth/server-auth';
import { User } from '../models/User';
import { shouldDowngrade } from '../utils/tier-utils';
import Product from '../models/Product';
import Subscriber from '../models/Subscriber';
import Booking from '../models/Booking';
import { AutoDMRule } from '../models/AutoDMRule';
import Team from '../models/Team';

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

        // 2. Fetch limit from Dynamic Cache
        const { getLimit } = await import('../planCache');
        const limit = await getLimit(tier, feature === 'storage' ? 'storageMb' : feature);

        if (limit === null) {
            return {
                allowed: false,
                errorCode: 'INVALID_LIMIT',
                message: `Limit for ${feature} not configured in plan ${tier}`
            };
        }

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
            let usage = currentCount;

            // Fetch real-time usage if not provided
            if (usage === undefined) {
                if (feature === 'products') {
                    usage = await Product.countDocuments({ creatorId: userId, deletedAt: null });
                } else if (feature === 'leads') {
                    usage = await Subscriber.countDocuments({ creatorId: userId, status: 'active' });
                } else if (feature === 'bookings') {
                    usage = await Booking.countDocuments({ creatorId: userId, status: { $ne: 'cancelled' } });
                } else if (feature === 'teamMembers') {
                    usage = await Team.countDocuments({ creatorId: userId });
                } else if (feature === 'ordersLifetime') {
                    usage = user.freeTierOrdersCount || 0;
                } else if (feature === 'storage') {
                    usage = user.storageUsageMb || 0;
                } else {
                    usage = 0;
                }
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

    // Fetch actual counts from DB
    const [productCount, leadCount, bookingCount] = await Promise.all([
        Product.countDocuments({ creatorId: userId, deletedAt: null }),
        Subscriber.countDocuments({ creatorId: userId, status: 'active' }),
        Booking.countDocuments({ creatorId: userId, status: { $ne: 'cancelled' } })
    ]);

    return {
        tier,
        status: user.subscriptionStatus,
        subscription_end_at: user.subscriptionEndAt,
        limits: {
            products: { used: productCount, limit: limits.products },
            leadMagnets: { used: 0, limit: limits.leadMagnets }, // TODO: Add LeadMagnet model count
            bookings: { used: bookingCount, limit: limits.bookings },
            leads: { used: leadCount, limit: limits.leads },
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

