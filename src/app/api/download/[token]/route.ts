import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { DownloadToken } from '@/lib/models/DownloadToken';
import { Product } from '@/lib/models/Product';
import { validateDownloadToken, incrementDownloadCount } from '@/lib/services/downloadToken';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
});

/**
 * GET /api/download/:token
 * Secure download endpoint with token validation
 * 1. Validates token and checks expiry/download limits
 * 2. Increments download count
 * 3. Generates S3 signed URL (1-hour expiry)
 * 4. Redirects to S3 URL
 */
export async function GET(req: NextRequest, context: any) {
    try {
        await connectToDatabase();

        const params = await context.params;
        const tokenString = params.token;

        // 1. Validate token
        const validation = await validateDownloadToken(tokenString);

        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 403 });
        }

        const token = validation.token!;

        // 2. Get product and file details
        const product = await Product.findById(token.productId);

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Get the file URL (assume first file if multiple)
        const fileUrl = product.files?.[0]?.url || product.digitalFileUrl;

        if (!fileUrl) {
            return NextResponse.json({ error: 'No file available for download' }, { status: 404 });
        }

        // 3. Increment download count
        await incrementDownloadCount(tokenString);

        // 4. Generate S3 signed URL (if S3 file)
        if (fileUrl.includes('s3.amazonaws.com') || fileUrl.includes('.s3.')) {
            // Extract S3 key from URL
            const urlParts = new URL(fileUrl);
            const fileKey = urlParts.pathname.substring(1); // Remove leading slash

            const command = new GetObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET!,
                Key: fileKey
            });

            const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

            // Redirect to signed URL
            return NextResponse.redirect(signedUrl);
        }

        // 5. For non-S3 files, redirect directly
        return NextResponse.redirect(fileUrl);
    } catch (error: any) {
        console.error('Download error:', error);
        return NextResponse.json({ error: 'Download failed', details: error.message }, { status: 500 });
    }
}
