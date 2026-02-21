import SequenceEnrollment from '../models/SequenceEnrollment';
import EmailSequence from '../models/EmailSequence';
import mongoose from 'mongoose';

/**
 * Enrolls a user in a matching active sequence for a given trigger.
 */
export async function enrollInSequence(
    email: string,
    creatorId: string | mongoose.Types.ObjectId,
    triggerType: 'signup' | 'purchase' | 'abandoned_cart'
) {
    try {
        // 1. Find active sequence for this creator and trigger
        const sequence = await EmailSequence.findOne({
            creatorId: new mongoose.Types.ObjectId(creatorId.toString()),
            triggerType,
            isActive: true
        });

        if (!sequence || !sequence.steps || sequence.steps.length === 0) {
            return { success: false, message: 'No active sequence found for this trigger' };
        }

        // 2. Identify the first step
        const steps = [...sequence.steps].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
        const firstStep = steps[0];

        // Calculate due date (Step 0 indexed in enrollment, mapping to first step in sequence)
        const nextStepDueAt = new Date(Date.now() + (firstStep.delayHours || 0) * 60 * 60 * 1000);

        // 3. Create or update enrollment
        const enrollment = await SequenceEnrollment.findOneAndUpdate(
            { email, sequenceId: sequence._id, status: 'active' },
            {
                creatorId: sequence.creatorId,
                currentStep: 0,
                nextStepDueAt,
                metadata: { triggerType, enrolledAt: new Date() }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // 4. Create the first QueueJob for this sequence
        const { QueueJob } = await import('../models/QueueJob');
        await QueueJob.create({
            type: 'email_sequence_step',
            payload: {
                sequenceId: sequence._id.toString(),
                enrollmentId: enrollment._id.toString(),
                email,
                subject: firstStep.subject,
                content: firstStep.content,
                stepIndex: 0
            },
            nextRunAt: nextStepDueAt,
            status: 'pending'
        });

        // 5. Update stats on the sequence
        await EmailSequence.findByIdAndUpdate(sequence._id, {
            $inc: { 'stats.enrollments': 1 }
        });

        console.log(`[Marketing] Enrolled ${email} in sequence "${sequence.name}" and scheduled first step.`);
        return { success: true, enrollmentId: enrollment._id };

    } catch (error) {
        console.error('[Marketing] Sequence enrollment failed:', error);
        return { success: false, error };
    }
}
