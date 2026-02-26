import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import WebhookEndpoint from '@/lib/models/WebhookEndpoint';
import { getMongoUser } from '@/lib/auth/get-user';

export const dynamic = 'force-dynamic';

// PUT /api/v1/webhooks/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { url, events, isActive } = body;

        const endpoint = await WebhookEndpoint.findOneAndUpdate(
            { _id: params.id, creatorId: user._id },
            { $set: { url, events, isActive, updatedAt: new Date() } },
            { new: true }
        );

        if (!endpoint) return NextResponse.json({ error: 'Webhook endpoint not found' }, { status: 404 });

        return NextResponse.json({ endpoint });
    } catch (error: any) {
        console.error('Error updating webhook endpoint:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/v1/webhooks/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const endpoint = await WebhookEndpoint.findOneAndDelete({ _id: params.id, creatorId: user._id });
        if (!endpoint) return NextResponse.json({ error: 'Webhook endpoint not found' }, { status: 404 });

        return NextResponse.json({ success: true, message: 'Webhook endpoint deleted' });
    } catch (error: any) {
        console.error('Error deleting webhook endpoint:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
