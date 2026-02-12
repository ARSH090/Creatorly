import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AutomationRule } from '@/lib/models/AutomationRule';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * PUT /api/creator/automation/rules/:id
 * Update automation rule
 */
async function putHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const ruleId = params.id;

    const body = await req.json();
    const { name, trigger, actions, isActive, conditions } = body;

    const updates: any = {};
    if (name) updates.name = name;
    if (trigger) updates.trigger = trigger;
    if (actions) updates.actions = actions;
    if (isActive !== undefined) updates.isActive = isActive;
    if (conditions) updates.conditions = conditions;

    const rule = await AutomationRule.findOneAndUpdate(
        { _id: ruleId, creatorId: user._id },
        { $set: updates },
        { new: true }
    );

    if (!rule) {
        throw new Error('Automation rule not found');
    }

    return {
        success: true,
        rule,
        message: 'Automation rule updated successfully'
    };
}

/**
 * DELETE /api/creator/automation/rules/:id
 * Delete automation rule
 */
async function deleteHandler(req: NextRequest, user: any, context: any) {
    await connectToDatabase();

    const params = await context.params;
    const ruleId = params.id;

    const rule = await AutomationRule.findOneAndDelete({
        _id: ruleId,
        creatorId: user._id
    });

    if (!rule) {
        throw new Error('Automation rule not found');
    }

    return {
        success: true,
        message: 'Automation rule deleted successfully'
    };
}

export const PUT = withCreatorAuth(withErrorHandler(putHandler));
export const DELETE = withCreatorAuth(withErrorHandler(deleteHandler));
