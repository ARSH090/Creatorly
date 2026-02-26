import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import OrderBump from '@/lib/models/OrderBump';
import { getMongoUser } from '@/lib/auth/get-user';

export const dynamic = 'force-dynamic';

// GET /api/v1/order-bumps
export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const bumps = await OrderBump.find({ creatorId: user._id })
            .populate('triggerProductId', 'title pricing')
            .populate('bumpProductId', 'title pricing')
            .sort({ displayOrder: 1, createdAt: -1 });

        return NextResponse.json({ bumps });
    } catch (error: any) {
        console.error('Error fetching order bumps:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/v1/order-bumps
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { triggerProductId, bumpProductId, headline, description, discountPct, isActive, displayOrder } = body;

        if (!triggerProductId || !bumpProductId || !headline) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const bump = await OrderBump.create({
            creatorId: user._id,
            triggerProductId,
            bumpProductId,
            headline,
            description,
            discountPct: discountPct || 0,
            isActive: isActive !== undefined ? isActive : true,
            displayOrder: displayOrder || 0
        });

        return NextResponse.json({ bump }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating order bump:', error);
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Bump for this trigger/product pair already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
