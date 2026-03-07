import { NextRequest, NextResponse } from 'next/server';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { s3Client, getPublicUrl } from '@/lib/storage/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { User } from '@/lib/models/User';
import { connectToDatabase } from '@/lib/db/mongodb';

async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
    }

    // Validate file size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExtension = file.name.split('.').pop();
    const fileName = `avatars/${user._id}-${Date.now()}.${fileExtension}`;

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
    });

    try {
        await s3Client.send(command);
        const imageUrl = getPublicUrl(fileName);

        // Update user avatar in database
        await User.findByIdAndUpdate(user._id, { $set: { avatar: imageUrl } });

        return NextResponse.json({
            success: true,
            url: imageUrl,
            message: 'Avatar uploaded successfully'
        });
    } catch (error: any) {
        console.error('S3 upload error:', error);
        return NextResponse.json({ error: 'Failed to upload image to S3' }, { status: 500 });
    }
}

export const POST = withCreatorAuth(withErrorHandler(handler));
