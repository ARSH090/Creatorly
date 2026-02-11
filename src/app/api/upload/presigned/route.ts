import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/firebase/withAuth';
import { getPresignedUploadUrl } from '@/lib/storage/s3';
// Native crypto for unique IDs

export const POST = withAuth(async (req, user) => {
    try {
        const { filename, contentType, type } = await req.json();

        if (!filename || !contentType) {
            return NextResponse.json({ error: 'Filename and content type are required' }, { status: 400 });
        }

        // Generate a clean, unique key
        const ext = filename.split('.').pop();
        const cleanName = filename.split('.')[0].replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const key = `${type || 'general'}/${user._id}/${crypto.randomUUID()}-${cleanName}.${ext}`;

        const uploadUrl = await getPresignedUploadUrl(key, contentType);

        return NextResponse.json({
            uploadUrl,
            key
        });


    } catch (error: any) {
        console.error('Presigned URL Error:', error);
        return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }
});
