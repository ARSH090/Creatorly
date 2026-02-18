import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import SequenceEnrollment from '@/lib/models/SequenceEnrollment';
import EmailSequence from '@/lib/models/EmailSequence';
import User from '@/lib/models/User';
import { sendMarketingEmail } from '@/lib/services/email';

export async function GET(req: NextRequest) {
    // Basic security check for Vercel Cron
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
        }).limit(50); // Process in batches to avoid timeouts

        console.log(`[Cron] Processing ${dueEnrollments.length} due sequence steps`);

        let processedCount = 0;

        for (const enrollment of dueEnrollments) {
            try {
                // Fetch sequence definition
                const sequence = await EmailSequence.findById(enrollment.sequenceId);
                if (!sequence || !sequence.isActive) {
                    enrollment.status = 'cancelled';
                    await enrollment.save();
                    continue;
                }

                const steps = [...sequence.steps].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
                const currentStepIndex = enrollment.currentStep;
                const currentStep = steps[currentStepIndex];

                if (!currentStep) {
                    enrollment.status = 'completed';
                    await enrollment.save();
                    continue;
                }

                // Fetch Creator Info
                const creator = await User.findById(enrollment.creatorId).select('displayName').lean();
                const creatorName = creator?.displayName || 'a Creator';

                // Send Email
                await sendMarketingEmail(
                    enrollment.email,
                    currentStep.subject,
                    currentStep.content,
                    creatorName
                );

                // Determine next step
                const nextStepIndex = currentStepIndex + 1;
                const nextStep = steps[nextStepIndex];

                if (nextStep) {
                    // Schedule next step
                    enrollment.currentStep = nextStepIndex;
                    enrollment.nextStepDueAt = new Date(Date.now() + (nextStep.delayHours || 0) * 60 * 60 * 1000);
                } else {
                    // No more steps
                    enrollment.status = 'completed';
                    await EmailSequence.findByIdAndUpdate(sequence._id, { $inc: { 'stats.completed': 1 } });
                }

                await enrollment.save();
                processedCount++;
            } catch (err) {
                console.error(`[Cron] Failed to process enrollment ${enrollment._id}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            processed: processedCount,
            message: `Processed ${processedCount} sequence steps`
        });

    } catch (error: any) {
        console.error('[Cron] Sequence processing error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
