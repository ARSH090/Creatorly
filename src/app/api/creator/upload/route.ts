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
    const { filename, contentType, fileSize, type } = body;

    if (!filename || !contentType || !fileSize) {
        throw new Error('Filename, Content-Type, and FileSize are required');
    }

    // SECURITY: Enforce size limits
    const isAvatar = type === 'avatar';
    const limit = isAvatar ? 5 * 1024 * 1024 : 50 * 1024 * 1024; // 5MB for avatar, 50MB otherwise

    if (fileSize > limit) {
        throw new Error(`File too large. Maximum size for ${isAvatar ? 'avatar' : 'assets'} is ${isAvatar ? '5MB' : '50MB'}.`);
    }

    // SECURITY: Content type verification (images only for assets/avatars in this context)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/zip'];
    if (!allowedTypes.includes(contentType)) {
        throw new Error('Invalid file type');
    }

    // 1. Sanitize and generate unique key
    const sanitizedName = sanitizeKey(filename);
    const fileExtension = filename.split('.').pop();
    const folder = isAvatar ? 'avatars' : 'assets';
    const key = `creators/${user._id}/${folder}/${Date.now()}-${sanitizedName}.${fileExtension}`;

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
