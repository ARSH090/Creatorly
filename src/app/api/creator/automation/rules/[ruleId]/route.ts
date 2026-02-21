import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AutoReplyRule } from '@/lib/models/AutoReplyRule';
import { withCreatorAuth } from '@/lib/auth/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * PUT /api/creator/automation/rules/[ruleId]
 */
async function putHandler(req: NextRequest, user: any, params: any) {
    await connectToDatabase();
    const { ruleId } = await params;

    const body = await req.json();
    const {
        trigger, keywords, response, isActive,
        followRequired, cooldownHours, attachmentType, attachmentId
    } = body;

    const rule = await AutoReplyRule.findOne({ _id: ruleId, creatorId: user._id });
    if (!rule) throw new Error('Rule not found');

    if (trigger) rule.triggerType = trigger;
    if (keywords) rule.keywords = keywords;
    if (response) rule.replyText = response;
    if (isActive !== undefined) rule.isActive = isActive;
    if (followRequired !== undefined) rule.followRequired = followRequired;
    if (cooldownHours !== undefined) rule.cooldownHours = cooldownHours;
    if (attachmentType) rule.attachmentType = attachmentType;
    if (attachmentId !== undefined) rule.attachmentId = attachmentId;

    await rule.save();

    return { success: true, rule, message: 'Rule updated' };
}

/**
 * DELETE /api/creator/automation/rules/[ruleId]
 */
async function deleteHandler(req: NextRequest, user: any, params: any) {
    await connectToDatabase();
    const { ruleId } = await params;

    const result = await AutoReplyRule.deleteOne({ _id: ruleId, creatorId: user._id });
    if (result.deletedCount === 0) throw new Error('Rule not found');

    return { success: true, message: 'Rule deleted' };
}

export const PUT = withCreatorAuth(withErrorHandler(putHandler));
export const DELETE = withCreatorAuth(withErrorHandler(deleteHandler));
