
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import DashboardWidget, { getDefaultWidgets } from '@/lib/models/DashboardWidget';
import { getMongoUser } from '@/lib/auth/get-user';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        let widgets = await DashboardWidget.find({ creatorId: user._id }).sort('positionOrder').lean();

        if (widgets.length === 0) {
            // Initialize defaults
            const defaults = getDefaultWidgets(user._id);
            await DashboardWidget.insertMany(defaults);
            widgets = await DashboardWidget.find({ creatorId: user._id }).sort('positionOrder').lean();
        }

        return NextResponse.json({ widgets });

    } catch (error: any) {
        console.error('Error fetching widgets:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await connectToDatabase();
        const user = await getMongoUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { widgets } = body;

        if (!Array.isArray(widgets)) {
            return NextResponse.json({ error: 'Invalid widgets array' }, { status: 400 });
        }

        // Bulk update
        const updates = widgets.map((w: any) => ({
            updateOne: {
                filter: { _id: w._id || w.widgetId, creatorId: user._id }, // Using ID from client (might be _id or widgetId)
                // Better to use _id if available, or widgetId. 
                // Let's assume client sends _id.
                update: {
                    $set: {
                        positionOrder: w.positionOrder,
                        visibilitySettings: w.visibilitySettings,
                        updatedAt: new Date()
                    }
                }
            }
        }));

        if (updates.length > 0) {
            await DashboardWidget.bulkWrite(updates);
        }

        const updatedWidgets = await DashboardWidget.find({ creatorId: user._id }).sort('positionOrder').lean();

        return NextResponse.json({ success: true, updatedWidgets });

    } catch (error: any) {
        console.error('Error updating widgets:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
