import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AutomationRule } from '@/lib/models/AutomationRule';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';

/**
 * GET /api/creator/automation/rules
 * List all automation rules for the creator
 */
async function getHandler(req: NextRequest, user: any) {
    await connectToDatabase();

    const rules = await AutomationRule.find({ creatorId: user._id })
        .sort({ createdAt: -1 });

    return { rules };
}

/**
 * POST /api/creator/automation/rules
 * Create new automation rule
 * Body: { name, trigger, actions, isActive, conditions? }
 */
async function postHandler(req: NextRequest, user: any) {
    await connectToDatabase();

    const body = await req.json();
    const { name, trigger, actions, isActive = true, conditions } = body;

    if (!name || !trigger || !actions) {
        throw new Error('name, trigger, and actions are required');
    }

    const rule = await AutomationRule.create({
        creatorId: user._id,
        name,
        trigger,
        actions,
        conditions,
        isActive,
        executionCount: 0
    });

    return {
        success: true,
        rule,
        message: 'Automation rule created successfully'
    };
}

export const GET = withCreatorAuth(withErrorHandler(getHandler));
export const POST = withCreatorAuth(withErrorHandler(postHandler));
