
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import ProductVariant from '@/lib/models/ProductVariant';
import ProductFile from '@/lib/models/ProductFile';
import { CourseModule, CourseLesson } from '@/lib/models/CourseContent';
import { getMongoUser } from '@/lib/auth/get-user';
import mongoose from 'mongoose';

// FORCE DYNAMIC
export const dynamic = 'force-dynamic';

// Helper to validate ID
const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

// GET /api/v1/products/[id]
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Next.js 15 Async Params
) {
    try {
        await connectToDatabase();
        const { id } = await params;

        if (!isValidId(id)) {
            return NextResponse.json({ error: 'Invalid Product ID' }, { status: 400 });
        }

        // Auth check (Optional for public products, required for draft/archived)
        const user = await getMongoUser();
        const isCreator = !!user; // Simplified check

        const product = await Product.findById(id).lean();

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Access control: Only creator can see non-active products
        // Note: Logic needs refinement based on actual requirements (e.g. admins)
        if (product.status !== 'active' && (!user || product.creatorId.toString() !== user._id.toString())) {
            return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 });
        }

        // Fetch related data in parallel
        const [variants, files, modules] = await Promise.all([
            ProductVariant.find({ productId: id }).lean(),
            ProductFile.find({ productId: id }).lean(),
            CourseModule.find({ productId: id }).sort('orderIndex').lean()
        ]);

        // If it's a course, fetch lessons for the modules
        let expandedModules: any[] = modules;
        if (product.productType === 'course' && modules.length > 0) {
            const moduleIds = modules.map(m => m._id);
            const lessons = await CourseLesson.find({ moduleId: { $in: moduleIds } }).sort('orderIndex').lean();

            expandedModules = modules.map(m => ({
                ...m,
                lessons: lessons.filter(l => l.moduleId.toString() === m._id.toString())
            }));
        }

        return NextResponse.json({
            product,
            variants,
            files,
            modules: expandedModules
        });

    } catch (error: any) {
        console.error('Error fetching product details:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

// PUT /api/v1/products/[id]
export async function PUT(
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

        const body = await req.json();

        // Prevent changing productType after creation
        if (body.productType) {
            delete body.productType;
        }

        const product = await Product.findOneAndUpdate(
            { _id: id, creatorId: user._id },
            { $set: { ...body, updatedAt: new Date() } },
            { new: true, runValidators: true }
        );

        if (!product) {
            return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ product });

    } catch (error: any) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/v1/products/[id]
export async function DELETE(
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
            return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 });
        }

        // Check for active orders/subscriptions before deleting
        // This is a placeholder check. Real implementation needs to check Order model.
        // const hasActiveOrders = await Order.exists({ productId: id, status: 'completed' }); 
        // if (hasActiveOrders) {
        //     return NextResponse.json({ error: 'Cannot delete product with active orders. Archive it instead.' }, { status: 400 });
        // }

        // Soft Delete / Archive
        product.status = 'archived';
        product.deletedAt = new Date();
        await product.save();

        return NextResponse.json({ success: true, message: 'Product archived successfully' });

    } catch (error: any) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
