import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { errorResponse } from '@/types/api';

async function bulkHandler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const { action, ids } = await req.json();

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(errorResponse('No product IDs provided'), { status: 400 });
        }

        const filter = { _id: { $in: ids }, creatorId: user._id };

        switch (action) {
            case 'publish':
                await Product.updateMany(filter, { status: 'published', publishedAt: new Date() });
                break;
            case 'unpublish':
                await Product.updateMany(filter, { status: 'draft' });
                break;
            case 'archive':
                await Product.updateMany(filter, { status: 'archived', archivedAt: new Date() });
                break;
            case 'delete':
                await Product.updateMany(filter, { isDeleted: true, deletedAt: new Date() });
                break;
            default:
                return NextResponse.json(errorResponse('Invalid bulk action'), { status: 400 });
        }

        return NextResponse.json({ success: true, count: ids.length });
    } catch (error: any) {
        console.error('Bulk Product Action Error:', error);
        return NextResponse.json(errorResponse('Failed to execute bulk action', error.message), { status: 500 });
    }
}

export const POST = withCreatorAuth(bulkHandler);
