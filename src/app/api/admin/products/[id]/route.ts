import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/admin/[...nextauth]/route';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { Product } from '@/lib/models/Product';
import { AdminLog } from '@/lib/models/AdminLog';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;
        await dbConnect();

        const product = await Product.findById(id).populate('creatorId', 'displayName email').lean();
        if (!product) {
            return new NextResponse('Product not found', { status: 404 });
        }

        return NextResponse.json({ product });

    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

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
            adminEmail: session.user.email,
            action: 'update_product',
            targetType: 'product',
            targetId: product._id,
            changes: body,
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
        });

        return NextResponse.json(product);

    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== 'admin') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;
        await dbConnect();

        const product = await Product.findById(id);
        if (!product) return new NextResponse('Product not found', { status: 404 });

        // Hard delete or soft delete? Prompt says "Delete Product: admin override"
        // Let's do soft delete by setting status to archived or deletedAt
        product.status = 'archived';
        product.deletedAt = new Date();
        await product.save();

        await AdminLog.create({
            adminEmail: session.user.email,
            action: 'delete_product',
            targetType: 'product',
            targetId: product._id,
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
        });

        return NextResponse.json({ message: 'Product deleted' });

    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
