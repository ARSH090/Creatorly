import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/products/stats
 * Get product counts by status
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const stats = await Product.aggregate([
        {
            $match: { creatorId: user._id }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const statsMap = stats.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
    }, {} as Record<string, number>);

    return {
        total: stats.reduce((sum, s) => sum + s.count, 0),
        draft: statsMap.draft || 0,
        published: statsMap.published || 0,
        archived: statsMap.archived || 0
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
