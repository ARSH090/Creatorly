import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AutoDMFlow } from '@/lib/models/AutoDMFlow';

// GET /api/autodm/flows — list all flows for the creator
export const GET = withAuth(async (_req: NextRequest, user: any) => {
    try {
        await connectToDatabase();
        const flows = await AutoDMFlow.find({ creatorId: user._id }).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, flows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

// POST /api/autodm/flows — create a new flow
export const POST = withAuth(async (req: NextRequest, user: any) => {
    try {
        await connectToDatabase();
        const data = await req.json();

        const flow = await AutoDMFlow.create({
            ...data,
            creatorId: user._id,
            isActive: false,
        });

        return NextResponse.json({ success: true, flow }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
