import { NextRequest, NextResponse } from 'next/server';
import { InstagramService } from '@/lib/services/instagram';
import { connectToDatabase } from '@/lib/db/mongodb';
import { DMLog } from '@/lib/models/DMLog';

/**
 * Instagram Webhook Endpoint
 * Handles incoming webhooks from Instagram Graph API
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('hub.mode');
        const token = searchParams.get('hub.verify_token');
        const challenge = searchParams.get('hub.challenge');

        const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;

        if (mode === 'subscribe' && token === verifyToken) {
            console.log('[Instagram Webhook] Subscription verified');
            return new NextResponse(challenge, { status: 200 });
        }

        console.log('[Instagram Webhook] Verification failed');
        return NextResponse.json({ success: false, message: 'Verification failed' }, { status: 403 });

    } catch (error: any) {
        console.error('[Instagram Webhook] GET Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-hub-signature-256');

        const appSecret = process.env.INSTAGRAM_APP_SECRET;
        if (!appSecret) {
            console.error('[Instagram Webhook] Missing INSTAGRAM_APP_SECRET');
            return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
        }

        if (!signature) {
            console.error('[Instagram Webhook] Missing signature');
            return NextResponse.json({ success: false, message: 'Missing signature' }, { status: 401 });
        }

        const isValid = InstagramService.verifyWebhookSignature(body, signature, appSecret);
        if (!isValid) {
            console.error('[Instagram Webhook] Invalid signature');
            return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
        }

        const payload = JSON.parse(body);
        const entry = payload.entry?.[0];

        if (!entry) {
            return NextResponse.json({ success: true, message: 'No entries' }, { status: 200 });
        }

        await connectToDatabase();

        const messaging = entry.messaging;
        if (messaging && messaging.length > 0) {
            for (const message of messaging) {
                await handleIncomingMessage(message);
            }
        }

        const changes = entry.changes;
        if (changes && changes.length > 0) {
            for (const change of changes) {
                await handleStatusUpdate(change);
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error('[Instagram Webhook] POST Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

async function handleIncomingMessage(message: any) {
    const senderId = message.sender?.id;
    const messageText = message.message?.text;

    console.log(`[Instagram Webhook] Incoming message from ${senderId}: ${messageText}`);

    const dmLog = await DMLog.findOne({
        recipientId: senderId,
        status: 'success',
    }).sort({ createdAt: -1 });

    if (dmLog) {
        await DMLog.findByIdAndUpdate(dmLog._id, {
            deliveryStatus: 'delivered',
        });
    }
}

async function handleStatusUpdate(change: any) {
    const field = change.field;
    const value = change.value;

    if (field !== 'messages') return;

    const messageId = value?.message_id;
    const status = value?.status;

    console.log(`[Instagram Webhook] Message ${messageId} status: ${status}`);

    if (!messageId) return;

    const deliveryStatusMap: Record<string, 'sent' | 'delivered' | 'read'> = {
        'sent': 'sent',
        'delivered': 'delivered',
        'read': 'read',
    };

    const newStatus = deliveryStatusMap[status];
    if (!newStatus) return;

    const updateData: any = { deliveryStatus: newStatus };
    if (newStatus === 'read') {
        updateData.metadata = { readAt: new Date() };
    }

    await DMLog.findOneAndUpdate(
        { messageId },
        updateData
    );
}
