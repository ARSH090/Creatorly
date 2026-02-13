import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import AutomationRule from '@/lib/models/AutomationRule';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * PUT /api/creator/automation/rules/[ruleId]
 * Update an automation rule
 */
async function putHandler(req: NextRequest, user: any, params: any) {
    await connectToDatabase();
    // Await params in Next.js 15
    const { ruleId } = await params;

    const body = await req.json();
    const { platform, trigger, keywords, action, response, productId, isActive } = body;

    const rule = await AutomationRule.findOne({ _id: ruleId, creatorId: user._id });
    if (!rule) throw new Error('Rule not found');

    if (platform) rule.platform = platform;
    if (trigger) rule.trigger = trigger;
    if (keywords) rule.keywords = keywords;
    if (action) rule.action = action;
    if (response) rule.response = response;
    if (productId !== undefined) rule.productId = productId;
    if (isActive !== undefined) rule.isActive = isActive;

    await rule.save();

    return { success: true, rule, message: 'Rule updated successfully' };
}

/**
 * DELETE /api/creator/automation/rules/[ruleId]
 * Delete an automation rule
 */
async function deleteHandler(req: NextRequest, user: any, params: any) {
    await connectToDatabase();
    const { ruleId } = await params;

    const result = await AutomationRule.deleteOne({ _id: ruleId, creatorId: user._id });
    if (result.deletedCount === 0) throw new Error('Rule not found');

    return { success: true, message: 'Rule deleted successfully' };
}

export const PUT = withCreatorAuth(withErrorHandler(putHandler));
export const DELETE = withCreatorAuth(withErrorHandler(deleteHandler));
