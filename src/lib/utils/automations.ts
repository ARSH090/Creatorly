import AutomationWorkflow, { IAutomationStep } from '@/lib/models/AutomationWorkflow';
import WorkflowEnrollment from '@/lib/models/WorkflowEnrollment';
import Subscriber from '@/lib/models/Subscriber';
import SubscriberTag from '@/lib/models/SubscriberTag';
import EmailCampaign from '@/lib/models/EmailCampaign'; // Assuming it exists or using a generic Email model
import mongoose from 'mongoose';

/**
 * Enrolls a subscriber into all active workflows matching a trigger
 */
export async function triggerWorkflows(creatorId: string, triggerType: string, subscriberId: string, metadata: any = {}) {
    try {
        // Find all active workflows for this trigger
        const workflows = await AutomationWorkflow.find({
            creatorId,
            triggerType,
            isActive: true
        });

        for (const workflow of workflows) {
            // Check trigger config (e.g. specific product ID for purchase trigger)
            if (triggerType === 'purchase' && workflow.triggerConfig.productId) {
                if (workflow.triggerConfig.productId !== metadata.productId) continue;
            }

            // Enroll subscriber if not already enrolled
            await WorkflowEnrollment.updateOne(
                { workflowId: workflow._id, subscriberId },
                {
                    $setOnInsert: {
                        workflowId: workflow._id,
                        subscriberId,
                        currentStepIndex: 0,
                        nextSendAt: new Date(), // Start immediately
                        status: 'active'
                    }
                },
                { upsert: true }
            );

            await AutomationWorkflow.findByIdAndUpdate(workflow._id, { $inc: { subscriberCount: 1 } });
        }
    } catch (error) {
        console.error('Error triggering workflows:', error);
    }
}

/**
 * Processes the next step for an enrollment
 */
export async function processEnrollmentStep(enrollmentId: string) {
    const enrollment = await WorkflowEnrollment.findById(enrollmentId).populate('workflowId');
    if (!enrollment || enrollment.status !== 'active') return;

    const workflow = enrollment.workflowId as any;
    const step = workflow.steps[enrollment.currentStepIndex];

    if (!step) {
        enrollment.status = 'completed';
        await enrollment.save();
        return;
    }

    let nextStepIndex = enrollment.currentStepIndex + 1;
    let nextSendAt = new Date();

    switch (step.type) {
        case 'email':
            await sendAutomationEmail(enrollment.subscriberId, step.emailId);
            break;
        case 'wait':
            const hours = step.delayHours || 24;
            nextSendAt = new Date(Date.now() + hours * 3600000);
            break;
        case 'tag':
            const subscriber = await Subscriber.findById(enrollment.subscriberId);
            if (subscriber) {
                await SubscriberTag.updateOne(
                    { subscriberId: subscriber._id, tag: step.value },
                    { $setOnInsert: { creatorId: workflow.creatorId, subscriberId: subscriber._id, tag: step.value, source: 'automation' } },
                    { upsert: true }
                );
            }
            break;
        // Add more step types here
    }

    enrollment.currentStepIndex = nextStepIndex;
    enrollment.nextSendAt = nextSendAt;

    // If it was just a tag or email without wait, we could potentially process next step immediately
    // but for simplicity and safety against infinite loops, we'll wait for next cron cycle or next tick
    await enrollment.save();
}

async function sendAutomationEmail(subscriberId: mongoose.Types.ObjectId, emailTemplateId: string) {
    // In a real implementation, this would call the Email Service (Resend/SendGrid)
    console.log(`Sending automation email ${emailTemplateId} to ${subscriberId}`);
}
