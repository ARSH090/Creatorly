
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import ProductFile from '@/lib/models/ProductFile';
import { getMongoUser } from '@/lib/auth/get-user';
import mongoose from 'mongoose';

// FORCE DYNAMIC
export const dynamic = 'force-dynamic';

const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

// POST /api/v1/products/[id]/files/complete
// Body: { uploadId, key, fileName, fileSize, fileType, parts }
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;

        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!isValidId(id)) {
            return NextResponse.json({ error: 'Invalid Product ID' }, { status: 400 });
        }

        const product = await Product.findOne({ _id: id, creatorId: user._id });
        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const body = await req.json();
        const { uploadId, key, fileName, fileSize, fileType, parts } = body;

        // Implement S3 Complete Multipart Upload
        // await completeMultipartUpload(bucket, key, uploadId, parts);

        // Create ProductFile Record
        const file = await ProductFile.create({
            productId: id,
            fileName,
            originalFileName: fileName,
            fileSize,
            fileType,
            storagePath: key,
            versionNumber: 1, // Logic to increment if replacing?
            isCurrentVersion: true
        });

        // If replacing, set old versions to isCurrentVersion: false?
        // await ProductFile.updateMany(
        //    { productId: id, _id: { $ne: file._id }, fileName: fileName },
        //    { isCurrentVersion: false }
        // );

        return NextResponse.json({ file }, { status: 201 });

    } catch (error: any) {
        console.error('Error completing upload:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
