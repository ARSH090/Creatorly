import { QueueJob, IQueueJob } from '@/lib/models/QueueJob';
import { MetaGraphService } from '@/lib/services/meta';
import { DMLog } from '@/lib/models/DMLog';
import { connectToDatabase } from '@/lib/db/mongodb';
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
        } else if (job.type === 'one_off_email') {
            await handleOneOffEmail(job);
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
    const {
        recipientId, text, accessToken, creatorId, ruleId,
        source, platform, messageType, carouselMessages,
        attachmentType, attachmentId, phoneNumberId,
        variables = {}
    } = job.payload;

    if (!recipientId) throw new Error('Invalid DM recipient');

    await connectToDatabase();
    const { User } = await import('@/lib/models/User');
    const { AutoReplyRule } = await import('@/lib/models/AutoReplyRule');
    const { Product } = await import('@/lib/models/Product');

    const creator = await User.findById(creatorId).lean();
    if (!creator) throw new Error('Creator not found');

    // 1. Subscription & Plan Limit Check
    const activeSub = await Subscription.findOne({
        userId: creatorId,
        status: { $in: ['active', 'trialing'] }
    }).populate('planId');

    let plan = activeSub?.planId as any;
    if (!plan) plan = await Plan.findOne({ tier: PlanTier.FREE });
    if (!plan) throw new Error('No plan configuration found.');

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usageCount = await DMLog.countDocuments({
        creatorId,
        createdAt: { $gte: startOfMonth },
        status: 'success'
    });

    if (usageCount >= plan.maxAutoDms) {
        throw new Error(`Plan limit reached: ${usageCount}/${plan.maxAutoDms} Auto DMs.`);
    }

    // 2. Variable Injection
    const injectVariables = (str: string | undefined) => {
        if (!str) return '';
        return str
            .replace(/{{first_name}}/g, variables.firstName || 'there')
            .replace(/{{creator_username}}/g, creator.username || '')
            .replace(/{{content_description}}/g, variables.contentDescription || '')
            .replace(/{{product_name}}/g, variables.productName || '')
            .replace(/{{custom_link}}/g, variables.customLink || '')
            .replace(/{{name}}/g, variables.firstName || 'there');
    };

    const finalMessage = injectVariables(text);

    // 3. Platform Specific Logic
    if (platform === 'whatsapp') {
        const { WhatsAppService } = await import('@/lib/services/whatsapp');
        const { decryptTokenGCM } = await import('@/lib/security/encryption');

        const waConfig = creator.whatsappConfig;
        let waToken = accessToken;
        let waPhoneId = phoneNumberId;

        if (!waToken && waConfig?.accessToken) {
            waToken = decryptTokenGCM(waConfig.accessToken, waConfig.accessTokenIV!, waConfig.accessTokenTag!);
        }
        if (!waPhoneId && waConfig?.phoneNumberId) {
            waPhoneId = decryptTokenGCM(waConfig.phoneNumberId, waConfig.phoneNumberIdIV!, waConfig.phoneNumberIdTag!);
        }

        if (!waToken || !waPhoneId) throw new Error('WhatsApp not configured');

        let waResult;
        if (messageType === 'template') {
            waResult = await WhatsAppService.sendTemplateMessage({
                to: recipientId,
                templateName: variables.templateName,
                languageCode: variables.languageCode || 'en',
                phoneNumberId: waPhoneId,
                accessToken: waToken
            });
        } else if (attachmentType && attachmentType !== 'none') {
            waResult = await WhatsAppService.sendMediaMessage({
                to: recipientId,
                type: (attachmentType === 'pdf' ? 'document' : 'image') as any,
                url: variables.attachmentUrl,
                caption: finalMessage,
                phoneNumberId: waPhoneId,
                accessToken: waToken
            });
        } else {
            waResult = await WhatsAppService.sendTextMessage({
                to: recipientId,
                text: finalMessage,
                phoneNumberId: waPhoneId,
                accessToken: waToken
            });
        }

        if (!waResult.success) throw new Error(waResult.error || 'WhatsApp delivery failed');
    } else {
        // Instagram Logic
        if (!accessToken) throw new Error('Missing Instagram Access Token');

        if (messageType === 'carousel' && carouselMessages && carouselMessages.length > 0) {
            for (const msg of carouselMessages) {
                // Handle delay
                if (msg.delaySeconds > 0) {
                    await new Promise(r => setTimeout(r, msg.delaySeconds * 1000));
                }
                await MetaGraphService.sendDirectMessage({
                    recipientId,
                    message: injectVariables(msg.text),
                    accessToken
                });
            }
        } else if (messageType === 'product' && attachmentId) {
            const product = await Product.findById(attachmentId).lean();
            if (product) {
                const productMsg = `${finalMessage}\n\nCheck out ${product.name}: ${process.env.NEXT_PUBLIC_APP_URL}/u/${creator.username}/p/${product.slug}`;
                await MetaGraphService.sendDirectMessage({
                    recipientId,
                    message: productMsg,
                    accessToken
                });
            }
        } else {
            await MetaGraphService.sendDirectMessage({
                recipientId,
                message: finalMessage,
                accessToken
            });
        }
    }

    // 4. Log Success & Update Stats
    await DMLog.create({
        creatorId,
        recipientId,
        ruleId,
        triggerSource: source || 'automation',
        status: 'success',
        messageSent: finalMessage,
        provider: platform || 'instagram',
        lastInteractionAt: new Date(),
        metadata: { jobId: job._id }
    });

    if (ruleId) {
        await AutoReplyRule.findByIdAndUpdate(ruleId, {
            $inc: { 'stats.totalSent': 1 },
            $set: { 'stats.lastFiredAt': new Date() }
        });
    }
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

async function handleOneOffEmail(job: IQueueJob) {
    const { email, subject, content, creatorId } = job.payload;
    const { sendEmail } = await import('@/lib/services/email');
    const { User } = await import('@/lib/models/User');

    if (!email || !subject || !content) {
        throw new Error('Invalid email payload for one-off email');
    }

    const creator = await User.findById(creatorId);
    const creatorName = creator?.displayName || creator?.username || 'Creatorly Creator';

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://creatorly.link';
    const unsubscribeUrl = `${appUrl}/api/marketing/unsubscribe?email=${encodeURIComponent(email)}&cid=${creatorId}`;

    const result = await sendEmail({
        to: email,
        subject: subject,
        html: content + `<br/><br/><hr/><small style="color: #666;">Sent by ${creatorName} via Creatorly. <a href="${unsubscribeUrl}">Unsubscribe</a></small>`
    });

    if (!result.success) {
        throw new Error(`Email delivery failed: ${result.error}`);
    }
}

