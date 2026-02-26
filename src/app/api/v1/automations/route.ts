import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import AutomationWorkflow from '@/lib/models/AutomationWorkflow';
import { getMongoUser } from '@/lib/auth/get-user';

export const dynamic = 'force-dynamic';

// GET /api/v1/automations
export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const automations = await AutomationWorkflow.find({ creatorId: user._id })
            .sort({ createdAt: -1 });

        return NextResponse.json({ automations });
    } catch (error: any) {
        console.error('Error fetching automations:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/v1/automations
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { name, triggerType, triggerConfig, steps } = body;

        if (!name || !triggerType) {
            return NextResponse.json({ error: 'Name and triggerType are required' }, { status: 400 });
        }

        const automation = await AutomationWorkflow.create({
            creatorId: user._id,
            name,
            triggerType,
            triggerConfig: triggerConfig || {},
            steps: steps || [],
            isActive: false
        });

        return NextResponse.json({ automation }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating automation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
