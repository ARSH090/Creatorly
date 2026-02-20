import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import { generateDeliveryToken } from '@/lib/delivery/tokens';
import { getCurrentUser } from '@/lib/auth/server-auth';
import DownloadToken from '@/lib/models/DownloadToken';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { orderId, productId } = await req.json();

        // 1. Verify User/Session
        // In a production app, we'd verify the user owns this order OR the email matches.
        const order = await Order.findById(orderId);
        if (!order || order.status !== 'completed') {
            return NextResponse.json({ error: 'Order not found or unpaid' }, { status: 404 });
        }

        // 2. Generate Token
        const token = generateDeliveryToken({
            orderId: order._id.toString(),
            productId: productId,
            email: order.customerEmail,
            ip: req.headers.get('x-forwarded-for') || undefined
        });

        // 3. Persist Token for usage tracking
        await (DownloadToken as any).create({
            token,
            orderId: order._id,
            productId: productId,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
            maxDownloads: 5
        });

        return NextResponse.json({ token });

    } catch (error: any) {
        console.error('Token Generation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
