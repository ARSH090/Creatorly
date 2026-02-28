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
 * PUT /api/creator/schedule/[id]
 * Update scheduled content
 */
export const PUT = withAuth(async (request: NextRequest, user: any, context: any) => {
    try {
        const { id } = context.params;

        const body = await request.json();
        const validation = scheduleSchema.partial().safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { errors: validation.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const scheduled = await ScheduledContent.findOneAndUpdate(
            { _id: id, creatorId: user._id, status: 'scheduled' },
            validation.data,
            { new: true }
        );

        if (!scheduled) {
            return NextResponse.json(
                { error: 'Content not found or already published' },
                { status: 404 }
            );
        }

        return NextResponse.json({ scheduled });
    } catch (error) {
        console.error('Update scheduled content error:', error);
        return NextResponse.json(
            { error: 'Failed to update scheduled content' },
            { status: 500 }
        );
    }
});

/**
 * DELETE /api/creator/schedule/[id]
 * Delete scheduled content
 */
export const DELETE = withAuth(async (request: NextRequest, user: any, context: any) => {
    try {
        const { id } = context.params;

        await connectToDatabase();

        const result = await ScheduledContent.findOneAndDelete({
            _id: id,
            creatorId: user._id,
            status: 'scheduled',
        });

        if (!result) {
            return NextResponse.json(
                { error: 'Content not found or already published' },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Delete scheduled content error:', error);
        return NextResponse.json(
            { error: 'Failed to delete scheduled content' },
            { status: 500 }
        );
    }
});
