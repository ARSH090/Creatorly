import { connectToDatabase } from '@/lib/db/mongodb';
import Product from '@/lib/models/Product';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { ProductSchema } from '@/lib/validations';

export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();

        const userId = (session.user as any).id;
        const products = await Product.find({ creatorId: userId }).sort({ createdAt: -1 });

        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const validation = ProductSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const { name, description, price, category, image, type } = validation.data;

        await connectToDatabase();

        const product = await Product.create({
            creatorId: (session.user as any).id,
            name,
            description,
            price,
            category,
            image,
            type,
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error('Product creation error:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
