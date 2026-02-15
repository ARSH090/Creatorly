import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { withAdminAuth } from '@/lib/firebase/withAuth';
import { logAdminAction } from '@/lib/admin/logger';

/**
 * PUT /api/admin/products/:id
 * Update any product
 */
async function putHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const productId = params.id;

    const body = await req.json();

    const product = await Product.findById(productId);
    if (!product) {
        return NextResponse.json(
            { success: false, error: 'Product not found' },
            { status: 404 }
        );
    }

    // Track changes
    const changes: any = {};
    const allowedFields = ['name', 'description', 'price', 'status', 'type', 'category'];

    allowedFields.forEach(field => {
        const val = (product as any)[field];
        if (body[field] !== undefined && body[field] !== val) {
            changes[field] = { from: val, to: body[field] };
            (product as any)[field] = body[field];
        }
    });

    await product.save();

    // Log action
    await logAdminAction(
        user.email,
        'UPDATE_PRODUCT',
        'product',
        productId,
        changes,
        req
    );

    return NextResponse.json({
        success: true,
        data: { product },
        message: 'Product updated successfully'
    });
}

/**
 * DELETE /api/admin/products/:id
 * Delete any product
 */
async function deleteHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const productId = params.id;

    const product = await Product.findById(productId);
    if (!product) {
        return NextResponse.json(
            { success: false, error: 'Product not found' },
            { status: 404 }
        );
    }

    // Soft delete - set status to archived
    (product as any).status = 'archived';
    await (product as any).save();

    // Log action
    await logAdminAction(
        user.email,
        'DELETE_PRODUCT',
        'product',
        productId,
        { name: product.name, creatorId: product.creatorId },
        req
    );

    return NextResponse.json({
        success: true,
        message: 'Product deleted successfully'
    });
}

export const PUT = withAdminAuth(putHandler);
export const DELETE = withAdminAuth(deleteHandler);
