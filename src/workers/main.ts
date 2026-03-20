import 'dotenv/config';
import { connectToDatabase } from '@/lib/db/mongodb';
import { mailQueue, whatsappQueue, instagramQueue } from '@/lib/queue';
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import mongoose from 'mongoose';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

async function startWorker() {
    await connectToDatabase();
    console.log('[Worker] MongoDB connected');

    // ── Mail Worker ──────────────────────────────────────────────────────────
    const mailWorker = new Worker('mail', async (job: Job) => {
        const { to, subject, html, text } = job.data;
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: process.env.FROM_EMAIL || 'noreply@creatorly.in',
            to,
            subject,
            html,
            text,
        });
        console.log(`[Mail] Sent to ${to}: ${subject}`);
    }, {
        connection,
        concurrency: 10,
        limiter: { max: 50, duration: 1000 }, // 50 emails/sec max
    });

    // ── Instagram DM Worker ──────────────────────────────────────────────────
    const instagramWorker = new Worker('instagram-dm', async (job: Job) => {
        const { recipientId, text, accessToken, creatorId, leadId } = job.data;
        const { InstagramService } = await import('@/lib/services/instagram');
        const { connectToDatabase: dbConnect } = await import('@/lib/db/mongodb');
        const Lead = (await import('@/lib/models/Lead')).default;
        const { DMLog } = await import('@/lib/models/DMLog');

        await dbConnect();
        await InstagramService.sendDirectMessage({
            accessToken,
            recipientId,
            message: text,
            igUserId: job.data.igUserId || '', // Add igUserId if available in job data
        });

        if (leadId) {
            await Lead.findByIdAndUpdate(leadId, { dmStatus: 'sent', dmSentAt: new Date() });
            await DMLog.create({
                creatorId,
                recipientIgId: recipientId,
                message: text,
                status: 'sent',
                platform: 'instagram',
                sentAt: new Date(),
            });
        }
        console.log(`[Instagram] DM sent to ${recipientId}`);
    }, {
        connection,
        concurrency: 5,
        limiter: { max: 10, duration: 1000 }, // Instagram rate limit
    });

    // ── WhatsApp Worker ──────────────────────────────────────────────────────
    const whatsappWorker = new Worker('whatsapp', async (job: Job) => {
        const { phone, message, leadId, creatorId } = job.data;
        // WhatsApp Cloud API send
        const waToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        if (!waToken || !waPhoneId) throw new Error('WhatsApp credentials not configured');

        const resp = await fetch(`https://graph.facebook.com/v18.0/${waPhoneId}/messages`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: phone,
                type: 'text',
                text: { body: message },
            }),
        });
        if (!resp.ok) throw new Error(`WhatsApp send failed: ${await resp.text()}`);
        console.log(`[WhatsApp] Message sent to ${phone}`);
    }, { connection, concurrency: 3 });

    // ── Event listeners ──────────────────────────────────────────────────────
    for (const [name, worker] of [['mail', mailWorker], ['instagram', instagramWorker], ['whatsapp', whatsappWorker]] as const) {
        worker.on('completed', (job) => console.log(`[${name}] Job ${job.id} done`));
        worker.on('failed', (job, err) => console.error(`[${name}] Job ${job?.id} failed:`, err.message));
        worker.on('error', (err) => console.error(`[${name}] Worker error:`, err));
    }

    console.log('[Worker] All workers running. Waiting for jobs...');

    // ── Graceful shutdown ────────────────────────────────────────────────────
    const shutdown = async () => {
        console.log('Shutting down gracefully...');
        await Promise.all([mailWorker.close(), instagramWorker.close(), whatsappWorker.close()]);
        await mongoose.disconnect();
        process.exit(0);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

startWorker().catch((err) => {
    console.error('Worker startup failed:', err);
    process.exit(1);
});
