import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * POST /api/creator/products/:id/duplicate
 * Creates a copy of an existing product with "(Copy)" appended to the name
 */
async function handler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const productId = params.id;

    // Find original product
    const original = await Product.findOne({ _id: productId, creatorId: user._id });

    if (!original) {
        throw new Error('Product not found');
    }

    // Create duplicate with modified fields
    const duplicate = await Product.create({
        ...original.toObject(),
        _id: undefined, // Remove ID to create new document
        name: `${original.name} (Copy)`,
        slug: `${original.slug}-copy-${Date.now()}`, // Ensure unique slug
        status: 'draft', // Always start as draft
        createdAt: new Date(),
        updatedAt: new Date()
    });

    return {
        success: true,
        product: duplicate
    };
}

export const POST = withCreatorAuth(withErrorHandler(handler));
