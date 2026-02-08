import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import ScheduledContent from '@/lib/models/ScheduledContent';
import { z } from 'zod';

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
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectToDatabase();

        const content = await ScheduledContent.find({ creatorId: session.user.id })
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
}

/**
 * POST /api/creator/schedule
 * Create scheduled content
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

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
            creatorId: session.user.id,
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
}

/**
 * PUT /api/creator/schedule/{id}
 * Update scheduled content
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const pathname = request.nextUrl.pathname;
        const id = pathname.split('/').pop();

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
            { _id: id, creatorId: session.user.id, status: 'scheduled' },
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
}

/**
 * DELETE /api/creator/schedule/{id}
 * Delete scheduled content
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const pathname = request.nextUrl.pathname;
        const id = pathname.split('/').pop();

        await connectToDatabase();

        const result = await ScheduledContent.findOneAndDelete({
            _id: id,
            creatorId: session.user.id,
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
}
