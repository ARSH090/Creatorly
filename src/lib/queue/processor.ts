import { QueueJob, IQueueJob } from '@/lib/models/QueueJob';
import { MetaGraphService } from '@/lib/services/meta';
import { DMLog } from '@/lib/models/DMLog';
import { connectToDatabase } from '@/lib/db/mongodb';

/**
 * Process a single job with robust error handling and state management.
 * Designed to be called by a worker or cron job.
 */
export async function processQueueJob(jobId: string) {
    await connectToDatabase();

    // 1. Lock and fetch job (Atomic operation)
    const job = await QueueJob.findOneAndUpdate(
        { _id: jobId, status: 'pending' },
        { status: 'processing', updatedAt: new Date() },
        { new: true }
    );

    if (!job) {
        return { status: 'skipped', reason: 'Job not found or already processing' };
    }

    try {
        // 2. Execute Job Logic based on type
        if (job.type === 'dm_delivery') {
            await handleDMDelivery(job);
        }

        // 3. Mark Completed
        job.status = 'completed';
        job.updatedAt = new Date();
        await job.save();

        return { status: 'success', jobId: job._id };

    } catch (error: any) {
        // 4. Handle Failure & Retries
        console.error(`Job ${job._id} failed:`, error);

        let errorMsg = error.message;
        let isRetryable = true;

        // Try to parse enriched error from MetaGraphService
        try {
            const errorInfo = JSON.parse(error.message);
            errorMsg = errorInfo.message;
            isRetryable = errorInfo.isRetryable;
        } catch (e) {
            // Fallback for standard errors
        }

        job.attempt += 1;
        job.error = errorMsg;

        if (isRetryable && job.attempt < job.maxAttempts) {
            job.status = 'pending';
            // Exponential Backoff: 1m, 2m, 4m, 8m, 16m
            const backoffMinutes = Math.pow(2, job.attempt);
            job.nextRunAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
        } else {
            job.status = 'failed';
        }

        await job.save();

        // Log final failure in DMLog for visibility
        if (job.status === 'failed' && job.type === 'dm_delivery') {
            await DMLog.create({
                creatorId: job.payload.creatorId,
                recipientId: job.payload.recipientId,
                triggerSource: job.payload.source,
                status: 'failed',
                messageSent: job.payload.text,
                errorDetails: `Permanent failure after ${job.attempt} attempts: ${errorMsg}`,
                metadata: { jobId: job._id }
            });
        }

        return { status: 'failed', reason: errorMsg, willRetry: job.status === 'pending' };
    }
}

/**
 * Logic for sending DM
 */
async function handleDMDelivery(job: IQueueJob) {
    const { recipientId, text, accessToken, creatorId, ruleId, source } = job.payload;

    await MetaGraphService.sendDirectMessage({
        recipientId,
        message: text,
        accessToken
    });

    // Log success
    await DMLog.create({
        creatorId,
        recipientId,
        ruleId,
        triggerSource: source,
        status: 'success',
        messageSent: text,
        lastInteractionAt: new Date(),
        metadata: { jobId: job._id, attempt: job.attempt + 1 }
    });
}
