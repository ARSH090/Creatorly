import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { sendEmail } from '@/lib/services/email';
import { Resend } from 'resend';
import { connectToDatabase } from '@/lib/db/mongodb';

// Ensure we have access to the DB models since the worker will operate independently
import EmailCampaign from '@/lib/models/EmailCampaign';
import EmailSequence from '@/lib/models/EmailSequence';
import User from '@/lib/models/User';
import { mailQueue } from '@/lib/queue';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

const resend = new Resend(process.env.RESEND_API_KEY);

function personalizeHtml(html: string, vars: Record<string, string>) {
    let personalized = html;
    for (const [key, value] of Object.entries(vars)) {
        personalized = personalized.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return personalized;
}

export const mailWorker = new Worker(
    'mail',
    async (job: Job) => {
        await connectToDatabase();

        switch (job.name) {
            case 'creator-campaign-batch': {
                const {
                    campaignId,
                    recipientBatch,   // [{ email, firstName, userId, unsubscribeToken }]
                    batchIndex,
                    totalBatches,
                } = job.data;

                const campaign = await EmailCampaign.findById(campaignId)
                    .populate('creatorId', 'name email displayName');
                if (!campaign || campaign.status === 'cancelled') return;

                const creator = campaign.creatorId as any;
                const creatorName = creator.displayName || creator.name || 'Creator';
                const creatorEmail = creator.email || process.env.RESEND_FROM_EMAIL;

                // Build Resend batch payload
                const emails = recipientBatch.map((r: any) => {
                    const html = personalizeHtml(campaign.content, {
                        first_name: r.firstName || 'there',
                        email: r.email,
                        creator_name: creatorName,
                        unsubscribe_url: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${r.unsubscribeToken}`,
                    });
                    return {
                        from: `${creatorName} <${process.env.RESEND_FROM_EMAIL || 'noreply@creatorly.in'}>`,
                        reply_to: creatorEmail,
                        to: r.email,
                        subject: campaign.subject,
                        html,
                        headers: {
                            'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${r.unsubscribeToken}>`,
                            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                            'X-Campaign-Id': campaignId,
                        },
                    };
                });

                if (emails.length > 0) {
                    try {
                        const result = await resend.batch.send(emails);
                        const sent = result.data?.data?.length ?? emails.length; // Resend batch sends back an array or count
                        const failed = recipientBatch.length - sent;

                        // Update campaign progress atomically
                        const isLastBatch = batchIndex === totalBatches - 1;
                        await EmailCampaign.findByIdAndUpdate(campaignId, {
                            $inc: { 'stats.sent': sent, 'stats.delivered': sent - failed },
                            ...(isLastBatch
                                ? { status: 'sent', sentAt: new Date() }
                                : {}),
                        });
                    } catch (error) {
                        console.error('Batch send failed:', error);
                        throw error;
                    }
                }
                break;
            }

            case 'email-sequence-step': {
                const {
                    sequenceId,
                    stepIndex,
                    subscriberEmail,
                    firstName,
                    unsubscribeToken,
                    creatorId,
                } = job.data;

                const [sequence, creator] = await Promise.all([
                    EmailSequence.findById(sequenceId),
                    User.findById(creatorId).select('name displayName email'),
                ]);

                if (!sequence?.isActive || !creator) return;

                const step = sequence.steps?.[stepIndex];
                if (!step) return;

                const creatorName = creator.displayName || creator.name || 'Creator';

                await resend.emails.send({
                    from: `${creatorName} <${process.env.RESEND_FROM_EMAIL || 'noreply@creatorly.in'}>`,
                    reply_to: creator.email,
                    to: subscriberEmail,
                    subject: step.subject,
                    html: personalizeHtml(step.content, {
                        first_name: firstName || 'there',
                        email: subscriberEmail,
                        unsubscribe_url: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${unsubscribeToken}`,
                    }),
                });

                // Queue next step if it exists
                const nextStep = sequence.steps[stepIndex + 1];
                if (nextStep) {
                    const delayMs = (nextStep.delayHours ?? 0) * 60 * 60 * 1000;
                    await mailQueue.add(
                        'email-sequence-step',
                        { sequenceId, stepIndex: stepIndex + 1, subscriberEmail, firstName, unsubscribeToken, creatorId },
                        { delay: delayMs, attempts: 3, backoff: { type: 'exponential', delay: 10_000 } }
                    );
                }
                break;
            }

            case 'abandoned-cart-recovery': {
                const { checkoutId } = job.data;
                const AbandonedCheckout = (await import('@/lib/models/AbandonedCheckout')).default;
                const Product = (await import('@/lib/models/Product')).default;
                const checkout = await AbandonedCheckout.findById(checkoutId);

                if (!checkout || checkout.status !== 'abandoned' || checkout.recoveryEnded) return;

                const product = await Product.findById(checkout.productId);
                const creator = await User.findById(checkout.creatorId).select('name displayName email username');
                if (!product || !creator) return;

                const isFirstEmail = !checkout.recoveryEmail1SentAt;
                const creatorName = creator.displayName || creator.name || 'Creator';
                const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL}/u/${creator.username}/p/${product._id}?email=${encodeURIComponent(checkout.buyerEmail)}`;

                const subject = isFirstEmail
                    ? `Did you forget something, ${checkout.buyerName || 'there'}?`
                    : `Last chance to grab ${product.title}!`;

                const html = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Hey ${checkout.buyerName || 'there'},</h2>
                        <p>We noticed you left <strong>${product.title}</strong> in your cart.</p>
                        <p>Ready to complete your purchase?</p>
                        <a href="${checkoutUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Complete Checkout</a>
                        <p>If you have any questions, just reply to this email.</p>
                        <p>Best,<br/>${creatorName}</p>
                    </div>
                `;

                await resend.emails.send({
                    from: `${creatorName} <${process.env.RESEND_FROM_EMAIL || 'noreply@creatorly.in'}>`,
                    reply_to: creator.email,
                    to: checkout.buyerEmail,
                    subject,
                    html
                });

                if (isFirstEmail) {
                    checkout.recoveryEmail1SentAt = new Date();
                    await checkout.save();
                    // Queue 2nd email after 24 hours
                    await mailQueue.add('abandoned-cart-recovery', { checkoutId }, { delay: 24 * 60 * 60 * 1000 });
                } else {
                    checkout.recoveryEmail2SentAt = new Date();
                    checkout.recoveryEnded = true;
                    await checkout.save();
                }
                break;
            }

            // Default - fallback to old single arbitrary send logic
            default: {
                const { to, subject, html } = job.data;
                console.log(`[MailWorker] Processing generic job ${job.id} for ${to}`);
                const result = await sendEmail({ to, subject, html });
                if (!result.success) {
                    throw new Error(typeof result.error === 'string' ? result.error : 'Email failed');
                }
                return { success: true };
            }
        }
    },
    { connection: connection as any, concurrency: 5 }
);
