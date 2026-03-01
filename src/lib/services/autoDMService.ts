import { AutoDMRule } from '@/lib/models/AutoDMRule';
import { AutoDMLog } from '@/lib/models/AutoDMLog';
import { PendingFollower } from '@/lib/models/PendingFollower';
// Use your own internal pub/sub or Pusher for this
// import { getPusherInstance } from '@/lib/pusher'; 

export async function processCommentTrigger(data: {
    creatorId: string;
    creatorIgId: string;
    accessToken: string;
    postId: string;
    commentId: string;
    commentText: string;
    commenterIgId: string;
    commenterUsername: string;
}) {
    // 1. Get all active rules for this creator
    const rules = await AutoDMRule.find({
        creatorId: data.creatorId,
        isActive: true
    });

    if (!rules.length) return;

    // 2. Find matching rule
    const matchedRule = rules.find(rule => {
        // Check if this rule is for a specific post
        if (rule.postId && rule.postId !== data.postId && rule.postId !== 'all') return false;

        const comment = rule.caseSensitive
            ? data.commentText.trim()
            : data.commentText.toLowerCase().trim();

        const keyword = rule.caseSensitive
            ? rule.keyword
            : rule.keyword.toLowerCase();

        switch (rule.matchType) {
            case 'exact': return comment === keyword;
            case 'contains': return comment.includes(keyword);
            case 'startsWith': return comment.startsWith(keyword);
            default: return false;
        }
    });

    if (!matchedRule) return;

    // 3. Check daily limit
    const now = new Date();
    const lastReset = matchedRule.lastResetAt;
    const isNewDay = !lastReset || lastReset.toDateString() !== now.toDateString();

    if (isNewDay) {
        await AutoDMRule.findByIdAndUpdate(matchedRule._id, {
            dmsSentToday: 0,
            lastResetAt: now
        });
        matchedRule.dmsSentToday = 0;
    }

    if (matchedRule.dmsSentToday >= matchedRule.dailyLimit) {
        await logAutoDM({ ...data, triggerType: 'comment', matchedKeyword: matchedRule.keyword, dmSent: false, failureReason: 'daily_limit', rule: matchedRule });
        return;
    }

    // 4. Check dmOncePerUser
    if (matchedRule.dmOncePerUser) {
        const alreadySent = await AutoDMLog.findOne({
            ruleId: matchedRule._id,
            instagramUserId: data.commenterIgId,
            dmSent: true
        });
        if (alreadySent) {
            await logAutoDM({ ...data, triggerType: 'comment', matchedKeyword: matchedRule.keyword, dmSent: false, failureReason: 'already_sent', rule: matchedRule });
            return;
        }
    }

    // 5. Follow gate check
    if (matchedRule.followGate.enabled) {
        const isFollowing = await checkIsFollower(
            data.accessToken,
            data.creatorIgId,
            data.commenterIgId
        );

        if (!isFollowing) {
            // Reply publicly on comment
            const replyText = matchedRule.followGate.replyToNonFollower
                .replace('{{name}}', `@${data.commenterUsername}`);

            await replyToComment(data.accessToken, data.commentId, replyText);

            // Add to pending list
            await PendingFollower.findOneAndUpdate(
                { ruleId: matchedRule._id, instagramUserId: data.commenterIgId },
                {
                    creatorId: data.creatorId,
                    ruleId: matchedRule._id,
                    instagramUserId: data.commenterIgId,
                    instagramUsername: data.commenterUsername,
                    commentId: data.commentId,
                    postId: data.postId,
                    commentText: data.commentText,
                    keyword: matchedRule.keyword,
                    pendingMessage: buildDMMessage(
                        matchedRule.followGate.dmAfterFollow,
                        data.commenterUsername,
                        matchedRule.link
                    ),
                    triggeredAt: new Date(),
                    expiresAt: new Date(Date.now() + matchedRule.followGate.checkDurationHours * 60 * 60 * 1000),
                    lastCheckedAt: new Date(),
                    checkCount: 0,
                    status: 'pending',
                },
                { upsert: true }
            );

            await AutoDMRule.findByIdAndUpdate(matchedRule._id, {
                $inc: { totalTriggers: 1, totalFollowGateBlocked: 1 }
            });

            await notifyCreatorDashboard(data.creatorId, {
                type: 'autodm_follow_gate',
                username: data.commenterUsername,
                keyword: matchedRule.keyword,
                status: 'waiting_for_follow'
            });
            return;
        }
    }

    // 6. Send DM (build message first)
    const message = buildDMMessage(
        matchedRule.dmMessage,
        data.commenterUsername,
        matchedRule.link
    );

    // 7. Reply on comment first (rotate variants)
    if (matchedRule.commentReplies && matchedRule.commentReplies.length > 0) {
        const replyIndex = getNextReplyIndex(
            matchedRule.lastUsedReplyIndex,
            matchedRule.commentReplies.length
        );
        const replyText = matchedRule.commentReplies[replyIndex].text
            .replace('{{name}}', `@${data.commenterUsername}`);

        await replyToComment(data.accessToken, data.commentId, replyText);

        await AutoDMRule.findByIdAndUpdate(matchedRule._id, {
            lastUsedReplyIndex: replyIndex
        });
    }

    // 8. Send the DM
    const sent = await sendInstagramDM(
        data.accessToken,
        data.commenterIgId,
        message
    );

    // 9. Update stats
    await AutoDMRule.findByIdAndUpdate(matchedRule._id, {
        $inc: {
            totalTriggers: 1,
            totalDMsSent: sent ? 1 : 0,
            dmsSentToday: sent ? 1 : 0
        },
        lastTriggeredAt: new Date()
    });

    // 10. Log it
    await logAutoDM({ ...data, triggerType: 'comment', matchedKeyword: matchedRule.keyword, dmSent: sent, rule: matchedRule, message });

    // 11. Real-time dashboard notification
    await notifyCreatorDashboard(data.creatorId, {
        type: sent ? 'autodm_sent' : 'autodm_failed',
        username: data.commenterUsername,
        keyword: matchedRule.keyword,
        status: sent ? 'dm_sent' : 'failed'
    });
}

