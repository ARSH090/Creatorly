import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * DELETE /api/creator/products/discounts/:code
 * Remove discount code from a product
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const code = params.code.toUpperCase();

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
        throw new Error('productId query parameter is required');
    }

    const product = await Product.findOne({ _id: productId, creatorId: user._id });

    if (!product) {
        throw new Error('Product not found');
    }

    // Remove discount code
    const initialLength = product.discountCodes?.length || 0;
    product.discountCodes = (product.discountCodes || []).filter(
        (dc: any) => dc.code !== code
    );

    if (product.discountCodes.length === initialLength) {
        throw new Error('Discount code not found');
    }

    await product.save();

    return {
        success: true,
        message: 'Discount code removed successfully'
    };
}

export const DELETE = withCreatorAuth(withErrorHandler(handler));
