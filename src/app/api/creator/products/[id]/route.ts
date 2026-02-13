import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/products/:id
 * Get product details
 */
async function getHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();
    const params = await context.params;
    const { id } = params;

    const product = await Product.findOne({
        _id: id,
        creatorId: user._id
    });

    if (!product) {
        throw new Error('Product not found');
    }

    return { product };
}

/**
 * PUT /api/creator/products/:id
 * Update product details
 */
async function putHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();
    const params = await context.params;
    const { id } = params;
    const body = await req.json();

    const product = await Product.findOne({
        _id: id,
        creatorId: user._id
    });

    if (!product) {
        throw new Error('Product not found');
    }

    // Update fields (allow partial updates)
    Object.assign(product as any, body);

    // Ensure critical fields are protected if necessary
    // e.g., don't allow changing creatorId

    await product.save();

    return {
        success: true,
        product,
        message: 'Product updated successfully'
    };
}

/**
 * DELETE /api/creator/products/:id
 * Delete product
 */
async function deleteHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();
    const params = await context.params;
    const { id } = params;

    const product = await Product.findOneAndDelete({
        _id: id,
        creatorId: user._id
    });

    if (!product) {
        throw new Error('Product not found');
    }

    return {
        success: true,
        message: 'Product deleted successfully'
    };
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
export const PUT = withCreatorAuth(withErrorHandler(putHandler));
export const DELETE = withCreatorAuth(withErrorHandler(deleteHandler));
