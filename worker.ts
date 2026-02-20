// worker.ts
import 'dotenv/config';
import { createWhatsAppWorker } from './src/lib/queue';

console.log('Starting WhatsApp worker...');
const worker = createWhatsAppWorker();

worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});

console.log('Worker listening for jobs');
