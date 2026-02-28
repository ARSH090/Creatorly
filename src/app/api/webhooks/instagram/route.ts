import { NextRequest, NextResponse } from 'next/server';
import { InstagramService } from '@/lib/services/instagram';
import { connectToDatabase } from '@/lib/db/mongodb';
import { DMLog } from '@/lib/models/DMLog';
import { AutoReplyRule, AutomationTriggerType, MatchType } from '@/lib/models/AutoReplyRule';
import { User } from '@/lib/models/User';
import { PendingFollowRequest } from '@/lib/models/PendingFollowRequest';
import { SocialAccount } from '@/lib/models/SocialAccount';
import { decryptTokenGCM, decryptTokenWithVersion } from '@/lib/security/encryption';
import { QueueJob } from '@/lib/models/QueueJob';
import { getRandomReply } from '@/lib/services/autoDMService';
import { handleFlowReply, getActiveSession, startFlow } from '@/lib/services/flowExecutor';
import { AutoDMFlow } from '@/lib/models/AutoDMFlow';

/**
 * Instagram Webhook Endpoint
 * 
 * FIXES:
 * - BUG-17: All error paths now return 200 (Meta requires always-200 to stop retries)
 * - BUG-18: Creator lookup now uses entry.id (pageId) not post owner field (which is often absent)
 * - BUG-20: Top-level try/catch returns 200 even on exception
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

        console.warn('[Instagram Webhook] Verification failed');
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
            // BUG-17 FIX: Return 200 to avoid Meta retry loop on server config errors
            return NextResponse.json({ success: true }, { status: 200 });
        }

        if (!signature) {
            console.warn('[Instagram Webhook] Missing signature — dropping');
            // BUG-17 FIX: Return 200 — silently drop unsigned requests
            return NextResponse.json({ success: true }, { status: 200 });
        }

        const isValid = InstagramService.verifyWebhookSignature(body, signature, appSecret);
        if (!isValid) {
            console.warn('[Instagram Webhook] Invalid HMAC signature — dropping');
            // BUG-17 FIX: Return 200 — never 401, Meta retries on non-200
            return NextResponse.json({ success: true }, { status: 200 });
        }

        const payload = JSON.parse(body);

        await connectToDatabase();

        for (const entry of (payload.entry || [])) {
            // Process messaging events
            if (entry.messaging?.length > 0) {
                for (const message of entry.messaging) {
                    await handleIncomingMessage(message).catch(err =>
                        console.error('[Instagram Webhook] handleIncomingMessage error:', err)
                    );
                }
            }

            // Process change events
            for (const change of (entry.changes || [])) {
                if (change.field === 'comments') {
                    // BUG-18 FIX: Pass entry.id (the page/business account ID) for correct creator lookup
                    await handleCommentTrigger(change.value, entry.id).catch(err =>
                        console.error('[Instagram Webhook] handleCommentTrigger error:', err)
                    );
                } else if (change.field === 'follows') {
                    await handleFollowEvent(change.value, entry.id).catch(err =>
                        console.error('[Instagram Webhook] handleFollowEvent error:', err)
                    );
                } else if (change.field === 'mentions') {
                    // Story reply trigger
                    await handleStoryReplyTrigger(change.value, entry.id).catch(err =>
                        console.error('[Instagram Webhook] handleStoryReplyTrigger error:', err)
                    );
                } else {
                    await handleStatusUpdate(change).catch(err =>
                        console.error('[Instagram Webhook] handleStatusUpdate error:', err)
                    );
                }
            }
        }

        // BUG-20 FIX: Always return 200 — even if internal processing had errors (already caught above)
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error('[Instagram Webhook] POST Error:', error);
        // BUG-17/20 FIX: Never return 500 to Meta — always 200 to stop retry loops
        return NextResponse.json({ success: true }, { status: 200 });
    }
}

// DELETED REDUNDANT FUNCTION

// BUG-18 FIX: Accept pageId as parameter instead of trying to read from potentially-absent post owner field
async function handleCommentTrigger(commentValue: any, pageId: string) {
    const { from, text, id: commentId, media } = commentValue;
    if (!from || !text) return;

    const commenterId = from.id;
    const commenterUsername = from.username;

    // Detect if it's a Reel or regular Post
    const isReel = media?.media_product_type === 'REELS';
    const triggerType = isReel ? AutomationTriggerType.REEL_COMMENT : AutomationTriggerType.COMMENT;

    console.log(`[Instagram Webhook] ${isReel ? 'Reel ' : ''}Comment from ${commenterUsername}: ${text}`);

    const socialAccount = await SocialAccount.findOne({ instagramBusinessId: pageId, isActive: true });
    if (!socialAccount) return;
    const creatorId = socialAccount.userId;

    const rules = await AutoReplyRule.find({
        creatorId,
        triggerType: { $in: [triggerType, AutomationTriggerType.COMMENT] },
        isActive: true
    }).sort({ priority: -1 });

    for (const rule of rules) {
        if (!isMatch(text, rule)) continue;

        // Deduplication
        if (await isDeduplicated(creatorId, commenterId, rule)) continue;

        const accessToken = decryptTokenWithVersion(socialAccount.pageAccessToken, socialAccount.tokenIV, socialAccount.tokenTag, socialAccount.keyVersion);
        const igUserId = socialAccount.instagramBusinessId;

        // Follow-First Check
        if (rule.followRequired) {
            const isFollowing = await InstagramService.isFollowing(igUserId, commenterId, accessToken);
            if (!isFollowing) {
                await handleFollowFirstRequired(creatorId, commenterId, commenterUsername, rule, accessToken, igUserId, triggerType);
                return;
            }
        }

        // Pick random reply variant (ManyChat anti-spam rotation)
        const { text: replyVariant, index: usedIndex } = getRandomReply(rule, rule.lastUsedReplyIndex);
        if (usedIndex !== -1 && usedIndex !== rule.lastUsedReplyIndex) {
            rule.lastUsedReplyIndex = usedIndex;
            await (rule as any).save();
        }

        // Update triggered stats
        await AutoReplyRule.findByIdAndUpdate(rule._id, {
            $inc: { 'stats.triggered': 1 },
        });

        // Enqueue Delivery with variant reply text
        await enqueueDelivery(creatorId, commenterId, { ...rule.toObject(), replyText: replyVariant }, accessToken, {
            firstName: commenterUsername,
            firstNameInferred: true,
            source: triggerType
        });

        break; // Only fire the highest-priority matching rule
    }
}

async function handleIncomingMessage(message: any) {
    const senderId = message.sender?.id;
    const recipientId = message.recipient?.id;
    if (!senderId || !recipientId || !message.message) return;

    console.log(`[Instagram Webhook] Incoming message from ${senderId}`);

    // Part 1: Update delivery status for outgoing DMs (if this is a recipient reply)
    const dmLog = await DMLog.findOne({
        recipientId: senderId,
        status: { $in: ['sent', 'pending'] },
    }).sort({ createdAt: -1 });

    if (dmLog) {
        await DMLog.findByIdAndUpdate(dmLog._id, { deliveryStatus: 'delivered' });
    }

    // Identify Creator early (needed for flow session lookup)
    const socialAccountEarly = await SocialAccount.findOne({ instagramBusinessId: recipientId, isActive: true });
    if (!socialAccountEarly) return;
    const creatorIdEarly = socialAccountEarly.userId.toString();

    const messageText = message.message?.text || '';

    // Part 1b: Route to active flow session if exists (email_collect, button replies)
    const activeSession = getActiveSession(senderId, creatorIdEarly);
    if (activeSession) {
        const routed = await handleFlowReply({
            senderIgId: senderId,
            creatorId: creatorIdEarly,
            messageText,
        });
        if (routed) return; // Handled by flow executor
    }

    // Part 2: Handle Auto-Reply Logic (DM Keyword trigger + story mention)
    const isStoryMention = !!message.message?.attachments?.find((a: any) => a.type === 'story_mention');

    const socialAccount = socialAccountEarly;
    const creatorId = socialAccount.userId;

    const triggerType = isStoryMention ? AutomationTriggerType.STORY_MENTION : AutomationTriggerType.DIRECT_MESSAGE;

    // ── Check if DM keyword matches an active AutoDMFlow (multi-step) ───────
    if (!isStoryMention && messageText) {
        const accessTokenForFlow = decryptTokenWithVersion(
            socialAccount.pageAccessToken, socialAccount.tokenIV, socialAccount.tokenTag, socialAccount.keyVersion
        );
        const flows = await AutoDMFlow.find({
            creatorId,
            isActive: true,
            'trigger.type': 'dm_keyword',
        });
        for (const flow of flows) {
            const kwMatch = flow.trigger.keywords?.length === 0 ||
                flow.trigger.keywords?.some((kw: string) => messageText.toLowerCase().includes(kw.toLowerCase()));
            if (kwMatch && flow.steps.length > 0) {
                await startFlow({
                    flowId: flow._id.toString(),
                    recipientIgId: senderId,
                    recipientUsername: message.sender?.username ?? '',
                    creatorId: creatorId.toString(),
                    accessToken: accessTokenForFlow,
                    igUserId: socialAccount.instagramBusinessId,
                });
                return; // Flow started, stop rule matching
            }
        }
    }

    // ── Fall back to simple AutoReplyRules ───────────────────────────────────
    const rules = await AutoReplyRule.find({
        creatorId,
        triggerType: { $in: [triggerType, AutomationTriggerType.DM_KEYWORD] },
        isActive: true
    }).sort({ priority: -1 });

    for (const rule of rules) {
        if (messageText && !isMatch(messageText, rule)) continue;

        // Deduplication
        if (await isDeduplicated(creatorId, senderId, rule)) continue;

        const accessToken = decryptTokenWithVersion(socialAccount.pageAccessToken, socialAccount.tokenIV, socialAccount.tokenTag, socialAccount.keyVersion);
        const igUserId = socialAccount.instagramBusinessId;

        // Follow-First
        if (rule.followRequired) {
            const isFollowing = await InstagramService.isFollowing(igUserId, senderId, accessToken);
            if (!isFollowing) {
                await handleFollowFirstRequired(creatorId, senderId, '', rule, accessToken, igUserId, triggerType);
                return;
            }
        }

        await enqueueDelivery(creatorId, senderId, rule, accessToken, {
            source: triggerType
        });

        break;
    }
}

// Helper Functions
function isMatch(text: string, rule: any): boolean {
    const lowerText = (text || '').toLowerCase();
    const keywords = rule.keywords || [];
    if (keywords.length === 0) return true;

    for (const kw of keywords) {
        const lowerKw = kw.toLowerCase();
        if (rule.matchType === MatchType.EXACT && lowerText === lowerKw) return true;
        if (rule.matchType === MatchType.CONTAINS && lowerText.includes(lowerKw)) return true;
        if (rule.matchType === MatchType.STARTS_WITH && lowerText.startsWith(lowerKw)) return true;
        if (rule.matchType === MatchType.REGEX) {
            try { if (new RegExp(lowerKw, 'i').test(lowerText)) return true; } catch { }
        }
    }
    return false;
}

async function isDeduplicated(creatorId: any, recipientId: string, rule: any): Promise<boolean> {
    const window = rule.deduplicationWindow || '24h';
    if (window === 'never') return false;

    const msMap: Record<string, number> = {
        '1h': 3600000,
        '24h': 86400000,
        '7d': 604800000,
        '30d': 2592000000,
        'lifetime': 0
    };

    const query: any = {
        creatorId,
        recipientId,
        ruleId: rule._id,
        status: 'success'
    };

    if (window !== 'lifetime') {
        query.createdAt = { $gt: new Date(Date.now() - msMap[window]) };
    }

    const exists = await DMLog.findOne(query);
    return !!exists;
}

async function handleFollowFirstRequired(creatorId: any, recipientId: string, username: string, rule: any, accessToken: string, igUserId: string, triggerType: string) {
    const alreadyWaiting = await PendingFollowRequest.findOne({
        creatorId,

        recipientId: recipientId,
        ruleId: rule._id,
        status: 'waiting_follow'
    });

    if (!alreadyWaiting) {
        const followMsg = rule.followFirstMessage || `Hey! Follow me first, then I'll send you the link instantly! 🔥`;

        await InstagramService.sendDirectMessage({
            recipientId,
            message: followMsg,
            accessToken,
            igUserId
        });

        await PendingFollowRequest.create({
            creatorId: creatorId,
            platform: 'instagram',
            recipientId,
            recipientUsername: username,
            igUserId,
            ruleId: rule._id,
            triggerType,
            requestedContent: rule.replyText,
            followFirstMessageSent: true,
            status: 'waiting_follow',
            expiresAt: new Date(Date.now() + (rule.followExpiry || 24) * 60 * 60 * 1000)
        });
    }
}

async function enqueueDelivery(creatorId: any, recipientId: string, rule: any, accessToken: string, variables: any = {}) {
    await QueueJob.create({
        type: 'dm_delivery',
        payload: {
            recipientId,
            text: rule.replyText,
            accessToken,
            creatorId,
            ruleId: rule._id,
            platform: 'instagram',
            messageType: rule.messageType,
            carouselMessages: rule.carouselMessages,
            attachmentType: rule.attachmentType,
            attachmentId: rule.attachmentId,
            source: variables.source || 'automation',
            variables
        },
        status: 'pending',
        nextRunAt: new Date()
    });

    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/workers/process-queue`, {
        headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` }
    }).catch(() => { });
}

// ─── Story Reply Trigger ──────────────────────────────────────────────────────

async function handleStoryReplyTrigger(mentionValue: any, pageId: string) {
    if (mentionValue?.media_type !== 'STORY') return;

    const replyText = mentionValue?.text || '';
    const replierIgId = mentionValue?.from?.id;
    const replierUsername = mentionValue?.from?.username || '';

    console.log(`[Instagram Webhook] Story reply from ${replierUsername}: ${replyText}`);

    const socialAccount = await SocialAccount.findOne({ instagramBusinessId: pageId, isActive: true });
    if (!socialAccount) return;
    const creatorId = socialAccount.userId;

    const rules = await AutoReplyRule.find({
        creatorId,
        triggerType: AutomationTriggerType.STORY_REPLY,
        isActive: true,
    }).sort({ priority: -1 });

    for (const rule of rules) {
        if (replyText && !isMatch(replyText, rule)) continue;
        if (await isDeduplicated(creatorId, replierIgId, rule)) continue;

        const accessToken = decryptTokenWithVersion(socialAccount.pageAccessToken, socialAccount.tokenIV, socialAccount.tokenTag, socialAccount.keyVersion);
        const { text: replyVariant } = getRandomReply(rule, rule.lastUsedReplyIndex);

        await enqueueDelivery(creatorId, replierIgId, { ...rule.toObject(), replyText: replyVariant }, accessToken, {
            firstName: replierUsername,
            source: 'story_reply',
        });
        break;
    }
}

// ─── New Follower ──────────────────────────────────────────────────────────────

async function handleFollowEvent(followValue: any, pageId?: string) {
    const followerId = followValue.id;
    const followerUsername = followValue.username;

    console.log(`[Instagram Webhook] New follower: ${followerUsername} (${followerId})`);

    const socialAccount = await SocialAccount.findOne({
        instagramBusinessId: followValue.to?.id,
        platform: 'instagram',
        isActive: true
    });
    if (!socialAccount) {
        console.warn(`[Instagram Webhook] No active SocialAccount for instagramBusinessId: ${followValue.to?.id}`);
        return;
    }

    const creator = await User.findById(socialAccount.userId);
    if (!creator) return;

    const pendingRequests = await PendingFollowRequest.find({
        creatorId: creator._id,
        recipientId: followerId,
        status: 'waiting_follow',
        expiresAt: { $gt: new Date() }
    });

    if (pendingRequests.length === 0) return;

    const accessToken = decryptTokenWithVersion(socialAccount.pageAccessToken, socialAccount.tokenIV, socialAccount.tokenTag, socialAccount.keyVersion);

    const igUserId = socialAccount.instagramBusinessId;
    if (!accessToken || !igUserId) return;

    for (const request of pendingRequests) {
        const sendResult = await InstagramService.sendDirectMessage({
            recipientId: followerId,
            message: request.requestedContent,
            accessToken,
            igUserId
        });

        if (sendResult.success) {
            request.status = 'completed';
            await request.save();

            await DMLog.create({
                creatorId: creator._id,
                recipientUsername: followerUsername,
                recipientId: followerId,
                messageSent: request.requestedContent,
                status: 'success',
                deliveryStatus: 'sent',
                provider: 'instagram',
                triggerSource: 'automation',
                lastInteractionAt: new Date(),
                ruleId: request.ruleId,
                messageId: sendResult.messageId
            });

            console.log(`[Instagram Webhook] Pending DM sent to new follower ${followerUsername}`);
        }
    }

    // ── Also fire new_follow AutoReplyRules (welcome DM) ─────────────────────
    if (!socialAccount) return;
    const creator = await User.findById(socialAccount.userId);
    if (!creator) return;

    const welcomeRules = await AutoReplyRule.find({
        creatorId: creator._id,
        triggerType: AutomationTriggerType.NEW_FOLLOW,
        isActive: true,
    }).sort({ priority: -1 }).limit(1);

    if (welcomeRules.length > 0) {
        const accessToken = decryptTokenWithVersion(socialAccount.pageAccessToken, socialAccount.tokenIV, socialAccount.tokenTag, socialAccount.keyVersion);
        const rule = welcomeRules[0];
        const { text: welcomeText } = getRandomReply(rule, rule.lastUsedReplyIndex);
        const personalised = welcomeText
            .replace('{{name}}', followerUsername)
            .replace('{{username}}', followerUsername);

        await InstagramService.sendDirectMessage({
            recipientId: followerId,
            message: personalised,
            accessToken,
            igUserId: socialAccount.instagramBusinessId,
        });

        await DMLog.create({
            creatorId: creator._id,
            recipientId: followerId,
            recipientUsername: followerUsername,
            messageSent: personalised,
            status: 'success',
            deliveryStatus: 'sent',
            provider: 'instagram',
            triggerSource: 'automation',
            lastInteractionAt: new Date(),
            ruleId: rule._id,
        });
    }
}

async function handleStatusUpdate(change: any) {
    const field = change.field;
    const value = change.value;

    if (field !== 'messages') return;

    const messageId = value?.message_id;
    const status = value?.status;

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

    await DMLog.findOneAndUpdate({ messageId }, updateData);
}
