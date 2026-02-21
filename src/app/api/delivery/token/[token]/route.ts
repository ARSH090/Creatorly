import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { validateDownloadToken, incrementDownloadCount } from '@/lib/services/downloadToken';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        await connectToDatabase();
        const { token: tokenString } = await params;

        // 1. Validate Token
        const { valid, token, error } = await validateDownloadToken(tokenString);
        if (!valid || !token) {
            return NextResponse.json({ error: error || 'Invalid token' }, { status: 403 });
        }

        // 2. Fetch Product for the secure URL
        const product = await Product.findById(token.productId);
        if (!product || !product.digitalFileUrl) {
            return NextResponse.json({ error: 'Digital asset not found' }, { status: 404 });
        }

        // 3. Update Download Analytics
        const ip = req.headers.get('x-forwarded-for') || 'unknown';

        // Update Token State
        await incrementDownloadCount(tokenString);

        // Sync with parent Order
        await Order.findByIdAndUpdate(token.orderId, {
            $inc: { downloadCount: 1 },
            $push: { downloadHistory: new Date() },
            $set: { ipAddress: ip }
        });

        // 4. Redirect to the secure Cloud Storage URL using a Presigned URL
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
        console.error('Secure Delivery Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
