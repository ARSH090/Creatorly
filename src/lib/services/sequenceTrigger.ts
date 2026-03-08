import EmailSequence from '@/lib/models/EmailSequence';
import { mailQueue as emailQueue } from '@/lib/queue';

export async function triggerSequencesForSubscriber(params: {
    creatorId: string;
    subscriberEmail: string;
    firstName: string;
    unsubscribeToken: string;
    triggerType: 'purchase' | 'signup' | 'abandoned_cart' | 'lead_magnet' | 'new_subscriber' | 'manual';
    triggerProductId?: string;
}) {
    const sequences = await EmailSequence.find({
        creatorId: params.creatorId,
        isActive: true,
        $or: [
            { triggerType: params.triggerType },
            { triggerType: 'new_subscriber' }, // 'all' equivalent in prompt? Let's assume new_subscriber could be general or specific.
        ],
        ...(params.triggerProductId
            ? {
                $or: [
                    { triggerProductId: params.triggerProductId },
                    { triggerProductId: { $exists: false } },
                    { triggerProductId: null }
                ],
            }
            : {}),
    }).select('_id steps');

    for (const seq of sequences) {
        if (!seq.steps?.length) continue;
        const firstStep = seq.steps[0];
        const delayMs =
            (firstStep.delayHours ?? 0) * 60 * 60 * 1000;

        await emailQueue.add(
            'email-sequence-step',
            {
                sequenceId: seq._id.toString(),
                stepIndex: 0,
                subscriberEmail: params.subscriberEmail,
                firstName: params.firstName,
                unsubscribeToken: params.unsubscribeToken,
                creatorId: params.creatorId,
            },
            { delay: delayMs, attempts: 3 }
        );
    }
}
