import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { sendEmail } from '@/lib/services/email';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

export const mailWorker = new Worker(
    'mail',
    async (job: Job) => {
        const { to, subject, html } = job.data;
        console.log(`[MailWorker] Processing job ${job.id} for ${to}`);

        try {
            const result = await sendEmail({ to, subject, html });
            if (!result.success) {
                throw new Error(typeof result.error === 'string' ? result.error : 'Email failed');
            }
            return { success: true };
        } catch (error: any) {
            console.error(`[MailWorker] Job ${job.id} failed:`, error.message);
            throw error;
        }
    },
    { connection: connection as any, concurrency: 5 }
);
