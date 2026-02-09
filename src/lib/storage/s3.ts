import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

export async function getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600
) {
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        ContentType: contentType,
    });

    try {
        const url = await getSignedUrl(s3Client, command, { expiresIn });
        return url;
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        throw error;
    }
}

export function getPublicUrl(key: string) {
    if (process.env.NEXT_PUBLIC_S3_DOMAIN) {
        return `${process.env.NEXT_PUBLIC_S3_DOMAIN}/${key}`;
    }
    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}
