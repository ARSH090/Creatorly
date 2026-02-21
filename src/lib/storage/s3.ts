import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

// Utility to sanitize filenames
export function sanitizeKey(filename: string): string {
    return filename
        .split('.')[0]
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase();
}

export async function getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600
) {
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        ContentType: contentType,
        // Remove ACL: 'public-read' as it requires specific bucket settings
        // and is better handled by bucket policy or dedicated CloudFront
    });

    try {
        const url = await getSignedUrl(s3Client, command, { expiresIn });
        return url;
    } catch (error) {
        console.error('Error generating presigned upload URL:', error);
        throw error;
    }
}

export async function getPresignedDownloadUrl(
    key: string,
    expiresIn = 3600
) {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
    });

    try {
        const url = await getSignedUrl(s3Client, command, { expiresIn });
        return url;
    } catch (error) {
        console.error('Error generating presigned download URL:', error);
        throw error;
    }
}


export function getPublicUrl(key: string) {
    if (process.env.NEXT_PUBLIC_S3_DOMAIN) {
        return `${process.env.NEXT_PUBLIC_S3_DOMAIN}/${key}`;
    }
    // Fallback to standard S3 domain if environment variable is missing (but this might fail if bucket is private)
    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

