import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase as dbConnect } from '@/lib/db/mongodb';
import { DownloadToken } from '@/lib/models/DownloadToken';
import Product from '@/lib/models/Product';
import { getDownloadUrl } from '@/lib/storage/s3';

export async function GET(
    req: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        await dbConnect();
        const { token } = params;

        // 1. Find and atomically check/increment
        const tokenDoc = await DownloadToken.findOneAndUpdate(
            {
                token,
                isActive: true,
                expiresAt: { $gt: new Date() },
                $expr: { $lt: ["$downloadCount", "$maxDownloads"] }
            },
            {
                $inc: { downloadCount: 1 },
                $set: {
                    lastDownloadedAt: new Date(),
                    lastUsedIp: req.headers.get('x-forwarded-for') || 'unknown'
                }
            },
            { new: true }
        );

        if (!tokenDoc) {
            return NextResponse.json({ error: 'Download link is invalid, expired, or limit reached' }, { status: 403 });
        }

        // Logic check to auto-deactivate if this was the last use
        if (tokenDoc.downloadCount >= tokenDoc.maxDownloads) {
            await DownloadToken.findByIdAndUpdate(tokenDoc._id, { $set: { isActive: false } });
        }

        // 4. Get Product & File
        const product = await Product.findById(tokenDoc.productId);
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // 5. Generate S3 signed URL (valid for 15 minutes for the actual transfer)
        // Prioritize actual product files over preview/thumbnails
        let fileKey = (product.files && product.files.length > 0)
            ? (product.files.find((f: any) => f.isMain)?.key || product.files[0].key)
            : product.digitalFileUrl || product.previewFileKey;

        if (!fileKey) {
            return NextResponse.json({ error: 'No file associated with this product' }, { status: 404 });
        }

        const signedUrl = await getDownloadUrl(fileKey, 900); // 15 mins

        // 7. Redirect to S3
        return NextResponse.redirect(signedUrl);

    } catch (error: any) {
        console.error('[DOWNLOAD API ERROR]:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
