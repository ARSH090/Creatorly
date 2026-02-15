import { NextResponse } from 'next/server';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AutoReplyRule } from '@/lib/models/AutoReplyRule';
import { z } from 'zod';
import { sanitizeHTML } from '@/utils/sanitizers';
import { successResponse, errorResponse } from '@/types/api';

const ruleSchema = z.object({
    triggerType: z.enum(['comment', 'dm']),
    matchType: z.enum(['exact', 'contains', 'regex']),
    keyword: z.string().min(1),
    replyText: z.string().min(1),
    isActive: z.boolean().optional().default(true),
    priority: z.number().optional().default(0)
});

/**
 * GET: Fetch all rules for the creator
 */
export const GET = withCreatorAuth(async (req, user) => {
    try {
        await connectToDatabase();
        const rules = await AutoReplyRule.find({ creatorId: user._id }).sort({ createdAt: -1 });
        return NextResponse.json(successResponse({ rules }));
    } catch (error: any) {
        return NextResponse.json(errorResponse('Failed to fetch rules', error.message), { status: 500 });
    }
});

/**
 * POST: Create a new automation rule
 */
export const POST = withCreatorAuth(async (req, user) => {
    try {
        const body = await req.json();
        const result = ruleSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                errorResponse('Validation failed', result.error.flatten().fieldErrors),
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Plan enforcement (Pseudo-logic as I don't see the Plan model usage here yet)
        // const plan = await Plan.findById(user.planId);
        // if (plan.limits.automations <= currentRulesCount) return 402;



        const ruleData = {
            ...result.data,
            replyText: sanitizeHTML(result.data.replyText),
            creatorId: user._id
        };

        const rule = await AutoReplyRule.create(ruleData);


        return NextResponse.json(
            successResponse({ rule }, 'Rule created successfully'),
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(errorResponse('Failed to create rule', error.message), { status: 500 });
    }
});
