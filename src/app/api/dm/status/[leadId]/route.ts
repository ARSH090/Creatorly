import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Lead from '@/lib/models/Lead';
import { DMLog } from '@/lib/models/DMLog';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ leadId: string }> }
) {
    try {
        // Authenticate user
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { leadId } = await params;

        if (!leadId) {
            return NextResponse.json(
                { success: false, message: 'leadId is required' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectToDatabase();

        // Fetch lead
        const lead = await Lead.findById(leadId);
        if (!lead) {
            return NextResponse.json(
                { success: false, message: 'Lead not found' },
                { status: 404 }
            );
        }

        // Fetch recent DM logs for this lead
        const dmLogs = await DMLog.find({ leadId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Build response
        const response = {
            success: true,
            data: {
                leadId: lead._id,
                dmStatus: lead.dmStatus || null,
                dmProvider: lead.dmProvider || null,
                dmSentAt: lead.dmSentAt || null,
                dmError: lead.dmError || null,
                recentLogs: dmLogs.map(log => ({
                    id: log._id,
                    provider: log.provider,
                    status: log.status,
                    messageSent: log.messageSent,
                    createdAt: log.createdAt,
                    errorDetails: log.errorDetails,
                })),
            }
        };

        return NextResponse.json(response, { status: 200 });

    } catch (error: any) {
        console.error('[DM Status API] Error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
