import { NextRequest, NextResponse } from 'next/server';
import { getCachedPlans } from '@/lib/cache/plan-cache';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/plans
 * Returns active plans — cached for 5 minutes via Next.js unstable_cache.
 * Cache is busted by admin calling revalidateTag('plans') after a Razorpay sync.
 */
async function handler(req: NextRequest) {
    const plans = await getCachedPlans();

    return NextResponse.json(
        { plans },
        {
            headers: {
                // CDN cache for 4 minutes (slightly less than server TTL to avoid stale)
                'Cache-Control': 'public, s-maxage=240, stale-while-revalidate=60',
            }
        }
    );
}

export const GET = withErrorHandler(handler);
