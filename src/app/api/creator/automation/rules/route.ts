import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AutoReplyRule, AutomationTriggerType, MatchType } from '@/lib/models/AutoReplyRule';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import crypto from 'crypto';

/**
 * GET /api/creator/automation/rules
 */
async function getHandler(req: NextRequest, user: any) {
    await connectToDatabase();
    const rules = await AutoReplyRule.find({ creatorId: user._id }).sort({ priority: -1 });
    return { rules };
}

/**
 * POST /api/creator/automation/rules
 */
async function postHandler(req: NextRequest, user: any) {
    await connectToDatabase();
    const body = await req.json();
    const {
        trigger, keywords, response, isActive = true,
        followRequired = false, cooldownHours = 24,
        attachmentType = 'none', attachmentId
    } = body;

    // Map legacy trigger names to enum
    const triggerMap: Record<string, AutomationTriggerType> = {
        'keyword': AutomationTriggerType.DIRECT_MESSAGE,
        'dm': AutomationTriggerType.DIRECT_MESSAGE,
        'comment': AutomationTriggerType.COMMENT,
        'story_reply': AutomationTriggerType.STORY_REPLY,
        'new_follow': AutomationTriggerType.NEW_FOLLOW
    };

    const rule = await AutoReplyRule.create({
        ruleId: crypto.randomUUID(),
        creatorId: user._id,
        triggerType: triggerMap[trigger] || trigger,
        matchType: trigger === 'keyword' ? MatchType.CONTAINS : MatchType.EXACT,
        keywords: keywords || [],
        replyText: response,
        isActive,
        followRequired,
        cooldownHours,
        attachmentType,
        attachmentId,
        loopPreventionId: crypto.randomUUID().split('-')[0], // Simplified
        priority: 0
    });

    return { success: true, rule, message: 'Automation rule created' };
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
export const POST = withCreatorAuth(withErrorHandler(postHandler));
