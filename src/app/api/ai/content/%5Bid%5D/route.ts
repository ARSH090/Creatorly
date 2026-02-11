import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Content } from '@/lib/models/Content';
import { withAuth } from '@/lib/firebase/withAuth';
import mongoose from 'mongoose';

/**
 * Handle individual content updates (Auto-save / Edit)
 */
async function handler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const body = await req.json();
        const sessionUser = (req as any).user;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid content ID' }, { status: 400 });
        }

        const content = await Content.findById(id);

        if (!content) {
            return NextResponse.json({ error: 'Content not found' }, { status: 404 });
        }

        // Authorization check: Owner or member of the team
        const isOwner = content.creatorId.toString() === sessionUser._id.toString();
        // In a real team implementation, we'd check Membership here too.
        // For now, owner check:
        if (!isOwner) {
            return NextResponse.json({ error: 'Unauthorized to edit this content' }, { status: 403 });
        }

        // If body is changing, push to version history
        if (body.body && body.body !== content.body) {
            content.versionHistory.push({
                body: content.body,
                updatedBy: sessionUser._id,
                updatedAt: new Date()
            });
            content.body = body.body;
        }

        if (body.title) content.title = body.title;
        if (body.status) content.status = body.status;
        if (body.metadata) content.metadata = { ...content.metadata, ...body.metadata };

        await content.save();

        return NextResponse.json(content);

    } catch (error: any) {
        console.error('[Content Update] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * GET individual content
 */
async function getHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const sessionUser = (req as any).user;

        const content = await Content.findById(id);
        if (!content) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (content.creatorId.toString() !== sessionUser._id.toString()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json(content);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const PATCH = withAuth(handler);
export const GET = withAuth(getHandler);
