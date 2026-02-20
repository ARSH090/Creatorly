import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { Product } from '@/lib/models/Product';
import { AdminLog } from '@/lib/models/AdminLog';
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

    // Update allowed fields
    if (body.name) product.name = body.name;
    if (body.description) product.description = body.description;
    if (body.price !== undefined) product.price = body.price;
    if (body.status) product.status = body.status;
    if (body.isFeatured !== undefined) product.isFeatured = body.isFeatured;

    await product.save();

    await AdminLog.create({
        adminEmail: admin.email,
        action: 'update_product',
        targetType: 'product',
        targetId: product._id,
        changes: body,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
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

    await AdminLog.create({
        adminEmail: admin.email,
        action: 'delete_product',
        targetType: 'product',
        targetId: product._id,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({ message: 'Product deleted' });
}

export const GET = withAdminAuth(withErrorHandler(getHandler));
export const PUT = withAdminAuth(withErrorHandler(putHandler));
export const DELETE = withAdminAuth(withErrorHandler(deleteHandler));
