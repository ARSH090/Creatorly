import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/admin/[...nextauth]/route';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { Product } from '@/lib/models/Product';
import { AdminLog } from '@/lib/models/AdminLog';

export async function POST(
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

        product.isFeatured = !product.isFeatured;
        await product.save();

        await AdminLog.create({
            adminEmail: session.user.email,
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

    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
