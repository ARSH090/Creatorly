import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import AutomationWorkflow from '@/lib/models/AutomationWorkflow';
import { getMongoUser } from '@/lib/auth/get-user';

export const dynamic = 'force-dynamic';

// PUT /api/v1/automations/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const automation = await AutomationWorkflow.findOneAndUpdate(
            { _id: params.id, creatorId: user._id },
            { $set: body },
            { new: true }
        );

        if (!automation) return NextResponse.json({ error: 'Automation not found' }, { status: 404 });

        return NextResponse.json({ automation });
    } catch (error: any) {
        console.error('Error updating automation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/v1/automations/:id/activate
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { active } = body;

        const automation = await AutomationWorkflow.findOneAndUpdate(
            { _id: params.id, creatorId: user._id },
            { $set: { isActive: active } },
            { new: true }
        );

        if (!automation) return NextResponse.json({ error: 'Automation not found' }, { status: 404 });

        return NextResponse.json({ automation });
    } catch (error: any) {
        console.error('Error toggling automation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
