import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Lead from '@/lib/models/Lead';
import { DMLog } from '@/lib/models/DMLog';
import { instagramQueue } from '@/lib/queue';
import { InstagramService } from '@/lib/services/instagram';

export async function POST(
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

        // Check if there's a previous attempt
        const lastLog = await DMLog.findOne({ leadId })
            .sort({ createdAt: -1 });

        if (!lastLog) {
            return NextResponse.json(
                { success: false, message: 'No previous DM attempt found' },
                { status: 400 }
            );
        }

        // Check if already sent successfully
        if (lead.dmStatus === 'sent') {
            return NextResponse.json(
                { success: false, message: 'DM already sent successfully' },
                { status: 400 }
            );
        }

        // Build message
        const dmMessage = InstagramService.buildMessage(
            lead.name || 'there',
            lead.interest || 'our service'
        );

        // Re-enqueue the job
        const jobData = {
            leadId: leadId.toString(),
            creatorId: userId,
            recipientId: lead.phone || '',
            message: dmMessage,
            attemptCount: (lastLog.attemptCount || 1) + 1,
        };

        const job = await instagramQueue.add('send-instagram-dm', jobData, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        });

        // Update lead status
        await Lead.findByIdAndUpdate(leadId, {
            dmStatus: 'pending',
        });

        return NextResponse.json({
            success: true,
            message: 'DM retry queued successfully',
            data: {
                jobId: job.id,
                status: 'queued',
            }
        }, { status: 202 });

    } catch (error: any) {
        console.error('[DM Retry API] Error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
