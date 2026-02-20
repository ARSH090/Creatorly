
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import ProductFile from '@/lib/models/ProductFile';
import { getMongoUser } from '@/lib/auth/get-user';
import mongoose from 'mongoose';

// FORCE DYNAMIC
export const dynamic = 'force-dynamic';

const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

// GET /api/v1/products/[id]/files/[fileId]/download
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; fileId: string }> }
) {
    try {
        await connectToDatabase();
        const { id, fileId } = await params;

        const user = await getMongoUser();
        // Don't leak product existence if unauthorized? 
        // Or specific error message?

        if (!isValidId(id) || !isValidId(fileId)) {
            return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
        }

        const product = await Product.findById(id).lean();
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        const file = await ProductFile.findOne({ _id: fileId, productId: id });
        if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

        // Access Control Logic
        // 1. If user is creator -> Allow
        // 2. If user purchased -> Allow (Need Order Model check)
        // 3. If file/lesson is free preview -> Allow

        let hasAccess = false;

        if (user && product.creatorId.toString() === user._id.toString()) {
            hasAccess = true;
        } else {
            // Check for purchase
            // const order = await Order.findOne({ customerId: user._id, productId: id, status: 'completed' });
            // if (order) hasAccess = true;

            // For now, if mock, deny if not creator
            hasAccess = false;

            // Mocking access for testing
            // hasAccess = true; 
        }

        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied. Please purchase the product.' }, { status: 403 });
        }

        // Generate Signed URL from S3
        // const url = await getSignedUrl(bucket, file.storagePath, 3600); // 1 hour expiry

        // MOCK URL
        const url = `https://mock-s3-storage.com/${file.storagePath}?token=signed-token-expiry-1h`;

        return NextResponse.json({
            download_url: url,
            expires_in: 3600
        });

    } catch (error: any) {
        console.error('Error generating download URL:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
