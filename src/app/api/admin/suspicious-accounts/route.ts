import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { withAdminAuth } from '@/lib/auth/withAdminAuth';
import { SuspiciousAccount } from '@/lib/models/SuspiciousAccount';
import { User } from '@/lib/models/User';

/**
 * GET /api/admin/suspicious-accounts
 * List all flagged accounts with details
 */
export const GET = withAdminAuth(async (req: NextRequest) => {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const actionFilter = searchParams.get('action'); // flagged, banned, kyc_required

        const skip = (page - 1) * limit;

        const query: any = {};
        if (actionFilter) {
            query.actionTaken = actionFilter;
        }

        const [accounts, total] = await Promise.all([
            SuspiciousAccount.find(query)
                .populate('userId', 'email username subscriptionTier subscriptionStatus')
                .populate('matchingUserId', 'email username')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            SuspiciousAccount.countDocuments(query)
        ]);

        return NextResponse.json({
            accounts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('Suspicious accounts fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch suspicious accounts', details: error.message },
            { status: 500 }
        );
    }
});
