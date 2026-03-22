import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { getPresignedUploadUrl } from '@/lib/storage/s3';
import { BLOCKED_FILE_EXTENSIONS, BLOCKED_MIME_TYPES } from '@/lib/utils/fileValidation';
// Native crypto for unique IDs

export const POST = withAuth(async (req, user) => {
    try {
        const { filename, contentType, type, fileSize } = await req.json();

        if (!filename || !contentType || !fileSize) {
            return NextResponse.json({ error: 'Filename, content type, and file size are required' }, { status: 400 });
        }

        // Enforce 100MB limit
        if (fileSize > 100 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size exceeds 100MB' }, { status: 400 });
        }

        // Extract extension
        const ext = filename.split('.').pop()?.toLowerCase();

        // Validate file extension
        if (!ext || BLOCKED_FILE_EXTENSIONS.includes(`.${ext}`)) {
            return NextResponse.json(
                { error: 'File type not allowed', code: 'BLOCKED_EXTENSION' },
                { status: 400 }
            );
        }

        // Validate MIME type
        if (BLOCKED_MIME_TYPES.includes(contentType.toLowerCase())) {
            return NextResponse.json(
                { error: 'File MIME type not allowed', code: 'BLOCKED_MIME' },
                { status: 400 }
            );
        }

        // Generate a clean, unique key
        const { sanitizeKey, getPublicUrl, getPresignedUploadUrl } = await import('@/lib/storage/s3');
        const cleanName = sanitizeKey(filename);
        const fileExtension = ext || 'bin';
        const key = `${type || 'general'}/${user._id}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

        const uploadData = await getPresignedUploadUrl(key, contentType, fileSize);

        return NextResponse.json({
            uploadUrl: uploadData.url,
            fields: uploadData.fields,
            key,
            publicUrl: getPublicUrl(key)
        });


    } catch (error: any) {
        console.error('Presigned URL Error:', error);
        return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }
});
