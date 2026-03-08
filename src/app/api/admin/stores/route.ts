import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { withAdminAuth } from '@/lib/auth/withAuth';
import CreatorProfile from '@/lib/models/CreatorProfile';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
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

        const query: any = {};
        if (search) {
            query.$or = [
                { storeName: { $regex: search, $options: 'i' } },
                { customDomain: { $regex: search, $options: 'i' } }
            ];
        }
        if (status && status !== 'all') {
            if (status === 'active') query.isPublished = true;
            if (status === 'suspended') query.isPublished = false; // Simple mapping for now
        }

        const [profiles, total] = await Promise.all([
            CreatorProfile.find(query)
                .populate('creatorId', 'displayName username email avatar status')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            CreatorProfile.countDocuments(query)
        ]);

        // Enrich with product counts and revenue (sequential for simplicity, could be optimized with aggregation)
        const stores = await Promise.all(profiles.map(async (p: any) => {
            const [productCount, orders] = await Promise.all([
                Product.countDocuments({ creatorId: p.creatorId?._id, deletedAt: null }),
                Order.find({ creatorId: p.creatorId?._id, status: 'paid' }).select('total')
            ]);
            const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0) / 100;

            return {
                ...p,
                productCount,
                revenue,
                totalOrders: orders.length
            };
        }));

        const stats = {
            total: await CreatorProfile.countDocuments(),
            active: await CreatorProfile.countDocuments({ isPublished: true }),
            suspended: await CreatorProfile.countDocuments({ isPublished: false }),
            flagged: 0 // Will add flag field to CreatorProfile if needed, or use a default
        };

        return NextResponse.json({
            stores,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            },
            stats
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

// PATCH /api/admin/stores/[id] - Handled in separate file if using Next.js conventions
// But I'll create the base route for bulk if needed.
