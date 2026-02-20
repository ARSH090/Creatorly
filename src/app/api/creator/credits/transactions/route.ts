import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AICreditTransaction } from '@/lib/models/AICredit';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/credits/transactions
 * Get credit transaction history
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: any = { creatorId: user._id };

    // Filter by transaction type
    if (type) {
        query.type = type;
    }

    // Filter by date range
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
            query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            query.createdAt.$lte = new Date(endDate);
        }
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
        AICreditTransaction.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        AICreditTransaction.countDocuments(query)
    ]);

    return {
        transactions,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
