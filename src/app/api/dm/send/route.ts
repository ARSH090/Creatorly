import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Lead from '@/lib/models/Lead';
import { instagramQueue, whatsappQueue } from '@/lib/queue';
import { InstagramService } from '@/lib/services/instagram';
import { WhatsAppService } from '@/lib/services/whatsapp';

interface DMSendRequest {
    leadId: string;
    provider: 'instagram' | 'whatsapp';
    message?: string;
}

export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const body: DMSendRequest = await request.json();
        const { leadId, provider, message } = body;

        if (!leadId || !provider) {
            return NextResponse.json(
                { success: false, message: 'leadId and provider are required' },
                { status: 400 }
            );
        }

        // Validate provider
        if (!['instagram', 'whatsapp'].includes(provider)) {
            return NextResponse.json(
                { success: false, message: 'Invalid provider. Use "instagram" or "whatsapp"' },
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

        // Build message if not provided
        const dmMessage = message || InstagramService.buildMessage(
            lead.name || 'there',
            lead.interest || 'our service'
        );

        // Handle based on provider
        if (provider === 'whatsapp') {
            // WhatsApp placeholder - return coming soon
            const deepLink = WhatsAppService.generateDeepLink(
                lead.phone || '',
                dmMessage
            );

            // Log as coming soon
            // For now, just return the placeholder response
            return NextResponse.json({
                success: true,
                message: 'WhatsApp DM feature coming soon',
                data: {
                    status: 'coming_soon',
                    provider: 'whatsapp',
                    deepLink,
                }
            }, { status: 501 });
        }

        // Handle Instagram DM
        // Check if user has Instagram account connected (we'd check SocialAccount here)
        // For now, we'll assume the creator has it set up

        // Build job data
        const jobData = {
            leadId: leadId.toString(),
            creatorId: userId, // This should be the creator's ID
            recipientId: lead.phone || '', // Instagram user ID or phone
            message: dmMessage,
            attemptCount: 1,
        };

        // Add to Instagram queue
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
            dmProvider: 'instagram',
        });

        return NextResponse.json({
            success: true,
            message: 'DM queued successfully',
            data: {
                jobId: job.id,
                status: 'queued',
                provider: 'instagram',
            }
        }, { status: 202 });

    } catch (error: any) {
        console.error('[DM Send API] Error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
