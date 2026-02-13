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
        } else if (job.type === 'email_sequence_step') {
            await handleEmailSequenceStep(job);
        }

        // 3. Mark Completed
        job.status = 'completed';
        job.updatedAt = new Date();
        await job.save();

        return { status: 'success', jobId: job._id };

    } catch (error: any) {
        // ... (existing error handling)
    }
}

/**
 * Logic for sending DM
 */
async function handleDMDelivery(job: IQueueJob) {
    // ... (existing implementation)
    const { recipientId, text, accessToken, creatorId, ruleId, source } = job.payload;
    if (!recipientId || !text || !accessToken) throw new Error('Invalid DM payload');

    await MetaGraphService.sendDirectMessage({
        recipientId,
        message: text,
        accessToken
    });

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

/**
 * Logic for Email Sequence Step
 */
async function handleEmailSequenceStep(job: IQueueJob) {
    const { sequenceId, stepId, subscriberId, email, subject, content } = job.payload;
    const { default: EmailSequence } = await import('@/lib/models/EmailSequence'); // Dynamic import to avoid cycles?
    // Actually static import is better if possible, but let's stick to pattern or add import at top.

    // 1. Send Email (Mock for now, or use a service)
    console.log(`Sending email to ${email} for sequence ${sequenceId} step ${stepId}`);
    // In real implemenation: await EmailService.send({ to: email, subject, html: content });

    // 2. Schedule Next Step
    // We need to fetch the sequence to find the next step
    if (sequenceId && stepId !== undefined) {
        const sequence = await EmailSequence.findById(sequenceId);
        if (sequence) {
            const currentStepIndex = parseInt(stepId);
            const nextStepIndex = currentStepIndex + 1;

            if (nextStepIndex < sequence.steps.length) {
                const nextStep = sequence.steps[nextStepIndex];
                const delayMs = nextStep.delayHours * 60 * 60 * 1000;
                const nextRunAt = new Date(Date.now() + delayMs);

                await QueueJob.create({
                    type: 'email_sequence_step',
                    payload: {
                        sequenceId,
                        stepId: nextStepIndex.toString(),
                        subscriberId,
                        email,
                        subject: nextStep.subject,
                        content: nextStep.content
                    },
                    nextRunAt,
                    status: 'pending'
                });
                console.log(`Scheduled next step ${nextStepIndex} for ${email} at ${nextRunAt}`);
            } else {
                // Sequence completed
                await EmailSequence.updateOne(
                    { _id: sequenceId },
                    { $inc: { 'stats.completed': 1 } }
                );
            }
        }
    }
}

