import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Lead from '@/lib/models/Lead';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { checkAdminPermission } from '@/lib/middleware/adminAuth';

export const dynamic = 'force-dynamic';

export const GET = withAdminAuth(async (req: NextRequest, user: any) => {
    try {
        if (!checkAdminPermission('view_leads', user.role)) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const source = searchParams.get('source') || '';
        const creatorId = searchParams.get('creatorId') || '';

        const skip = (page - 1) * limit;

        // Build query
        const query: any = {};

        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        if (source) {
            query.source = source;
        }

        if (creatorId) {
            query.creatorId = creatorId;
        }

        const [leads, total] = await Promise.all([
            Lead.find(query)
                .populate('creatorId', 'email displayName')
                .populate('leadMagnetId', 'title')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Lead.countDocuments(query)
        ]);

        return NextResponse.json({
            leads,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
                limit
            }
        });

    } catch (error: any) {
        console.error('Admin Fetch Leads Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch leads' },
            { status: 500 }
        );
    }
});
