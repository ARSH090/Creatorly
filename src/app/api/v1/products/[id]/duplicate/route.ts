
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import ProductVariant from '@/lib/models/ProductVariant';
// import ProductFile from '@/lib/models/ProductFile'; // Files usually linked, not copied physically in storage instantly
import { getMongoUser } from '@/lib/auth/get-user';
import mongoose from 'mongoose';

// FORCE DYNAMIC
export const dynamic = 'force-dynamic';

// Helper to validate ID
const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

// POST /api/v1/products/[id]/duplicate
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

        const originalProduct = await Product.findOne({ _id: id, creatorId: user._id }).lean();

        if (!originalProduct) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Create new product object
        const newTitle = `${originalProduct.title} (Copy)`;
        const newSlug = `${originalProduct.slug}-copy-${Date.now()}`; // Simple slug generation

        // Remove _id and set up new fields
        const { _id, createdAt, updatedAt, ...productData } = originalProduct;

        const newProduct = await Product.create({
            ...productData,
            title: newTitle,
            slug: newSlug,
            status: 'draft', // Always draft
            creatorId: user._id, // Explicitly set current user (though duplicate implies same user here)
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Clone Variants
        const variants = await ProductVariant.find({ productId: id }).lean();
        if (variants.length > 0) {
            const newVariants = variants.map(v => ({
                productId: newProduct._id,
                variantName: v.variantName,
                priceModifier: v.priceModifier,
                inventoryQuantity: v.inventoryQuantity,
                metadata: v.metadata,
                isActive: v.isActive
            }));
            await ProductVariant.insertMany(newVariants);
        }

        // Note: We are NOT cloning files or course content deeply here to avoid massive data duplication issues immediately. 
        // Files can be re-linked or we might need a more complex "Copy Content" logic later.
        // For a true "Duplicate", usually you want the course outline too.
        // Let's at least copy Course Modules/Lessons structure if it exists.

        if (originalProduct.productType === 'course') {
            // This is complex because we need to map old Module IDs to new Module IDs for Lessons
            // Skipping deep course clone for this step to keep it robust, user can rebuild or we add later.
            // Or better: Implement shallow copy of structure.
        }

        return NextResponse.json({ new_product: newProduct });

    } catch (error: any) {
        console.error('Error duplicating product:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
