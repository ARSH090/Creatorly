import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

// Queue for WhatsApp messages
export const whatsappQueue = new Queue('whatsapp', {
    connection: connection as any
});

// Worker (to be started in a separate process)
export const createWhatsAppWorker = () => {
    return new Worker(
        'whatsapp',
        async (job: Job) => {
            const { leadId, name, phone, interest, message } = job.data;
            console.log(`Processing WhatsApp job ${job.id} for ${name}`);

            // Placeholder for actual sending logic:
            // - WhatsApp Business API
            // - Selenium automation
            // - Twilio WhatsApp
            // For now, just log
            console.log(`Would send to ${phone}: ${message}`);

            // Simulate sending delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            return { success: true };
        },
        { connection: connection as any }
    );
};
