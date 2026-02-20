import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        await connectToDatabase();
        const { orderId } = await params;

        // 1. Fetch Order and include Product details
        let order = await Order.findById(orderId);
        if (!order) {
            order = await Order.findOne({ razorpayOrderId: orderId });
        }

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // 2. Validate Order Status
        if ((order.status as any) !== 'completed') {
            return NextResponse.json({ error: 'Payment not verified' }, { status: 403 });
        }

        // 3. Check Download Limits
        if (order.downloadCount >= order.downloadLimit) {
            return NextResponse.json({
                error: 'Download limit exceeded',
                limit: order.downloadLimit
            }, { status: 429 });
        }

        // 4. Fetch Product for the secure URL
        const firstItem = order.items?.[0];
        if (!firstItem) {
            return NextResponse.json({ error: 'Order has no items' }, { status: 400 });
        }

        const product = await Product.findById(firstItem.productId);
        if (!product || !product.digitalFileUrl) {
            return NextResponse.json({ error: 'Digital asset not found' }, { status: 404 });
        }

        // 5. Update Order Download History
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        order.downloadCount += 1;
        order.downloadHistory.push(new Date());
        order.ipAddress = ip;
        await order.save();

        // 6. Redirect to the secure Cloud Storage URL using a Presigned URL
        // Extract S3 key from the URL
        let s3Key = '';
        const fileUrl = product.digitalFileUrl;
        try {
            const url = new URL(fileUrl);
            s3Key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        } catch (e) {
            s3Key = fileUrl;
        }

        const { getPresignedDownloadUrl } = await import('@/lib/storage/s3');
        const presignedUrl = await getPresignedDownloadUrl(s3Key);

        return NextResponse.redirect(presignedUrl);


    } catch (error: any) {
        console.error('Delivery Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
