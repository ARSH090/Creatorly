import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { GeminiClient } from '@/lib/ai/gemini';
import { Content } from '@/lib/models/Content';
import { withAuth } from '@/lib/firebase/withAuth';
import { z } from 'zod';

const generateSchema = z.object({
    topic: z.string().min(3),
    type: z.enum(['blog', 'twitter', 'instagram', 'email', 'other']),
    tone: z.string().optional(),
    audience: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    teamId: z.string().optional(),
});

async function handler(req: NextRequest, user: any) {
    try {
        await connectToDatabase();
        const body = await req.json();

        const validation = generateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.format() }, { status: 400 });
        }

        const brief = validation.data;

        // 1. Check AI Credits / Limits based on Plan
        const role = user.role || 'user';
        const limits: Record<string, number> = {
            'user': 5,
            'creator': 100,
            'admin': 1000,
            'super-admin': Infinity
        };

        const maxGens = user.planLimits?.maxAiGenerations || limits[role];
        if (user.aiUsageCount >= maxGens) {
            return NextResponse.json({
                error: `Monthly AI limit reached (${maxGens}). Please upgrade your plan for more.`
            }, { status: 403 });
        }

        // 2. Select Model & Generate Content
        const highQuality = ['creator', 'admin'].includes(role);
        const { generateContent } = await import('@/lib/ai/intelligence');
        const generatedText = await generateContent(brief.type, brief.topic, {
            ...brief,
            highQuality
        });



        // 3. Extract title and body (Basic parsing - can be improved)
        const lines = generatedText.split('\n');
        const title = lines[0].replace(/Title: /i, '').replace(/\*/g, '').trim() || `Generated ${brief.type}`;
        const contentBody = generatedText.split('\n').slice(1).join('\n').trim();

        // 4. Save to Content Library
        const content = await Content.create({
            title,
            body: contentBody,
            type: brief.type,
            creatorId: user._id,
            teamId: brief.teamId,
            metadata: {
                keywords: brief.keywords,
                tone: brief.tone,
                targetAudience: brief.audience,
                wordCount: contentBody.split(/\s+/).length
            },
            status: 'draft'
        });

        // 5. Update user usage
        const User = (await import('@/lib/models/User')).default;
        await User.findByIdAndUpdate(user._id, { $inc: { aiUsageCount: 1 } });

        // 6. Trigger Usage Notification Check (Async)
        const { BillingService } = await import('@/lib/services/billing');
        BillingService.checkAndNotifyUsage(user._id.toString()).catch(console.error);

        return NextResponse.json(content);

    } catch (error: any) {
        console.error('[AI Generate] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const POST = withAuth(handler);
