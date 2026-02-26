import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AutoReplyRule, AutomationTriggerType, MatchType } from '@/lib/models/AutoReplyRule';
import { DMLog } from '@/lib/models/DMLog';
import { User } from '@/lib/models/User';
import { WhatsAppContact } from '@/lib/models/WhatsAppContact';
import { QueueJob } from '@/lib/models/QueueJob';

/**
 * WhatsApp Webhook Endpoint
 */

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get('x-hub-signature-256');

        if (!signature || !validateSignature(signature, rawBody)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const body = JSON.parse(rawBody);
        await connectToDatabase();

        // WhatsApp structure: entry[0].changes[0].value.messages
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (value?.messages) {
            for (const message of value.messages) {
                await handleIncomingMessage(message, value.metadata.phone_number_id);
            }
        }

        if (value?.statuses) {
            for (const status of value.statuses) {
                await handleStatusUpdate(status);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[WhatsApp Webhook] POST Error:', error);
        return NextResponse.json({ success: true }, { status: 200 });
    }
}

function validateSignature(signature: string, payload: string): boolean {
    const hash = signature.split('=')[1];
    const hmac = crypto.createHmac('sha256', process.env.INSTAGRAM_APP_SECRET!); // Reusing Meta App Secret
    const digest = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(digest));
}

async function handleIncomingMessage(message: any, phoneNumberId: string) {
    const from = message.from; // Sender's phone number
    const messageId = message.id;
    const type = message.type;
    let text = '';

    if (type === 'text') {
        text = message.text?.body;
    } else if (type === 'interactive') {
        text = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title;
    }

    if (!text) return;

    // 1. Identify Creator
    const creator = await User.findOne({ 'whatsappConfig.phoneNumberId': phoneNumberId });
    if (!creator) return;

    // 2. Upsert Contact
    await WhatsAppContact.findOneAndUpdate(
        { creatorId: creator._id, phone: from },
        {
            $set: { lastMessageAt: new Date(), conversationStatus: 'active' },
            $setOnInsert: { creatorId: creator._id, phone: from, optedOut: false }
        },
        { upsert: true }
    );

    // 3. Find Matching Rules
    const rules = await AutoReplyRule.find({
        creatorId: creator._id,
        platform: 'whatsapp',
        isActive: true
    }).sort({ priority: -1 });

    for (const rule of rules) {
        if (isMatch(text, rule)) {
            // Enqueue Job
            await QueueJob.create({
                type: 'dm_delivery',
                payload: {
                    recipientId: from,
                    text: rule.replyText,
                    creatorId: creator._id,
                    ruleId: rule._id,
                    platform: 'whatsapp',
                    messageType: rule.messageType,
                    attachmentType: rule.attachmentType,
                    attachmentId: rule.attachmentId,
                    variables: {
                        firstName: message.contacts?.[0]?.profile?.name || 'there'
                    }
                },
                status: 'pending',
                nextRunAt: new Date()
            });

            // Trigger worker
            fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/workers/process-queue`, {
                headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` }
            }).catch(() => { });

            break;
        }
    }
}

async function handleStatusUpdate(status: any) {
    const messageId = status.id;
    const deliveryStatus = status.status; // delivered, read, sent, failed

    const statusMap: Record<string, string> = {
        'sent': 'sent',
        'delivered': 'delivered',
        'read': 'read',
        'failed': 'failed'
    };

    const mappedStatus = statusMap[deliveryStatus];

    if (mappedStatus) {
        await DMLog.findOneAndUpdate(
            { messageId, provider: 'whatsapp' },
            { deliveryStatus: mappedStatus }
        );
    }
}

function isMatch(text: string, rule: any): boolean {
    const lowerText = text.toLowerCase();
    const keywords = rule.keywords || [];

    if (keywords.length === 0) return true; // Match all if no keywords

    for (const kw of keywords) {
        const lowerKw = kw.toLowerCase();
        if (rule.matchType === MatchType.EXACT && lowerText === lowerKw) return true;
        if (rule.matchType === MatchType.CONTAINS && lowerText.includes(lowerKw)) return true;
        if (rule.matchType === MatchType.STARTS_WITH && lowerText.startsWith(lowerKw)) return true;
        if (rule.matchType === MatchType.REGEX) {
            try {
                if (new RegExp(lowerKw, 'i').test(lowerText)) return true;
            } catch { }
        }
    }
    return false;
}
