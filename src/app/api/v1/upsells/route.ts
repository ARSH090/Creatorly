import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import UpsellOffer from '@/lib/models/UpsellOffer';
import { getMongoUser } from '@/lib/auth/get-user';

export const dynamic = 'force-dynamic';

// GET /api/v1/upsells
export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const upsells = await UpsellOffer.find({ creatorId: user._id })
            .populate('triggerProductId', 'title pricing')
            .populate('offerProductId', 'title pricing')
            .sort({ createdAt: -1 });

        return NextResponse.json({ upsells });
    } catch (error: any) {
        console.error('Error fetching upsell offers:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/v1/upsells
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { triggerProductId, offerProductId, headline, subheadline, bodyCopy, priceOverride, expiresSeconds, isActive } = body;

        if (!triggerProductId || !offerProductId || !headline) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const upsell = await UpsellOffer.create({
            creatorId: user._id,
            triggerProductId,
            offerProductId,
            headline,
            subheadline,
            bodyCopy,
            priceOverride,
            expiresSeconds: expiresSeconds || 0,
            isActive: isActive !== undefined ? isActive : true
        });

        return NextResponse.json({ upsell }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating upsell offer:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
