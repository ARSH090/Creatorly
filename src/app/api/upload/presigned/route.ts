import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { getPresignedUploadUrl } from '@/lib/storage/s3';
import { BLOCKED_FILE_EXTENSIONS, BLOCKED_MIME_TYPES } from '@/lib/utils/fileValidation';
// Native crypto for unique IDs

export const POST = withAuth(async (req, user) => {
    try {
        const { filename, contentType, type } = await req.json();

        if (!filename || !contentType) {
            return NextResponse.json({ error: 'Filename and content type are required' }, { status: 400 });
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
        const cleanName = filename.split('.')[0].replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const key = `${type || 'general'}/${user._id}/${crypto.randomUUID()}-${cleanName}.${ext}`;

        const { getPublicUrl } = await import('@/lib/storage/s3');
        const uploadUrl = await getPresignedUploadUrl(key, contentType);

        return NextResponse.json({
            uploadUrl,
            key,
            publicUrl: getPublicUrl(key)
        });


    } catch (error: any) {
        console.error('Presigned URL Error:', error);
        return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }
});
