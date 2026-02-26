import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import WebhookDelivery from '@/lib/models/WebhookDelivery';
import WebhookEndpoint from '@/lib/models/WebhookEndpoint';
import { getMongoUser } from '@/lib/auth/get-user';

export const dynamic = 'force-dynamic';

// GET /api/v1/webhooks/:id/deliveries
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Verify ownership
        const endpoint = await WebhookEndpoint.findOne({ _id: params.id, creatorId: user._id });
        if (!endpoint) return NextResponse.json({ error: 'Webhook endpoint not found' }, { status: 404 });

        const deliveries = await WebhookDelivery.find({ endpointId: params.id })
            .sort({ createdAt: -1 })
            .limit(50); // Last 50 deliveries as per requirement

        return NextResponse.json({ deliveries });
    } catch (error: any) {
        console.error('Error fetching webhook deliveries:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
