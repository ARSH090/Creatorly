import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import ScheduledContent from '@/lib/models/ScheduledContent';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/withAuth';

const scheduleSchema = z.object({
    productId: z.string().min(1),
    title: z.string().min(5),
    description: z.string().min(10),
    scheduledAt: z.string().datetime(),
    social: z.object({
        twitter: z.boolean().optional(),
        instagram: z.boolean().optional(),
        facebook: z.boolean().optional(),
        tiktok: z.boolean().optional(),
    }).optional(),
    hashtags: z.array(z.string()).optional(),
    imageUrl: z.string().url().optional(),
});

/**
 * GET /api/creator/schedule
 * List scheduled content
 */
export const GET = withAuth(async (request, user) => {
    try {
        await connectToDatabase();

        const content = await ScheduledContent.find({ creatorId: user._id })
            .populate('productId', 'name')
            .sort({ scheduledAt: 1 });

        return NextResponse.json({ content });
    } catch (error) {
        console.error('Get scheduled content error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch scheduled content' },
            { status: 500 }
        );
    }
});

/**
 * POST /api/creator/schedule
 * Create scheduled content
 */
export const POST = withAuth(async (request, user) => {
    try {
        const body = await request.json();
        const validation = scheduleSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { errors: validation.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Check if scheduling time is in future
        const scheduledAt = new Date(validation.data.scheduledAt);
        if (scheduledAt <= new Date()) {
            return NextResponse.json(
                { error: 'Scheduled time must be in the future' },
                { status: 400 }
            );
        }

        const scheduled = await ScheduledContent.create({
            creatorId: user._id,
            productId: validation.data.productId,
            title: validation.data.title,
            description: validation.data.description,
            scheduledAt,
            social: validation.data.social || {},
            hashtags: validation.data.hashtags || [],
            imageUrl: validation.data.imageUrl,
        });

        return NextResponse.json(
            { scheduled },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create scheduled content error:', error);
        return NextResponse.json(
            { error: 'Failed to create scheduled content' },
            { status: 500 }
        );
    }
});


