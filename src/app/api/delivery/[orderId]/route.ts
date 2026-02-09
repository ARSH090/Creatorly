import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ orderId: string }> }
) {
    try {
        await connectToDatabase();
        const { orderId } = await context.params;

        // 1. Fetch Order and include Product details
        const order = await Order.findById(orderId);
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // 2. Validate Order Status
        if (order.status !== 'success') {
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
        const product = await Product.findById(order.productId);
        if (!product || !product.digitalFileUrl) {
            return NextResponse.json({ error: 'Digital asset not found' }, { status: 404 });
        }

        // 5. Update Order Download History
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        order.downloadCount += 1;
        order.downloadHistory.push(new Date());
        order.ipAddress = ip;
        await order.save();

        // 6. Redirect to the secure Cloud Storage URL (or proxy the file)
        // For now, we redirect to the file URL. In production, this should be a signed URL.
        return NextResponse.redirect(product.digitalFileUrl);

    } catch (error: any) {
        console.error('Delivery Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
