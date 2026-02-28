import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { DownloadToken } from '@/lib/models/DownloadToken';
import Product from '@/lib/models/Product';
import { getPresignedDownloadUrl } from '@/lib/storage/s3';

export async function GET(
    req: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        await dbConnect();
        const { token } = params;

        // 1. Find and validate token
        const tokenDoc = await DownloadToken.findOne({ token, isActive: true });

        if (!tokenDoc) {
            return NextResponse.json({ error: 'Invalid or expired download link' }, { status: 404 });
        }

        // 2. Check Expiry
        if (new Date() > tokenDoc.expiresAt) {
            tokenDoc.isActive = false;
            await tokenDoc.save();
            return NextResponse.json({ error: 'Download link has expired' }, { status: 410 });
        }

        // 3. Check Download Count
        if (tokenDoc.downloadCount >= tokenDoc.maxDownloads) {
            tokenDoc.isActive = false;
            await tokenDoc.save();
            return NextResponse.json({ error: 'Download limit reached' }, { status: 403 });
        }

        // 4. Get Product & File
        const product = await Product.findById(tokenDoc.productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // 5. Generate S3 signed URL (valid for 15 minutes for the actual transfer)
        // Note: Assumes product.digitalFileUrl or product.files[0].key
        const fileKey = product.previewFileKey || product.thumbnailKey || (product.files && product.files[0]?.key);

        if (!fileKey) {
            return NextResponse.json({ error: 'No file associated with this product' }, { status: 404 });
        }

        const signedUrl = await getPresignedDownloadUrl(fileKey, 900); // 15 mins

        // 6. Update Stats
        tokenDoc.downloadCount += 1;
        tokenDoc.lastDownloadedAt = new Date();
        tokenDoc.lastUsedIp = req.headers.get('x-forwarded-for') || 'unknown';

        if (tokenDoc.downloadCount >= tokenDoc.maxDownloads) {
            tokenDoc.isActive = false;
        }
        await tokenDoc.save();

        // 7. Redirect to S3
        return NextResponse.redirect(signedUrl);

    } catch (error: any) {
        console.error('[DOWNLOAD API ERROR]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
