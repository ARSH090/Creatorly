/**
 * flowExecutor.ts
 * Executes multi-step AutoDM flows — the ManyChat flow engine.
 */
import { AutoDMFlow, IAutoDMFlow, IFlowStep } from '@/lib/models/AutoDMFlow';
import { DMLog } from '@/lib/models/DMLog';
import { InstagramService } from '@/lib/services/instagram';
import { personaliseMessage } from '@/lib/services/autoDMService';
import { connectToDatabase } from '@/lib/db/mongodb';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlowExecContext {
    flowId: string;
    creatorId: string;
    recipientIgId: string;
    recipientUsername: string;
    accessToken: string;
    igUserId: string;
    vars: Record<string, string>;
}

interface ActiveFlowSession {
    flowId: string;
    currentStepId: string;
    creatorId: string;
    accessToken: string;
    igUserId: string;
}

// In-memory session store (replace with Redis for production)
const activeSessions = new Map<string, ActiveFlowSession>();

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ─── Start a flow ─────────────────────────────────────────────────────────────

export async function startFlow(params: {
    flowId: string;
    recipientIgId: string;
    recipientUsername: string;
    creatorId: string;
    accessToken: string;
    igUserId: string;
    vars?: Record<string, string>;
}): Promise<boolean> {
    await connectToDatabase();

    const flow = await AutoDMFlow.findById(params.flowId);
    if (!flow || !flow.isActive || flow.steps.length === 0) return false;

    const sorted = [...flow.steps].sort((a, b) => a.order - b.order);
    const firstStep = sorted[0];

    const ctx: FlowExecContext = {
        flowId: params.flowId,
        creatorId: params.creatorId,
        recipientIgId: params.recipientIgId,
        recipientUsername: params.recipientUsername,
        accessToken: params.accessToken,
        igUserId: params.igUserId,
        vars: {
            name: params.recipientUsername,
            username: params.recipientUsername,
            ...(params.vars ?? {}),
        },
    };

    // Update stats
    await AutoDMFlow.findByIdAndUpdate(params.flowId, { $inc: { 'stats.triggered': 1 } });

    await executeStep(flow, firstStep, ctx);
    return true;
}

// ─── Execute a single step ────────────────────────────────────────────────────

async function executeStep(
    flow: IAutoDMFlow,
    step: IFlowStep,
    ctx: FlowExecContext
): Promise<void> {
    const sessionKey = `${ctx.recipientIgId}:${ctx.creatorId}`;

    switch (step.type) {
        case 'delay': {
            const ms = (step.delaySeconds ?? 1) * 1000;
            await new Promise((r) => setTimeout(r, Math.min(ms, 10000))); // cap at 10s in prod
            if (step.nextStepId) {
                const next = flow.steps.find((s) => s.id === step.nextStepId);
                if (next) await executeStep(flow, next, ctx);
            }
            break;
        }

        case 'message':
        case 'question':
        case 'email_collect': {
            const text = personaliseMessage(step.content, ctx.vars);
            const result = await InstagramService.sendDirectMessage({
                recipientId: ctx.recipientIgId,
                message: text,
                accessToken: ctx.accessToken,
                igUserId: ctx.igUserId,
            });

            await DMLog.create({
                creatorId: ctx.creatorId,
                recipientId: ctx.recipientIgId,
                recipientUsername: ctx.recipientUsername,
                triggerSource: 'automation',
                status: result.success ? 'success' : 'failed',
                messageSent: text,
                lastInteractionAt: new Date(),
                deliveryStatus: 'sent',
                metadata: { flowId: ctx.flowId, currentStepId: step.id },
            });

            if (result.success) {
                await AutoDMFlow.findByIdAndUpdate(ctx.flowId, { $inc: { 'stats.dmsSent': 1 } });
            }

            // For email_collect + question steps: save session and wait for user reply
            if (step.type === 'email_collect' || (step.type === 'question' && step.buttons && step.buttons.length > 0)) {
                activeSessions.set(sessionKey, {
                    flowId: ctx.flowId,
                    currentStepId: step.id,
                    creatorId: ctx.creatorId,
                    accessToken: ctx.accessToken,
                    igUserId: ctx.igUserId,
                });
                // TTL cleanup
                setTimeout(() => activeSessions.delete(sessionKey), SESSION_TTL_MS);
                return; // Wait for webhook reply
            }

            // Auto-advance
            if (step.nextStepId) {
                const next = flow.steps.find((s) => s.id === step.nextStepId);
                if (next) await executeStep(flow, next, ctx);
            }
            break;
        }

        case 'button': {
            // Buttons are attached to messages — this step type renders in the previous message
            // Advance to nextStepId
            if (step.nextStepId) {
                const next = flow.steps.find((s) => s.id === step.nextStepId);
                if (next) await executeStep(flow, next, ctx);
            }
            break;
        }
    }
}

// ─── Handle user reply in an active flow ─────────────────────────────────────

export async function handleFlowReply(params: {
    senderIgId: string;
    creatorId: string;
    messageText: string;
}): Promise<boolean> {
    const sessionKey = `${params.senderIgId}:${params.creatorId}`;
    const session = activeSessions.get(sessionKey);
    if (!session) return false;

    await connectToDatabase();
    const flow = await AutoDMFlow.findById(session.flowId);
    if (!flow) { activeSessions.delete(sessionKey); return false; }

    const currentStep = flow.steps.find((s) => s.id === session.currentStepId);
    if (!currentStep) { activeSessions.delete(sessionKey); return false; }

    // Route to email collector if email_collect step
    if (currentStep.type === 'email_collect') {
        const { handleEmailReply } = await import('@/lib/services/dmEmailCollector');
        await handleEmailReply({
            senderIgId: params.senderIgId,
            creatorId: params.creatorId,
            email: params.messageText.trim(),
            flow,
            currentStep,
            session,
        });
        return true;
    }

    // Button response — match to button action
    if (currentStep.buttons && currentStep.buttons.length > 0) {
        const lowerText = params.messageText.toLowerCase().trim();
        const matchedButton = currentStep.buttons.find(
            (b) => b.label.toLowerCase().includes(lowerText) || lowerText.includes(b.label.toLowerCase().split(' ')[0])
        );

        activeSessions.delete(sessionKey);

        if (matchedButton && matchedButton.nextStepId) {
            const nextStep = flow.steps.find((s) => s.id === matchedButton.nextStepId);
            if (nextStep) {
                // Find creator's Instagram account token
                await executeStep(flow, nextStep, {
                    flowId: session.flowId,
                    creatorId: session.creatorId,
                    recipientIgId: params.senderIgId,
                    recipientUsername: '',
                    accessToken: session.accessToken,
                    igUserId: session.igUserId,
                    vars: {},
                });
            }
        }
        return true;
    }

    return false;
}

// ─── Get active session for a user ────────────────────────────────────────────

export function getActiveSession(senderIgId: string, creatorId: string): ActiveFlowSession | undefined {
    return activeSessions.get(`${senderIgId}:${creatorId}`);
}

export function clearSession(senderIgId: string, creatorId: string): void {
    activeSessions.delete(`${senderIgId}:${creatorId}`);
}
