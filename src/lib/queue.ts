import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

export const whatsappQueue = new Queue('whatsapp', { connection: connection as any });
export const instagramQueue = new Queue('instagram-dm', { connection: connection as any });

export interface InstagramDMJobData {
    leadId: string;
    creatorId: string;
    recipientId: string;
    recipientUsername?: string;
    message: string;
    serviceOfferingId?: string;
    attemptCount?: number;
}

export interface WhatsAppJobData {
    leadId: string;
    name: string;
    phone: string;
    interest: string;
    message: string;
}

export const createWhatsAppWorker = () => {
    return new Worker(
        'whatsapp',
        async (job: Job<WhatsAppJobData>) => {
            const { name, phone, message } = job.data;
            console.log(`Processing WhatsApp job ${job.id} for ${name}`);
            console.log(`Would send to ${phone}: ${message}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { success: true };
        },
        { connection: connection as any }
    );
};

export const createInstagramWorker = () => {
    return new Worker<InstagramDMJobData>(
        'instagram-dm',
        async (job: Job<InstagramDMJobData>) => {
            const data = job.data;
            const { leadId, creatorId, recipientId, message, attemptCount = 1 } = data;
            console.log(`[InstagramWorker] Processing job ${job.id} for ${recipientId}`);

            try {
                const { InstagramService } = await import('@/lib/services/instagram');
                const { connectToDatabase } = await import('@/lib/db/mongodb');
                const Lead = (await import('@/lib/models/Lead')).default;
                const { DMLog } = await import('@/lib/models/DMLog');
                const { SocialAccount } = await import('@/lib/models/SocialAccount');

                await connectToDatabase();

                const socialAccount = await SocialAccount.findOne({
                    creatorId,
                    platform: 'instagram',
                    isActive: true,
                });

                if (!socialAccount) {
                    throw new Error('No active Instagram account');
                }

                const result = await InstagramService.sendDirectMessage({
                    recipientId,
                    message,
                    accessToken: socialAccount.pageAccessToken,
                    igUserId: socialAccount.instagramBusinessId,
                });

                if (result.success) {
                    await DMLog.create({
                        creatorId,
                        leadId,
                        provider: 'instagram',
                        recipientId,
                        triggerSource: 'lead_capture',
                        status: 'success',
                        messageSent: message,
                        lastInteractionAt: new Date(),
                        attemptCount,
                        deliveryStatus: 'sent',
                    });

                    await Lead.findByIdAndUpdate(leadId, {
                        dmStatus: 'sent',
                        dmProvider: 'instagram',
                        dmSentAt: new Date(),
                        dmMessageId: result.messageId,
                        dmRecipientId: recipientId,
                    });

                    return { success: true, messageId: result.messageId };
                } else {
                    const status = result.isRetryable ? 'pending' : 'failed';
                    await DMLog.create({
                        creatorId,
                        leadId,
                        provider: 'instagram',
                        recipientId,
                        triggerSource: 'lead_capture',
                        status,
                        messageSent: message,
                        lastInteractionAt: new Date(),
                        attemptCount,
                        errorCode: result.errorCode,
                        errorDetails: result.error,
                        deliveryStatus: 'failed',
                    });

                    await Lead.findByIdAndUpdate(leadId, {
                        dmStatus: status,
                        dmError: result.error,
                    });

                    if (!result.isRetryable) {
                        throw new Error(result.error);
                    }
                    throw new Error(result.error);
                }
            } catch (error: any) {
                console.error('[InstagramWorker] Job failed:', error);
                if (attemptCount >= 3) {
                    const Lead = (await import('@/lib/models/Lead')).default;
                    await Lead.findByIdAndUpdate(leadId, { dmStatus: 'failed', dmError: error.message });
                }
                throw error;
            }
        },
        { connection: connection as any }
    );
};
