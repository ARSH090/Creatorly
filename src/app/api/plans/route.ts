import { NextRequest, NextResponse } from 'next/server';
import { getAllPlans } from '@/lib/planCache';

/**
 * GET /api/plans
 * Returns active plans from Redis cache (invalidated on admin changes)
 */
export async function GET(req: NextRequest) {
    try {
        const plans = await getAllPlans();

        return NextResponse.json(
            { plans },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
                }
            }
        );
    } catch (error: any) {
        console.error('API /api/plans failed:', error);
        return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }
}
