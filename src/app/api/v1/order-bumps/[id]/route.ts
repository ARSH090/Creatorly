import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import OrderBump from '@/lib/models/OrderBump';
import { getMongoUser } from '@/lib/auth/get-user';

export const dynamic = 'force-dynamic';

// PUT /api/v1/order-bumps/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const bump = await OrderBump.findOneAndUpdate(
            { _id: params.id, creatorId: user._id },
            { $set: body },
            { new: true }
        );

        if (!bump) return NextResponse.json({ error: 'Order bump not found' }, { status: 404 });

        return NextResponse.json({ bump });
    } catch (error: any) {
        console.error('Error updating order bump:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/v1/order-bumps/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const bump = await OrderBump.findOneAndDelete({ _id: params.id, creatorId: user._id });
        if (!bump) return NextResponse.json({ error: 'Order bump not found' }, { status: 404 });

        return NextResponse.json({ success: true, message: 'Order bump deleted' });
    } catch (error: any) {
        console.error('Error deleting order bump:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