export async function processDMTrigger(data: any) {
    // Implement similar DM matching if needed later, right now focusing on comment
    console.log('processDMTrigger hit', data);
}

export async function processNewFollowerTrigger(data: any) {
    console.log('processNewFollowerTrigger hit', data);
}

export async function processStoryReplyTrigger(data: any) {
    console.log('processStoryReplyTrigger hit', data);
}


// ─── Helpers ─────────────────────────────────────────────────────────────────

async function logAutoDM(params: any) {
    await AutoDMLog.create({
        creatorId: params.creatorId,
        ruleId: params.rule?._id,
        triggerType: params.triggerType || 'comment',
        instagramUserId: params.commenterIgId,
        instagramUsername: params.commenterUsername,
        commentId: params.commentId,
        postId: params.postId,
        commentText: params.commentText,
        matchedKeyword: params.matchedKeyword || 'N/A',
        dmSent: params.dmSent,
        dmSentAt: params.dmSent ? new Date() : undefined,
        failureReason: params.failureReason,
        wasFollower: !params.followGateUsed, // approximation
        followGateUsed: !!params.rule?.followGate?.enabled,
        messagePreview: params.message?.substring(0, 50) || params.failureReason || 'Failed',
    });
}

function buildDMMessage(template: string, username: string, link?: string): string {
    return template
        .replace(/{{name}}/g, `@${username}`)
        .replace(/{{link}}/g, link || '')
        .replace(/{{keyword}}/g, '')
        .trim();
}

function getNextReplyIndex(lastIndex: number, total: number): number {
    if (total <= 1) return 0;
    // ensure next index loops around
    return (lastIndex + 1) % total;
}

export async function sendInstagramDM(
    accessToken: string,
    recipientIgId: string,
    message: string
): Promise<boolean> {
    const apiVersion = process.env.META_API_VERSION || 'v18.0';
    try {
        const res = await fetch(
            `https://graph.facebook.com/${apiVersion}/me/messages`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: { id: recipientIgId },
                    message: { text: message },
                    access_token: accessToken,
                })
            }
        );
        const data = await res.json();
        if (!res.ok) console.error('DM send error:', data);
        return res.ok;
    } catch {
        return false;
    }
}

async function replyToComment(
    accessToken: string,
    commentId: string,
    message: string
): Promise<boolean> {
    const apiVersion = process.env.META_API_VERSION || 'v18.0';
    try {
        const res = await fetch(
            `https://graph.facebook.com/${apiVersion}/${commentId}/replies`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    access_token: accessToken,
                })
            }
        );
        return res.ok;
    } catch {
        return false;
    }
}

export async function checkIsFollower(
    accessToken: string,
    creatorIgId: string,
    userIgId: string
): Promise<boolean> {
    const apiVersion = process.env.META_API_VERSION || 'v18.0';
    try {
        const res = await fetch(
            `https://graph.facebook.com/${apiVersion}/${creatorIgId}?fields=followers{id}&access_token=${accessToken}`
        );
        const data = await res.json();
        return data?.followers?.data?.some((f: { id: string }) => f.id === userIgId) ?? false;
    } catch {
        return false;
    }
}

async function notifyCreatorDashboard(creatorId: string, payload: object) {
    try {
        // const pusher = getPusherInstance();
        // await pusher.trigger(`creator-${creatorId}`, 'autodm-activity', payload);
        console.log(`Pusher Event -> creator-${creatorId}`, payload);
    } catch {
        // Non-critical
    }
}
