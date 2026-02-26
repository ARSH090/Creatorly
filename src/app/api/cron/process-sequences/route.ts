import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import SequenceEnrollment from '@/lib/models/SequenceEnrollment';
import EmailSequence from '@/lib/models/EmailSequence';
import { QueueJob } from '@/lib/models/QueueJob';

export async function POST(req: NextRequest) {
    // Upstash QStash logic or simply CRON_SECRET for now as per project convention
    const authHeader = req.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectToDatabase();
        const now = new Date();

        // 1. Find enrollments that are due for their next step
        const dueEnrollments = await SequenceEnrollment.find({
            status: 'active',
            nextStepDueAt: { $lte: now }
        }).limit(100);

        console.log(`[Sequence Cron] Found ${dueEnrollments.length} due enrollments. Enqueuing jobs...`);

        let jobCount = 0;
        for (const enrollment of dueEnrollments) {
            try {
                const sequence = await EmailSequence.findById(enrollment.sequenceId);
                if (!sequence || !sequence.isActive) {
                    enrollment.status = 'cancelled';
                    await enrollment.save();
                    continue;
                }

                const currentStep = sequence.steps.find(s => s.sequenceOrder === enrollment.currentStep);
                if (!currentStep) {
                    enrollment.status = 'completed';
                    await enrollment.save();
                    continue;
                }

                // Create a QueueJob for this specific email step
                await QueueJob.create({
                    type: 'email_sequence_step',
                    payload: {
                        sequenceId: sequence._id,
                        enrollmentId: enrollment._id,
                        email: enrollment.email,
                        subject: currentStep.subject,
                        content: currentStep.content,
                        stepIndex: enrollment.currentStep
                    },
                    status: 'pending',
                    nextRunAt: now
                });

                // Mark enrollment as processing/locked so it doesn't get picked up again next minute
                // until the QueueJob finishes and updates it to the next step
                enrollment.nextStepDueAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h safety lock
                await enrollment.save();

                jobCount++;
            } catch (err) {
                console.error(`[Sequence Cron] Failed to enqueue job for ${enrollment._id}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            jobsCreated: jobCount,
            message: `Enqueued ${jobCount} work items.`
        });

    } catch (error: any) {
        console.error('[Sequence Cron] Fatal error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Keep GET for manual triggering/ease of testing during dev
export async function GET(req: NextRequest) {
    return POST(req);
}
