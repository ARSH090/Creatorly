/**
 * dmEmailCollector.ts
 * Handles email collection during multi-step DM flows.
 * Validates email, saves to EmailSubscriber, and advances the flow.
 */
import { InstagramService } from '@/lib/services/instagram';
import { AutoDMFlow, IAutoDMFlow, IFlowStep } from '@/lib/models/AutoDMFlow';
import { connectToDatabase } from '@/lib/db/mongodb';
import mongoose from 'mongoose';

// ─── Email validation ─────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
    return EMAIL_REGEX.test(email.trim());
}

// ─── Handle email_collect step reply ─────────────────────────────────────────

export async function handleEmailReply(params: {
    senderIgId: string;
    creatorId: string;
    email: string;
    flow: IAutoDMFlow;
    currentStep: IFlowStep;
    session: { flowId: string; currentStepId: string; creatorId: string; accessToken: string; igUserId: string };
}): Promise<void> {
    const { senderIgId, creatorId, email, flow, currentStep, session } = params;

    if (!isValidEmail(email)) {
        // Send retry message
        await InstagramService.sendDirectMessage({
            recipientId: senderIgId,
            message: "Hmm, that doesn't look like a valid email. Try again (e.g. you@gmail.com):",
            accessToken: session.accessToken,
            igUserId: session.igUserId,
        });
        // Session stays active — waiting for correct email
        return;
    }

    // Valid email — save to EmailSubscriber collection
    await connectToDatabase();
    try {
        const EmailSubscriber = (await import('@/lib/models/NewsletterLead')).default;
        const trimmed = email.trim().toLowerCase();

        // Check for duplicate
        const existing = await EmailSubscriber.findOne({ creatorId, email: trimmed });
        if (!existing) {
            await EmailSubscriber.create({
                creatorId: new mongoose.Types.ObjectId(creatorId),
                email: trimmed,
                instagramId: senderIgId,
                source: 'instagram_autodm',
                tags: ['instagram', flow.trigger.keywords?.[0] ?? 'autodm'],
                subscribedAt: new Date(),
            });
        }

        // Update flow stats
        await AutoDMFlow.findByIdAndUpdate(flow._id, { $inc: { 'stats.emailsCollected': 1 } });

        // Send success confirmation
        const confirmStep = currentStep.nextStepId
            ? flow.steps.find((s) => s.id === currentStep.nextStepId)
            : null;

        const confirmMsg = confirmStep?.content
            ?? `Done! 🎉 Got your email. Check your inbox in a moment!`;

        await InstagramService.sendDirectMessage({
            recipientId: senderIgId,
            message: confirmMsg.replace('{{email}}', trimmed),
            accessToken: session.accessToken,
            igUserId: session.igUserId,
        });

        // Clear session
        const { clearSession } = await import('@/lib/services/flowExecutor');
        clearSession(senderIgId, creatorId);

    } catch (err) {
        console.error('[dmEmailCollector] Failed to save email:', err);
    }
}
