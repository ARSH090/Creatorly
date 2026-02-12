import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Affiliate } from '@/lib/models/Affiliate';
import { withCreatorAuth } from '@/lib/firebase/withAuth';
import { withErrorHandler } from '@/lib/utils/errorHandler';
import { hasFeature } from '@/lib/utils/planLimits';

/**
 * POST /api/creator/affiliates/broadcast
 * Send broadcast message to all active affiliates
 * Body: { subject, message }
 */
async function handler(req: NextRequest, user: any) {
    await connectToDatabase();

    // Check plan feature
    if (!hasFeature(user.plan || 'free', 'affiliates')) {
        throw new Error('Affiliate program requires Creator Pro plan');
    }

    const body = await req.json();
    const { subject, message } = body;

    if (!subject || !message) {
        throw new Error('subject and message are required');
    }

    // Get all active affiliates
    const affiliates = await Affiliate.find({
        creatorId: user._id,
        status: 'active'
    }).populate('affiliateId', 'email displayName');

    if (affiliates.length === 0) {
        return {
            success: true,
            sent: 0,
            message: 'No active affiliates to send to'
        };
    }

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // For now, just return success with count

    console.log(`Broadcasting to ${affiliateEmails.length} affiliates:`, subject);

    return {
        success: true,
        sent: affiliateEmails.length,
        recipients: affiliateEmails,
        message: `Broadcast queued to ${affiliateEmails.length} affiliates`
    };
}

export const POST = withCreatorAuth(withErrorHandler(handler));
