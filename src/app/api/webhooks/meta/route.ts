import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
        return new NextResponse(challenge);
    }
    return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-hub-signature-256');

        if (process.env.INSTAGRAM_APP_SECRET && signature) {
            const expectedHash = crypto
                .createHmac('sha256', process.env.INSTAGRAM_APP_SECRET)
                .update(body)
                .digest('hex');

            if (signature !== `sha256=${expectedHash}`) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        const data = JSON.parse(body);

        // Process Instagram Webhook (Story Reply, Comment, etc.)
        // This is where we trigger the internal automation engine
        if (data.entry && data.entry[0].messaging) {
            const messagingEvent = data.entry[0].messaging[0];
            const senderId = messagingEvent.sender.id;

            // Logic: Find creator associated with this Instagram account
            // Then call internal trigger API
            console.log(`[Meta Webhook] Received message from ${senderId}`);

            // For audit purposes, we demonstrate the relay to our automation engine
            // In production, we'd lookup creatorId by IG recipient ID
            /*
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/automations/trigger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creatorId: '...', // Lookup required
                    triggerType: 'comment',
                    recipient: senderId,
                    metadata: messagingEvent
                })
            });
            */
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Meta Webhook] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
