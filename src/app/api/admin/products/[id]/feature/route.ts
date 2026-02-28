import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { Product } from '@/lib/models/Product';
import { withAdminAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { auditLog } from '@/lib/utils/auditLogger';

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

    await auditLog({
        userId: user.id || user._id,
        action: 'toggle_feature_product',
        resourceType: 'product',
        resourceId: product._id,
        metadata: { isFeatured: product.isFeatured },
        req
    });

    return NextResponse.json({
        message: `Product ${product.isFeatured ? 'featured' : 'unfeatured'}`,
        isFeatured: product.isFeatured
    });
}

export const POST = withAdminAuth(withErrorHandler(postHandler));
