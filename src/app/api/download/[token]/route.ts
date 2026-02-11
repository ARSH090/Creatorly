import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { verifyDeliveryToken } from '@/lib/delivery/tokens';
import DownloadToken from '@/lib/models/DownloadToken';
import { getPresignedDownloadUrl } from '@/lib/storage/s3';
import { RedisRateLimiter } from '@/lib/security/redis-rate-limiter';



export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
        const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

        // 1. Rate Limiting (5 downloads per hour per IP to prevent scraping)
        const isAllowed = await RedisRateLimiter.check('download', 5, 60 * 60 * 1000, ip);
        if (!isAllowed) {
            return NextResponse.json({ error: 'Too many download requests. Please try again later.' }, { status: 429 });
        }

        const { token } = await params;

        const payload = verifyDeliveryToken(token);

        if (!payload) {
            return NextResponse.json({ error: 'Invalid or expired download link' }, { status: 401 });
        }

        await connectToDatabase();

        // 1. Validate Persistent Token
        const dbToken = await DownloadToken.findOne({ token, revoked: false });
        if (!dbToken) {
            return NextResponse.json({ error: 'Token is invalid, expired, or revoked' }, { status: 401 });
        }

        if (dbToken.usageCount >= dbToken.maxUsage) {
            return NextResponse.json({ error: 'Download limit exceeded for this link' }, { status: 403 });
        }

        // 2. Validate Order
        const order = await Order.findById(payload.orderId);
        if (!order || order.status !== 'success') {
            return NextResponse.json({ error: 'Order not found or unpaid' }, { status: 404 });
        }

        // 3. Fetch Product & File
        const product = await Product.findById(payload.productId);
        if (!product) {
            return NextResponse.json({ error: 'Product no longer exists' }, { status: 404 });
        }

        // 4. Update Download Stats (Persistent Token & Order)
        const ua = req.headers.get('user-agent') || 'unknown';
        const fingerprint = createHash('sha256').update(ip + ua).digest('hex');

        dbToken.usageCount += 1;
        dbToken.lastUsedAt = new Date();
        dbToken.lastUsedIp = ip;
        await dbToken.save();

        order.downloadCount += 1;
        order.downloadHistory.push(new Date());
        order.ipAddress = ip;
        order.deviceFingerprint = fingerprint; // Capture for audit
        await order.save();


        // 4. Redirect to secure file (Cloaking the real URL)
        // Extract S3 key from the URL (Assuming format: https://bucket.s3.region.amazonaws.com/key)
        const fileUrl = product.digitalFileUrl || (product.files && product.files.length > 0 ? product.files[0].url : product.image);

        if (!fileUrl) {
            return NextResponse.json({ error: 'No file associated with this product' }, { status: 404 });
        }

        let s3Key = '';
        try {
            const url = new URL(fileUrl);
            s3Key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        } catch (e) {
            // If not a valid URL, assume it's already a key
            s3Key = fileUrl;
        }

        const presignedUrl = await getPresignedDownloadUrl(s3Key);
        return NextResponse.redirect(presignedUrl);


    } catch (error: any) {
        console.error('Download API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
