import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WebhookEventLog } from '@/lib/models/WebhookEventLog';
import { SocialAccount } from '@/lib/models/SocialAccount';
import { AutoReplyRule, AutomationTriggerType, MatchType } from '@/lib/models/AutoReplyRule';
import { DMLog } from '@/lib/models/DMLog';
import { decryptTokenGCM } from '@/lib/security/encryption';
import { MetaGraphService } from '@/lib/services/meta';
import { metaRateLimiter } from '@/lib/security/ratelimit';

/**
 * GET Handler for Webhook Verification
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
}

/**
 * POST Handler for Event Processing
 */
export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const body = JSON.parse(rawBody);
        const signature = req.headers.get('x-hub-signature-256');

        // 1. Hardened Signature Verification (Timing-Safe)
        if (!signature || !validateSignature(signature, rawBody)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        await connectToDatabase();

        // 2. Idempotency Check (Prevent duplicate processing of Meta retries)
        const eventId = body.entry?.[0]?.id || body.entry?.[0]?.time?.toString() || Date.now().toString();
        const existingEvent = await WebhookEventLog.findOne({ eventId });
        if (existingEvent && existingEvent.processed) {
            return NextResponse.json({ status: 'idempotent_skip' });
        }

        // Log Raw Event
        const eventLog = await WebhookEventLog.create({
            eventId,
            payload: body,
            receivedAt: new Date()
        });

        // 3. Process Entries (Parallel execution to prevent timeout)
        const tasks: Promise<any>[] = [];

        for (const entry of body.entry) {
            const igId = entry.id;
            const account = await SocialAccount.findOne({ instagramBusinessId: igId, isActive: true });

            if (!account) continue;

            // Decrypt page access token
            if (!account.pageAccessToken || !account.tokenIV || !account.tokenTag) {
                console.warn('SocialAccount has missing encryption fields; skipping automation for', igId);
                continue;
            }

            const decryptedToken = decryptTokenGCM(
                account.pageAccessToken,
                account.tokenIV,
                account.tokenTag
            );

            if (entry.messaging) {
                for (const messageEvent of entry.messaging) {
                    tasks.push(handleMessageEvent(messageEvent, account.userId.toString(), decryptedToken, account.instagramBusinessId));
                }
            } else if (entry.changes) {
                for (const change of entry.changes) {
                    if (change.field === 'feed') {
                        tasks.push(handleCommentEvent(change.value, account.userId.toString(), igId, decryptedToken));
                    }
                }
            }
        }

        // Wait for all automations to complete or fail in parallel
        if (tasks.length > 0) {
            await Promise.allSettled(tasks);
        }


        // Mark as processed
        eventLog.processed = true;
        await eventLog.save();

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * Hardened Signature Validation (Constant-Time)
 */
function validateSignature(signature: string, payload: string): boolean {
    const [algorithm, hash] = signature.split('=');
    if (algorithm !== 'sha256') return false;

    const hmac = crypto.createHmac('sha256', process.env.META_APP_SECRET!);
    const digest = Buffer.from(hmac.update(payload).digest('hex'), 'utf8');
    const signatureBuffer = Buffer.from(hash, 'utf8');

    if (digest.length !== signatureBuffer.length) return false;
    return crypto.timingSafeEqual(digest, signatureBuffer);
}

/**
 * Handler for Direct Messages
 */
async function handleMessageEvent(event: any, creatorId: string, accessToken: string, businessId: string) {
    const senderId = event.sender.id;
    const text = event.message?.text?.toLowerCase();
    if (!text) return;

    // 1. Loop Prevention: Don't reply if the sender is our own Business ID
    if (senderId === businessId) {
        return;
    }

    // 2. Spam Loop Protection: Ensure we don't reply more than once every 30s to the same user text
    const loopKey = `meta:loop:${creatorId}:${senderId}:${Buffer.from(text).toString('hex').slice(0, 32)}`;
    if (await metaRateLimiter.isRateLimited(loopKey, 1, 30)) {
        console.warn('Recursive loop detected or spam. Skipping...');
        return;
    }

    const { limited } = await metaRateLimiter.checkMetaQuota(creatorId, senderId);
    if (limited) return;

    const rules = await AutoReplyRule.find({
        creatorId,
        triggerType: AutomationTriggerType.DIRECT_MESSAGE,
        isActive: true
    }).sort({ priority: -1 });

    for (const rule of rules) {
        if (isMatch(text, rule)) {
            // Check 24-Hour Rule: Interaction must be recent
            if (isWithin24Hours(event.timestamp)) {
                await executeAutomation(rule, senderId, accessToken, creatorId, 'dm');
                break;
            }
        }
    }
}

/**
 * Handler for Comments
 */
async function handleCommentEvent(value: any, creatorId: string, igId: string, accessToken: string) {
    if (value.item !== 'comment' || value.verb !== 'add') return;

    const text = value.text?.toLowerCase();
    const senderId = value.from.id;

    if (!text || !senderId) return;

    const { limited } = await metaRateLimiter.checkMetaQuota(creatorId, senderId);
    if (limited) return;

    const rules = await AutoReplyRule.find({
        creatorId,
        triggerType: AutomationTriggerType.COMMENT,
        isActive: true
    }).sort({ priority: -1 });

    for (const rule of rules) {
        if (isMatch(text, rule)) {
            await executeAutomation(rule, senderId, accessToken, creatorId, 'comment');
            break;
        }
    }
}

/**
 * 24-Hour Messaging Window Guard
 */
function isWithin24Hours(timestamp: number): boolean {
    const now = Date.now();
    // Meta sends timestamp in MS
    const diff = now - timestamp;
    return diff < 24 * 60 * 60 * 1000;
}

/**
 * Keyword Matching Logic
 *
 * Supports multi-keyword rules and the MatchType enum, while remaining
 * backwards compatible with any legacy single-keyword field.
 */
function isMatch(text: string, rule: any): boolean {
    const keywords: string[] = Array.isArray(rule.keywords) && rule.keywords.length > 0
        ? rule.keywords
        : rule.keyword
            ? [rule.keyword]
            : [];

    if (keywords.length === 0) return false;

    for (const raw of keywords) {
        const kw = (raw || '').toLowerCase();
        if (!kw) continue;

        if (rule.matchType === MatchType.EXACT && text === kw) return true;
        if (rule.matchType === MatchType.CONTAINS && text.includes(kw)) return true;
        if (rule.matchType === MatchType.REGEX) {
            try {
                if (new RegExp(kw, 'i').test(text)) return true;
            } catch {
                // Ignore invalid regex patterns for robustness
            }
        }
    }

    return false;
}


/**
 * Final Automation Execution
 */
async function executeAutomation(rule: any, recipientId: string, accessToken: string, creatorId: string, source: 'dm' | 'comment') {
    try {
        await MetaGraphService.sendDirectMessage({
            recipientId,
            message: rule.replyText,
            accessToken
        });

        await DMLog.create({
            creatorId,
            recipientId,
            ruleId: rule._id,
            triggerSource: source,
            status: 'success',
            messageSent: rule.replyText,
            lastInteractionAt: new Date()
        });

    } catch (error: any) {
        await DMLog.create({
            creatorId,
            recipientId,
            ruleId: rule._id,
            triggerSource: source,
            status: 'failed',
            messageSent: rule.replyText,
            errorDetails: error.message
        });

    }
}
