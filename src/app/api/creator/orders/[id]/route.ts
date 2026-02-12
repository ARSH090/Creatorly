import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Order } from '@/lib/models/Order';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/orders/:id
 * Get detailed order information
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const orderId = params.id;

    const order = await Order.findOne({
        _id: orderId,
        creatorId: user._id
    }).populate('items.productId', 'name type files')
        .populate('affiliateId', 'displayName email');

    if (!order) {
        throw new Error('Order not found');
    }

    // Get download tokens for this order if digital products
    const { DownloadToken } = await import('@/lib/models/DownloadToken');
    const tokens = await DownloadToken.find({ orderId }).select(
        'productId token downloadCount maxDownloads expiresAt isActive'
    );

    return {
        order,
        downloadTokens: tokens.map(t => ({
            productId: t.productId,
            downloadLink: `${process.env.NEXT_PUBLIC_APP_URL}/api/download/${t.token}`,
            downloadCount: t.downloadCount,
            maxDownloads: t.maxDownloads,
            expiresAt: t.expiresAt,
            isActive: t.isActive
        }))
    };
}

export const GET = withCreatorAuth(withErrorHandler(handler));
