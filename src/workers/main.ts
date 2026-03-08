import 'dotenv/config';
import { mailWorker } from '@/lib/workers/mail';
import { createWhatsAppWorker, createInstagramWorker } from '@/lib/queue';
import { connectToDatabase } from '@/lib/db/mongodb';
import mongoose from 'mongoose';

async function startWorker() {
    await connectToDatabase();
    console.log('[Worker] Database connected (singleton)');

    const whatsappWorker = createWhatsAppWorker();
    const instagramWorker = createInstagramWorker();

    mailWorker.on('completed', (job) => {
        console.log(`[Email] Job ${job.id} completed`);
    });
    mailWorker.on('failed', (job, err) => {
        console.error(`[Email] Job ${job?.id} failed:`, err.message);
    });

    whatsappWorker.on('completed', (job) => console.log(`[WhatsApp] Job ${job.id} done`));
    instagramWorker.on('completed', (job) => console.log(`[Instagram] Job ${job.id} done`));

    console.log('[Worker] All BullMQ workers started via main.ts entry. Waiting for jobs...');

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('SIGTERM received, shutting down gracefully...');
        await mailWorker.close();
        await whatsappWorker.close();
        await instagramWorker.close();
        await mongoose.disconnect();
        process.exit(0);
    });
}

startWorker().catch(console.error);
