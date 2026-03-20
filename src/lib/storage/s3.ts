import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getSignedUrl as getCloudFrontSignedUrl } from '@aws-sdk/cloudfront-signer';

export const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

export async function getPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600) {
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        ContentType: contentType,
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
}

export async function getDownloadUrl(key: string, expiresIn = 3 * 24 * 3600) {
    // USE CLOUDFRONT SIGNED URLS FOR SCALABILITY
    if (process.env.CLOUDFRONT_DOMAIN && process.env.CLOUDFRONT_PRIVATE_KEY) {
        try {
            return getCloudFrontSignedUrl({
                url: `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`,
                keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
                privateKey: process.env.CLOUDFRONT_PRIVATE_KEY.replace(/\\n/g, '\n'),
                dateLessThan: new Date(Date.now() + expiresIn * 1000).toISOString(),
            });
        } catch (err) {
            console.error('CloudFront signing failed, falling back to S3:', err);
        }
    }

    // Fallback to S3 Presigned URL
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
}
