import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Payout } from '@/lib/models/Payout';
import { User } from '@/lib/models/User';
import { withAdminAuth } from '@/lib/auth/withAuth';
import AuditLog from '@/lib/models/AuditLog';

// GET /api/admin/withdrawals
export const GET = withAdminAuth(async (req) => {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const status = searchParams.get('status'); // pending, approved, paid, rejected

        await connectToDatabase();

        const query: any = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const [payouts, total] = await Promise.all([
            Payout.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('creatorId', 'displayName email storeSlug')
                .lean(),
            Payout.countDocuments(query)
        ]);

        return NextResponse.json({
            payouts,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

// PATCH /api/admin/withdrawals/[id] - handled in separate file
