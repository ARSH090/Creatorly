import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { Product } from '@/lib/models/Product';
import { AdminLog } from '@/lib/models/AdminLog';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

async function postHandler(
    req: NextRequest,
    user: any,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await dbConnect();

    const product = await Product.findById(id);
    if (!product) return new NextResponse('Product not found', { status: 404 });

    product.isFeatured = !product.isFeatured;
    await product.save();

    await AdminLog.create({
        adminEmail: user.email,
        action: 'toggle_feature_product',
        targetType: 'product',
        targetId: product._id,
        changes: { isFeatured: product.isFeatured },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
        message: `Product ${product.isFeatured ? 'featured' : 'unfeatured'}`,
        isFeatured: product.isFeatured
    });
}

export const POST = withAdminAuth(withErrorHandler(postHandler));
