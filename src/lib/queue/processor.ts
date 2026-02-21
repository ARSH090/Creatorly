import { QueueJob, IQueueJob } from '@/lib/models/QueueJob';
import { MetaGraphService } from '@/lib/services/meta';
import { DMLog } from '@/lib/models/DMLog';
import { connectToDatabase } from '@/lib/db/mongodb';
import { sendWhatsAppMessage } from '@/lib/services/whatsapp';
import { PlatformSettings } from '@/lib/models/PlatformSettings';
import { Subscription } from '@/lib/models/Subscription';
import { Plan } from '@/lib/models/Plan';
import { PlanTier } from '@/lib/models/plan.types';

/**
 * Process a single job with robust error handling and state management.
 */
export async function processQueueJob(jobId: string) {
    await connectToDatabase();

    const job = await QueueJob.findOneAndUpdate(
        { _id: jobId, status: { $in: ['pending', 'failed'] } },
        { status: 'processing', updatedAt: new Date() },
        { new: true }
    );

    if (!job) return { status: 'skipped' };

    // 1. Global Kill-switch Check
    const settings = await PlatformSettings.findOne();
    if (settings?.featureToggles?.automationEnabled === false && job.type === 'dm_delivery') {
        job.status = 'failed';
        job.error = 'Automations are globally disabled by platform administrator.';
        await job.save();
        return { status: 'globally_disabled', jobId };
    }

    try {
        if (job.type === 'dm_delivery') {
            await handleDMDelivery(job);
        } else if (job.type === 'email_sequence_step') {
            await handleEmailSequenceStep(job);
        } else if (job.type === 'email_broadcast') {
            await handleEmailBroadcast(job);
        } else if (job.type === 'booking_cleanup') {
            await handleBookingCleanup(job);
        }

        job.status = 'completed';
        await job.save();
        return { status: 'success', jobId };

    } catch (error: any) {
        console.error(`[Queue] Job ${jobId} failed:`, error.message);

        job.attempt += 1;
        job.error = error.message;

        if (job.attempt < job.maxAttempts) {
            // Exponential backoff: 30s, 2m, 8m, 32m...
            const delay = Math.pow(4, job.attempt) * 1000 * 30;
            job.status = 'pending';
            job.nextRunAt = new Date(Date.now() + delay);
        } else {
            job.status = 'failed';
        }

        await job.save();
        return { status: 'error', error: error.message };
    }
}

async function handleDMDelivery(job: IQueueJob) {
    const { recipientId, text, accessToken, creatorId, ruleId, source, platform } = job.payload;
    if (!recipientId || !text) throw new Error('Invalid DM payload');

    // 1. Subscription & Plan Limit Check
    const activeSub = await Subscription.findOne({
        userId: creatorId,
        status: { $in: ['active', 'trialing'] }
    }).populate('planId');

    let plan = activeSub?.planId as any;

    // Fallback to Free Plan if no active sub
    if (!plan) {
        plan = await Plan.findOne({ tier: PlanTier.FREE });
    }

    if (!plan) {
        throw new Error('Critical: No plan configuration found for usage check.');
    }

    // Count usage for the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usageCount = await DMLog.countDocuments({
        creatorId,
        createdAt: { $gte: startOfMonth }
    });

    if (usageCount >= plan.maxAutoDms) {
        throw new Error(`Plan limit reached: ${usageCount}/${plan.maxAutoDms} Auto DMs sent this month.`);
    }

    // 2. Variable Injection
    let processedText = text;
    // Basic replacement for now. In production, fetch Lead name if available.
    processedText = processedText.replace(/{{name}}/g, 'there');

    if (platform === 'whatsapp') {
        const waResult = await sendWhatsAppMessage({
            phone: recipientId,
            message: processedText
        });
        if (!waResult.success) {
            throw new Error(waResult.error || 'WhatsApp delivery failed');
        }
    } else {
        // Default to Instagram
        if (!accessToken) throw new Error('Missing Instagram Access Token');
        await MetaGraphService.sendDirectMessage({
            recipientId,
            message: processedText,
            accessToken
        });
    }

    await DMLog.create({
        creatorId,
        recipientId,
        ruleId,
        triggerSource: source || 'automation',
        status: 'success',
        messageSent: processedText,
        provider: platform || 'instagram',
        lastInteractionAt: new Date(),
        metadata: { jobId: job._id, attempt: job.attempt + 1 }
    });
}

