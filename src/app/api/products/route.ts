import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        await connectToDatabase();

        if (!data.name || !data.type || !data.price || !data.image || !data.category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Enforce Plan Limits
        const user = await User.findById((session.user as any).id).select('planLimits');
        const maxProducts = user?.planLimits?.maxProducts ?? 3; // Default to 3 (Free Tier) if not set

        const currentCount = await Product.countDocuments({
            creatorId: (session.user as any).id,
            isActive: true
        });

        if (currentCount >= maxProducts) {
            return NextResponse.json({
                error: 'Plan limit reached',
                message: `You have reached the maximum of ${maxProducts} products for your plan. Please upgrade to add more.`,
                code: 'LIMIT_EXCEEDED'
            }, { status: 403 });
        }

        // 2. Map Wizard Data to Product Schema
        const productData = {
            creatorId: (session.user as any).id,
            name: data.name,
            slug: data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
            description: data.description || '',
            price: Number(data.price),
            currency: data.currency || 'INR',
            paymentType: data.paymentType || 'one_time',
            category: data.category,
            image: data.image,
            type: data.type,
            files: Array.isArray(data.files) ? data.files.map((f: any) => ({ name: f.name || 'file', url: f.url, size: f.size, mimeType: f.mimeType })) : [],
            digitalFileUrl: data.type === 'digital' ? (data.files?.[0]?.url || data.digitalFileUrl) : undefined,
            accessRules: {
                immediateAccess: true,
                requiresApproval: false
            },
            seo: {
                metaTitle: data.name,
                metaDescription: (data.description || '').slice(0, 160),
                keywords: Array.isArray(data.keywords) ? data.keywords : []
            },
            isActive: data.isPublic ?? true,
            isFeatured: data.isFeaturedInCollections ?? false
        } as any;

        // 3. Create Product
        const product = await Product.create(productData);

        return NextResponse.json({
            success: true,
            productId: product._id,
            product
        }, { status: 201 });

    } catch (error: any) {
        console.error('Product Creation Error:', error);
        return NextResponse.json({
            error: 'Failed to create product',
            details: error.message
        }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const creatorId = searchParams.get('creatorId');

        const query = creatorId ? { creatorId } : {};
        const products = await Product.find(query).sort({ createdAt: -1 });

        return NextResponse.json(products);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
