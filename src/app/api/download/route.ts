import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { DownloadToken } from '@/lib/models/DownloadToken';
import Product from '@/lib/models/Product';
import { Order } from '@/lib/models/Order';

/**
 * GET /api/download/[token]
 * Secure endpoint to validate a download token and redirect to the actual file.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const { token } = params;

        if (!token) {
            return new Response('Token is required', { status: 400 });
        }

        await connectToDatabase();

        // 1. Find and validate the token
        const downloadToken = await DownloadToken.findOne({ token, isActive: true });

        if (!downloadToken) {
            return new Response('Invalid or expired download link', { status: 404 });
        }

        // 2. Check expiry
        if (downloadToken.expiresAt < new Date()) {
            downloadToken.isActive = false;
            await downloadToken.save();
            return new Response('Download link has expired', { status: 410 });
        }

        // 3. Check download limit
        if (downloadToken.downloadCount >= downloadToken.maxDownloads) {
            return new Response('Download limit reached', { status: 429 });
        }

        // 4. Get the product and file information
        const product = await Product.findById(downloadToken.productId);
        if (!product) {
            return new Response('Product not found', { status: 404 });
        }

        // Prefer the new 'files' array, fallback to legacy 'digitalFileUrl'
        const fileUrl = product.files?.[0]?.url || product.digitalFileUrl;

        if (!fileUrl) {
            return new Response('File not found for this product', { status: 404 });
        }

        // 5. Increment download count and log history
        downloadToken.downloadCount += 1;
        downloadToken.lastDownloadedAt = new Date();
        downloadToken.lastUsedIp = req.headers.get('x-forwarded-for') || 'unknown';
        await downloadToken.save();

        // Also increment on the order for redundant tracking
        await Order.findByIdAndUpdate(downloadToken.orderId, {
            $inc: { downloadCount: 1 },
            $push: { downloadHistory: new Date() }
        });

        // 6. Redirect to the actual file (S3 or other storage)
        return NextResponse.redirect(fileUrl);

    } catch (error: any) {
        console.error('[Download API] Error:', error);
        return new Response('Internal server error', { status: 500 });
    }
}
