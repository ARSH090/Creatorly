import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { Product } from '@/lib/models/Product';
import AuditLog from '@/lib/models/AuditLog';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

async function getHandler(
    req: NextRequest,
    user: any,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await dbConnect();

    const product = await Product.findById(id).populate('creatorId', 'displayName email').lean();
    if (!product) {
        return new NextResponse('Product not found', { status: 404 });
    }

    return NextResponse.json({ product });
}

async function putHandler(
    req: NextRequest,
    admin: any,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await req.json();
    await dbConnect();

    const product = await Product.findById(id);
    if (!product) return new NextResponse('Product not found', { status: 404 });

    const previousStatus = product.status;
    const previousFlagged = product.isFlagged;

    // Update allowed fields
    if (body.title) product.title = body.title;
    if (body.description) product.description = body.description;
    if (body.price !== undefined) {
        if (!product.pricing) product.pricing = { basePrice: 0, currency: 'INR', taxInclusive: false };
        product.pricing.basePrice = body.price;
    }
    if (body.status) product.status = body.status;
    if (body.isFeatured !== undefined) product.isFeatured = body.isFeatured;
    if (body.isFlagged !== undefined) product.isFlagged = body.isFlagged;
    if (body.flagReason !== undefined) product.flagReason = body.flagReason;
    if (body.adminNotes !== undefined) product.adminNotes = body.adminNotes;

    await product.save();

    // Comprehensive Audit Log
    await AuditLog.create({
        adminId: admin.id,
        action: body.isFlagged && !previousFlagged ? 'FLAG_PRODUCT' :
            !body.isFlagged && previousFlagged ? 'UNFLAG_PRODUCT' :
                body.status !== previousStatus ? 'UPDATE_PRODUCT_STATUS' : 'UPDATE_PRODUCT',
        entityType: 'product',
        entityId: product._id,
        details: {
            changes: body,
            reason: body.flagReason || body.adminNotes
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'local'
    });

    return NextResponse.json(product);
}

async function deleteHandler(
    req: NextRequest,
    admin: any,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await dbConnect();

    const product = await Product.findById(id);
    if (!product) return new NextResponse('Product not found', { status: 404 });

    product.status = 'archived';
    product.deletedAt = new Date();
    await product.save();

    await AuditLog.create({
        adminId: admin.id,
        action: 'DELETE_PRODUCT',
        entityType: 'product',
        entityId: product._id,
        ipAddress: req.headers.get('x-forwarded-for') || 'local'
    });

    return NextResponse.json({ message: 'Product deleted' });
}

export const GET = withAdminAuth(withErrorHandler(getHandler));
export const PUT = withAdminAuth(withErrorHandler(putHandler));
export const DELETE = withAdminAuth(withErrorHandler(deleteHandler));
