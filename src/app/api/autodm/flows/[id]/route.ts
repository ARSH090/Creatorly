import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AutoDMFlow } from '@/lib/models/AutoDMFlow';

// GET /api/autodm/flows/[id]
export const GET = withAuth(async (_req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
        await connectToDatabase();
        const flow = await AutoDMFlow.findOne({ _id: params.id, creatorId: user._id });
        if (!flow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ success: true, flow });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

// PATCH /api/autodm/flows/[id] — update flow (steps, trigger, isActive, name...)
export const PATCH = withAuth(async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
        await connectToDatabase();
        const data = await req.json();

        const flow = await AutoDMFlow.findOneAndUpdate(
            { _id: params.id, creatorId: user._id },
            { $set: data },
            { new: true }
        );
        if (!flow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ success: true, flow });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

// DELETE /api/autodm/flows/[id]
export const DELETE = withAuth(async (_req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
        await connectToDatabase();
        await AutoDMFlow.findOneAndDelete({ _id: params.id, creatorId: user._id });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
