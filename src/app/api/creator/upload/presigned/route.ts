import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl, sanitizeKey } from '@/lib/storage/s3';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { errorResponse } from '@/types/api';

async function handler(req: NextRequest, user: any) {
    try {
        const { searchParams } = new URL(req.url);
        const filename = searchParams.get('filename');
        const fileType = searchParams.get('fileType');
        const folder = searchParams.get('folder') || 'products';

        if (!filename || !fileType) {
            return NextResponse.json(errorResponse('Filename and fileType are required'), { status: 400 });
        }

        const sanitizedName = sanitizeKey(filename);
        const extension = filename.split('.').pop();
        const key = `${user._id}/${folder}/${Date.now()}-${sanitizedName}.${extension}`;

        const uploadUrl = await getPresignedUploadUrl(key, fileType);

        return NextResponse.json({
            uploadUrl,
            key,
            publicUrl: `/api/files/${key}` // We can proxy or use public URL
        });
    } catch (error: any) {
        console.error('Presigned URL Error:', error);
        return NextResponse.json(errorResponse('Failed to generate upload URL', error.message), { status: 500 });
    }
}

export const GET = withCreatorAuth(handler);