async function handleEmailSequenceStep(job: IQueueJob) {
    const { sequenceId, enrollmentId, email, subject, content, stepIndex } = (job as any).payload;
    const { sendEmail } = await import('@/lib/services/email');
    const { default: EmailSequence } = await import('@/lib/models/EmailSequence');
    const { default: SequenceEnrollment } = await import('@/lib/models/SequenceEnrollment');
    const { default: Lead } = await import('@/lib/models/Lead');

    const sequence = await EmailSequence.findById(sequenceId);
    if (!sequence) return;

    // 1. Variable Interpolation
    let interpolatedContent = content;
    let interpolatedSubject = subject;

    const lead = await Lead.findOne({ email, creatorId: sequence.creatorId });
    const name = lead?.name || 'there';

    interpolatedContent = interpolatedContent.replace(/{{name}}/g, name);
    interpolatedSubject = interpolatedSubject.replace(/{{name}}/g, name);

    // 2. Add Unsubscribe Link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://creatorly.in';
    const unsubscribeUrl = `${appUrl}/api/marketing/unsubscribe?email=${encodeURIComponent(email)}&cid=${sequence.creatorId.toString()}`;

    // 3. Send the email via Resend
    const emailResult = await sendEmail({
        to: email,
        subject: interpolatedSubject,
        html: interpolatedContent + `<br/><br/><small style="color: #666;">Don't want these emails? <a href="${unsubscribeUrl}">Unsubscribe</a></small>`
    });

    if (!emailResult.success) {
        throw new Error(`Email delivery failed: ${emailResult.error}`);
    }

    // 4. Schedule next step if it exists
    const nextStepIndex = stepIndex + 1;
    const nextStep = sequence.steps.find((s: any) => s.sequenceOrder === nextStepIndex);

    if (nextStep) {
        // Calculate delay
        const nextRunAt = new Date(Date.now() + (nextStep.delayHours || 0) * 60 * 60 * 1000);

        // Update enrollment
        await SequenceEnrollment.findByIdAndUpdate(enrollmentId, {
            currentStep: nextStepIndex,
            nextStepDueAt: nextRunAt
        });

        // Create next queue job
        await QueueJob.create({
            type: 'email_sequence_step',
            payload: {
                sequenceId,
                enrollmentId,
                email,
                subject: nextStep.subject,
                content: nextStep.content,
                stepIndex: nextStepIndex
            },
            nextRunAt,
            status: 'pending'
        });
    } else {
        // Sequence completed
        await SequenceEnrollment.findByIdAndUpdate(enrollmentId, {
            status: 'completed'
        });

        await EmailSequence.findByIdAndUpdate(sequenceId, {
            $inc: { 'stats.completed': 1 }
        });
    }
}

async function handleBookingCleanup(job: IQueueJob) {
    const { Booking } = await import('@/lib/models/Booking');

    // Delete pending bookings older than 40 minutes (extra 10 min buffer)
    const cleanupThreshold = new Date(Date.now() - 40 * 60000);

    const result = await Booking.deleteMany({
        status: 'pending',
        createdAt: { $lt: cleanupThreshold }
    });

    console.log(`[Queue] Booking Cleanup: Removed ${result.deletedCount} stale bookings`);

    // Re-enqueue the cleanup job for 1 hour later to keep it recurring
    await QueueJob.create({
        type: 'booking_cleanup',
        payload: {},
        status: 'pending',
        nextRunAt: new Date(Date.now() + 60 * 60000) // 1 hour from now
    });
}

async function handleEmailBroadcast(job: IQueueJob) {
    const { campaignId } = (job as any).payload;
    const { sendMarketingEmail } = await import('@/lib/services/email');
    const { default: EmailCampaign } = await import('@/lib/models/EmailCampaign');
    const { default: User } = await import('@/lib/models/User');

    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    const creator = await User.findById(campaign.creatorId);
    const creatorName = creator?.displayName || creator?.username || 'Creator';

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://creatorly.in';

    let successCount = 0;
    let failCount = 0;

    // Process recipients
    for (const recipientEmail of campaign.recipients) {
        try {
            const unsubscribeUrl = `${appUrl}/api/marketing/unsubscribe?email=${encodeURIComponent(recipientEmail)}&cid=${campaign.creatorId.toString()}`;

            // Basic interpolation for broadcast too
            const content = campaign.content.replace(/{{name}}/g, 'there');

            await sendMarketingEmail(
                recipientEmail,
                campaign.subject,
                content,
                creatorName,
                unsubscribeUrl
            );
            successCount++;
        } catch (err) {
            console.error(`Failed to send broadcast to ${recipientEmail}:`, err);
            failCount++;
        }
    }

    campaign.status = 'sent';
    campaign.sentAt = new Date();
    campaign.stats.sent = successCount;
    await campaign.save();
}

