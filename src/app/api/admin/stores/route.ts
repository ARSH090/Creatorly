import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/models/User';
import { withAdminAuth } from '@/lib/auth/withAuth';
import AuditLog from '@/lib/models/AuditLog';

// GET /api/admin/stores
export const GET = withAdminAuth(async (req) => {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status'); // active, suspended

        await connectToDatabase();

        const query: any = { role: 'creator' };
        if (search) {
            query.$or = [
                { displayName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { storeSlug: { $regex: search, $options: 'i' } }
            ];
        }
        if (status && status !== 'all') {
            query.storeStatus = status;
        }

        const [stores, total] = await Promise.all([
            User.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            User.countDocuments(query)
        ]);

        return NextResponse.json({
            stores,
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

// PATCH /api/admin/stores/[id] - Handled in separate file if using Next.js conventions
// But I'll create the base route for bulk if needed.
