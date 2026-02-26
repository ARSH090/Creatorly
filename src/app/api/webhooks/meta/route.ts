import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WebhookEventLog } from '@/lib/models/WebhookEventLog';
import { SocialAccount } from '@/lib/models/SocialAccount';
import { AutoReplyRule, AutomationTriggerType, MatchType } from '@/lib/models/AutoReplyRule';
import { DMLog } from '@/lib/models/DMLog';
import { decryptTokenGCM } from '@/lib/security/encryption';
import { MetaGraphService } from '@/lib/services/meta';
import { InstagramService } from '@/lib/services/instagram';
import { metaRateLimiter } from '@/lib/security/ratelimit';
import { QueueJob } from '@/lib/models/QueueJob';
import { PendingFollowRequest } from '@/lib/models/PendingFollowRequest';

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
        const startTime = Date.now();
        const payloadHash = crypto.createHash('md5').update(rawBody).digest('hex');
        const eventLog = await WebhookEventLog.create({
            eventId,
            platform: 'instagram',
            eventType: body.entry?.[0]?.changes?.[0]?.field || body.entry?.[0]?.messaging?.[0] ? 'messaging' : 'unknown',
            payloadHash,
            payload: body,
            receivedAt: new Date(),
            status: 'pending'
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
                account.pageAccessToken!,
                account.tokenIV!,
                account.tokenTag!
            );

            if (entry.messaging) {
                for (const messageEvent of entry.messaging) {
                    tasks.push(handleMessageEvent(messageEvent, account.userId.toString(), decryptedToken, account.instagramBusinessId));
                }
            } else if (entry.changes) {
                for (const change of entry.changes) {
                    if (change.field === 'feed') {
                        tasks.push(handleCommentEvent(change.value, account.userId.toString(), igId, decryptedToken));
                    } else if (change.field === 'followed_by') {
                        tasks.push(handleFollowEvent(change.value, account.userId.toString(), igId, decryptedToken));
                    }
                }
            }
        }

        // Wait for all automations to complete or fail in parallel
        if (tasks.length > 0) {
            await Promise.allSettled(tasks);
        }

        // Update Event Log with Performance Metrics
        const endTime = Date.now();
        eventLog.status = 'processed';
        eventLog.processed = true;
        eventLog.processedAt = new Date();
        eventLog.processingTime = endTime - startTime;
        await eventLog.save();

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error('CRITICAL Meta Webhook Process Failure:', error);
        // Generic error to prevent info disclosure
        return NextResponse.json({ error: 'Process failure' }, { status: 200 });
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
        isActive: true
    }).sort({ priority: -1 });

    // Check for Story Reply specifically or DM
    const isStoryReply = !!event.message?.reply_to;
    const triggerType = isStoryReply ? AutomationTriggerType.STORY_REPLY : AutomationTriggerType.DIRECT_MESSAGE;

    for (const rule of rules) {
        if (rule.triggerType === triggerType && isMatch(text, rule)) {
            // Check 24-Hour Rule: Interaction must be recent
            if (isWithin24Hours(event.timestamp)) {
                await processRuleExecution(rule, senderId, accessToken, creatorId, isStoryReply ? 'story_reply' : 'dm');
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
            await processRuleExecution(rule, senderId, accessToken, creatorId, 'comment');
            break;
        }
    }
}

/**
 * Handler for Follow Events
 */
async function handleFollowEvent(value: any, creatorId: string, igId: string, accessToken: string) {
    const followerId = value.id;
    if (!followerId) return;

    console.log(`[Instagram Webhook] New follow detected: ${followerId} for creator ${creatorId}`);

    // 1. Check for Pending Follow Requests
    const pendingRequests = await PendingFollowRequest.find({
        creatorId,
        recipientId: followerId,
        status: 'waiting',
        expiresAt: { $gt: new Date() }
    });

    for (const request of pendingRequests) {
        // Delivery logic for pending request
        await executeAutomationRaw({
            text: request.requestedContent,
            recipientId: followerId,
            accessToken,
            creatorId,
            ruleId: request.ruleId.toString(),
            source: 'new_follow'
        });

        request.status = 'completed';
        await request.save();
    }

    // 2. Trigger "New Follower" Automation Rules if active
    const followRules = await AutoReplyRule.find({
        creatorId,
        triggerType: AutomationTriggerType.NEW_FOLLOW,
        isActive: true
    });

    for (const rule of followRules) {
        await processRuleExecution(rule, followerId, accessToken, creatorId, 'new_follow');
    }
}

/**
 * Higher-level Rule Execution with 'Follow First' middleware
 */
async function processRuleExecution(rule: any, recipientId: string, accessToken: string, creatorId: string, source: any) {
    // 1. Check Follow Requirement
    if (rule.followRequired) {
        const isFollowing = await InstagramService.isFollowing(rule.creatorId.toString(), recipientId, accessToken);

        if (!isFollowing) {
            // Check if we've already asked them to follow in the last 24h
            const existingPending = await PendingFollowRequest.findOne({
                creatorId,
                recipientId,
                ruleId: rule._id,
                status: 'waiting'
            });

            if (!existingPending) {
                // Send "Follow First" DM
                const followFirstMsg = `Hey! Follow me first, then drop your comment again (or just wait a sec) and I'll send you the link instantly! 🔥`;

                await executeAutomationRaw({
                    text: followFirstMsg,
                    recipientId,
                    accessToken,
                    creatorId,
                    ruleId: rule._id,
                    source
                });

                // Store in Pending list
                await PendingFollowRequest.create({
                    creatorId,
                    platform: 'instagram',
                    recipientId,
                    ruleId: rule._id,
                    requestedType: rule.attachmentType || 'custom',
                    requestedId: rule.attachmentId,
                    requestedContent: rule.replyText,
                    expiresAt: new Date(Date.now() + (rule.cooldownHours || 24) * 60 * 60 * 1000)
                });
            }
            return;
        }
    }

    // 2. Direct Execution
    await executeAutomation(rule, recipientId, accessToken, creatorId, source);
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
/**
 * Final Automation Execution (Queued)
 */
async function executeAutomation(rule: any, recipientId: string, accessToken: string, creatorId: string, source: 'dm' | 'comment' | 'story_reply' | 'new_follow') {
    await executeAutomationRaw({
        recipientId,
        text: rule.replyText,
        accessToken,
        creatorId,
        ruleId: rule._id,
        source
    });
}

/**
 * Raw Automation Execution (Queued)
 */
async function executeAutomationRaw(params: {
    recipientId: string;
    text: string;
    accessToken: string;
    creatorId: string;
    ruleId?: string;
    source: string;
}) {
    try {
        // Persist job to MongoDB Queue for reliable delivery
        await QueueJob.create({
            type: 'dm_delivery',
            payload: params,
            status: 'pending',
            nextRunAt: new Date() // ready immediately
        });

        // Trigger worker
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/workers/process-queue`, {
            headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` }
        }).catch(err => console.error('Failed to trigger worker:', err));

        console.log(`[Queue] Enqueued DM for ${params.recipientId}`);

    } catch (error: any) {
        console.error('Failed to enqueue job:', error);
        await DMLog.create({
            creatorId: params.creatorId,
            recipientId: params.recipientId,
            ruleId: params.ruleId,
            triggerSource: params.source,
            status: 'failed',
            messageSent: params.text,
            errorDetails: `Queue creation failed: ${error.message}`
        });
    }
}
