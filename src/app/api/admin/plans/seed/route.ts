import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { seedDefaultPlans } from '@/lib/seeds/seedPlans';

/**
 * POST /api/admin/plans/seed
 * Admin-only endpoint to seed/upsert default plans.
 * Safe to call multiple times (idempotent).
 */
export const POST = withAdminAuth(async () => {
    try {
        const result = await seedDefaultPlans();
        return NextResponse.json({
            success: true,
            ...result
        });
    } catch (error: any) {
        console.error('Plan seed error:', error);
        return NextResponse.json(
            { error: 'Failed to seed plans', details: error.message },
            { status: 500 }
        );
    }
});
