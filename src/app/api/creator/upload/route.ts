import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl, getPublicUrl, sanitizeKey } from '@/lib/storage/s3';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * POST /api/creator/upload
 * Generates a presigned S3 URL for secure direct-to-S3 uploads
 */
async function handler(req: NextRequest, user: any) {
    const body = await req.json();
    const { filename, contentType } = body;

    if (!filename || !contentType) {
        throw new Error('Filename and Content-Type are required');
    }

    // 1. Sanitize and generate unique key
    const sanitizedName = sanitizeKey(filename);
    const fileExtension = filename.split('.').pop();
    const key = `creators/${user._id}/assets/${Date.now()}-${sanitizedName}.${fileExtension}`;

    // 2. Generate Presigned URL (Valid for 1 hour)
    const uploadUrl = await getPresignedUploadUrl(key, contentType, 3600);

    // 3. Generate Public access URL
    const publicUrl = getPublicUrl(key);

    return {
        success: true,
        uploadUrl,
        publicUrl,
        key
    };
}

export const POST = withCreatorAuth(withErrorHandler(handler));
