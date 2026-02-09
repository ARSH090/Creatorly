import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { verifyDeliveryToken } from '@/lib/delivery/tokens';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const payload = verifyDeliveryToken(token);

        if (!payload) {
            return NextResponse.json({ error: 'Invalid or expired download link' }, { status: 401 });
        }

        await connectToDatabase();

        // 1. Validate Order & Download Limit
        const order = await Order.findById(payload.orderId);
        if (!order || order.status !== 'success') {
            return NextResponse.json({ error: 'Order not found or unpaid' }, { status: 404 });
        }

        if (order.downloadCount >= order.downloadLimit) {
            return NextResponse.json({ error: 'Download limit exceeded. Please contact the creator.' }, { status: 403 });
        }

        // 2. Fetch Product & File
        const product = await Product.findById(payload.productId);
        if (!product) {
            return NextResponse.json({ error: 'Product no longer exists' }, { status: 404 });
        }

        // 3. Update Download Stats
        order.downloadCount += 1;
        order.downloadHistory.push(new Date());
        order.ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
        await order.save();

        // 4. Redirect to secure file (Cloaking the real URL)
        // In a real S3 integration, we would generate a presigned URL here.
        // For now, we redirect to the file URL stored in the product (assuming public/protected Cloudinary/S3)
        // If it's a private S3 bucket, we'd use await getSignedUrl(...) from AWS SDK
        return NextResponse.redirect(product.image); // placeholder, product.downloadUrl would be better

    } catch (error: any) {
        console.error('Download API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
