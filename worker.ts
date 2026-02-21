// worker.ts
import 'dotenv/config';
import { processQueueJob } from './src/lib/queue/processor';
import { QueueJob } from './src/lib/models/QueueJob';
import { connectToDatabase } from './src/lib/db/mongodb';

async function startWorker() {
    await connectToDatabase();
    console.log('Worker started. Polling for jobs...');

    setInterval(async () => {
        const now = new Date();
        const pendingJobs = await QueueJob.find({
            status: { $in: ['pending', 'failed'] },
            nextRunAt: { $lte: now },
            attempt: { $lt: 5 } // Max attempts from processor or here
        }).limit(10);

        for (const job of pendingJobs) {
            console.log(`Processing job ${job._id} (${job.type})`);
            await processQueueJob(job._id.toString());
        }
    }, 10000); // Check every 10 seconds
}

startWorker().catch(err => {
    console.error('Fatal worker error:', err);
    process.exit(1);
});
