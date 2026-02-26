import { connectToDatabase } from '@/lib/db/mongodb';
import EmailSequence from '@/lib/models/EmailSequence';
import SequenceEnrollment from '@/lib/models/SequenceEnrollment';

/**
 * Enroll a subscriber into matching email sequences based on a trigger event.
 * 
 * @param email - subscriber's email address
 * @param creatorId - the creator who owns the sequences
 * @param triggerType - the event that triggered enrollment
 * @param triggerProductId - optional product ID for purchase/lead_magnet triggers
 */
export async function enrollInSequence(
    email: string,
    creatorId: string,
    triggerType: 'signup' | 'purchase' | 'abandoned_cart' | 'lead_magnet' | 'new_subscriber' | 'manual',
    triggerProductId?: string
): Promise<{ enrolled: number }> {
    await connectToDatabase();

    // Find active sequences matching this trigger
    const query: any = {
        creatorId,
        triggerType,
        isActive: true,
    };

    // For product-specific triggers, match the product or sequences without a product filter
    if (triggerProductId && (triggerType === 'purchase' || triggerType === 'lead_magnet')) {
        query.$or = [
            { triggerProductId },
            { triggerProductId: { $exists: false } },
            { triggerProductId: null },
        ];
    }

    const sequences = await EmailSequence.find(query);

    let enrolled = 0;

    for (const sequence of sequences) {
        if (!sequence.steps || sequence.steps.length === 0) continue;

        // Check for existing active enrollment (prevent duplicates)
        const existing = await SequenceEnrollment.findOne({
            email,
            sequenceId: sequence._id,
            status: 'active',
        });

        if (existing) continue;

        // Sort steps by order to find the first step
        const sortedSteps = [...sequence.steps].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
        const firstStep = sortedSteps[0];

        // Calculate when the first email should be sent
        const nextStepDueAt = new Date(Date.now() + (firstStep.delayHours || 0) * 60 * 60 * 1000);

        await SequenceEnrollment.create({
            email,
            sequenceId: sequence._id,
            creatorId,
            currentStep: 0,
            nextStepDueAt,
            status: 'active',
            metadata: { triggerProductId, triggerType },
        });

        // Increment enrollment stats
        await EmailSequence.findByIdAndUpdate(sequence._id, {
            $inc: { 'stats.enrollments': 1 },
        });

        enrolled++;
    }

    console.log(`[SequenceEnroll] Enrolled ${email} into ${enrolled} sequences for trigger=${triggerType}`);
    return { enrolled };
}
