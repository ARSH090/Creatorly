import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import WebhookEndpoint from '@/lib/models/WebhookEndpoint';
import { getMongoUser } from '@/lib/auth/get-user';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// GET /api/v1/webhooks
export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const endpoints = await WebhookEndpoint.find({ creatorId: user._id })
            .sort({ createdAt: -1 });

        return NextResponse.json({ endpoints });
    } catch (error: any) {
        console.error('Error fetching webhook endpoints:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/v1/webhooks
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { url, events } = body;

        if (!url || !events || !Array.isArray(events) || events.length === 0) {
            return NextResponse.json({ error: 'URL and at least one event type are required' }, { status: 400 });
        }

        // Auto-generate a secret if not provided
        const secret = 'whsec_' + crypto.randomBytes(24).toString('hex');

        const endpoint = await WebhookEndpoint.create({
            creatorId: user._id,
            url,
            events,
            secret,
            isActive: true
        });

        return NextResponse.json({ endpoint }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating webhook endpoint:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
