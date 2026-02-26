import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import UpsellOffer from '@/lib/models/UpsellOffer';
import { getMongoUser } from '@/lib/auth/get-user';

export const dynamic = 'force-dynamic';

// PUT /api/v1/upsells/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const upsell = await UpsellOffer.findOneAndUpdate(
            { _id: params.id, creatorId: user._id },
            { $set: body },
            { new: true }
        );

        if (!upsell) return NextResponse.json({ error: 'Upsell offer not found' }, { status: 404 });

        return NextResponse.json({ upsell });
    } catch (error: any) {
        console.error('Error updating upsell offer:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/v1/upsells/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const upsell = await UpsellOffer.findOneAndDelete({ _id: params.id, creatorId: user._id });
        if (!upsell) return NextResponse.json({ error: 'Upsell offer not found' }, { status: 404 });

        return NextResponse.json({ success: true, message: 'Upsell offer deleted' });
    } catch (error: any) {
        console.error('Error deleting upsell offer:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
