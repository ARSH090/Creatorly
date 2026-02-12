import { NextRequest } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import crypto from 'crypto';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
});

/**
 * POST /api/creator/upload
 * Generates presigned S3 URL for direct file uploads
 * Body: { filename, contentType, fileSize }
 * Returns: { uploadUrl, fileKey, publicUrl }
 */
async function handler(req: NextRequest, user: any) {
    const body = await req.json();
    const { filename, contentType, fileSize } = body;

    if (!filename || !contentType) {
        throw new Error('filename and contentType are required');
    }

    // Check file size limit based on plan
    const { getPlanLimits } = await import('@/lib/utils/planLimits');
    const limits = getPlanLimits(user.plan || 'free');
    const maxFileSizeMb = limits.maxStorageMb;

    if (fileSize && fileSize > maxFileSizeMb * 1024 * 1024) {
        throw new Error(`File size exceeds your plan limit of ${maxFileSizeMb}MB`);
    }

    // Generate unique file key
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `uploads/${user._id}/${timestamp}-${random}-${sanitizedFilename}`;

    // Generate presigned URL (valid for 5 minutes)
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: fileKey,
        ContentType: contentType,
        ACL: 'public-read' // Make files publicly accessible
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    const publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileKey}`;

    return {
        uploadUrl,
        fileKey,
        publicUrl,
        expiresIn: 300
    };
}

export const POST = withCreatorAuth(withErrorHandler(handler));
