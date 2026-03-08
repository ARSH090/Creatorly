import SequenceEnrollment from '../models/SequenceEnrollment';
import EmailSequence from '../models/EmailSequence';
import mongoose from 'mongoose';
import { triggerSequencesForSubscriber } from './sequenceTrigger';
import Subscriber from '../models/Subscriber';
import crypto from 'crypto';

/**
 * Enrolls a user in a matching active sequence for a given trigger.
 */
export async function enrollInSequence(
    email: string,
    creatorId: string | mongoose.Types.ObjectId,
    triggerType: 'signup' | 'purchase' | 'abandoned_cart' | 'lead_magnet' | 'new_subscriber' | 'manual',
    triggerProductId?: string
) {
    try {
        // 1. Find or create subscriber to grab firstName and unsubscribeToken
        let subscriber = await Subscriber.findOne({ email, creatorId });
        if (!subscriber) {
            subscriber = await Subscriber.create({
                creatorId,
                email,
                name: email.split('@')[0],
                status: 'active',
                unsubscribeToken: crypto.randomBytes(32).toString('hex')
            });
        } else if (!subscriber.unsubscribeToken) {
            subscriber.unsubscribeToken = crypto.randomBytes(32).toString('hex');
            await subscriber.save();
        }

        const firstName = subscriber.name?.split(' ')[0] || 'there';

        // 2. Schedule sequence steps directly in BullMQ
        await triggerSequencesForSubscriber({
            creatorId: creatorId.toString(),
            subscriberEmail: email,
            firstName,
            unsubscribeToken: subscriber.unsubscribeToken,
            triggerType,
            triggerProductId
        });

        // Optional: keep SequenceEnrollment for stats/tracking if you want, 
        // but the BullMQ queue 'email-sequence-step' now handles the actual delivery logic natively.
        // We'll upsert an enrollment record just so the status is tracked
        const sequence = await EmailSequence.findOne({
            creatorId: new mongoose.Types.ObjectId(creatorId.toString()),
            triggerType,
            isActive: true
        });

        if (sequence) {
            await SequenceEnrollment.findOneAndUpdate(
                { email, sequenceId: sequence._id },
                { status: 'active', metadata: { triggerType, enrolledAt: new Date() } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            await EmailSequence.findByIdAndUpdate(sequence._id, {
                $inc: { 'stats.enrollments': 1 }
            });
        }

        console.log(`[Marketing] Enqueued ${email} for sequences matching trigger: ${triggerType}`);
        return { success: true };

    } catch (error) {
        console.error('[Marketing] Sequence enrollment failed:', error);
        return { success: false, error };
    }
}
