import { NextRequest, NextResponse } from 'next/server';
import { getTierStatus } from '@/lib/middleware/checkFeatureAccess';
import { getCurrentUser } from '@/lib/auth/server-auth';

/**
 * GET /api/user/tier-status
 * Returns current tier, limits, usage, and days remaining
 */
export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tierStatus = await getTierStatus(user._id.toString());

        return NextResponse.json(tierStatus);

    } catch (error: any) {
        console.error('Tier status error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tier status', details: error.message },
            { status: 500 }
        );
    }
}
