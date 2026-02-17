import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { sendWelcomeEmail } from '@/lib/services/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/clerk
 * Handles Clerk webhook events (user.created, user.updated, etc.)
 */
export async function POST(req: NextRequest) {
    try {
        const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

        if (!WEBHOOK_SECRET) {
            console.error('CLERK_WEBHOOK_SECRET not configured');
            return NextResponse.json(
                { error: 'Webhook not configured' },
                { status: 500 }
            );
        }

        // Get headers for signature verification
        const svix_id = req.headers.get('svix-id');
        const svix_timestamp = req.headers.get('svix-timestamp');
        const svix_signature = req.headers.get('svix-signature');

        if (!svix_id || !svix_timestamp || !svix_signature) {
            return NextResponse.json(
                { error: 'Missing Svix headers' },
                { status: 400 }
            );
        }

        // Get raw body
        const payload = await req.text();

        // Verify webhook signature
        const wh = new Webhook(WEBHOOK_SECRET);
        let evt: any;

        try {
            evt = wh.verify(payload, {
                'svix-id': svix_id,
                'svix-timestamp': svix_timestamp,
                'svix-signature': svix_signature,
            });
        } catch (err: any) {
            console.error('Clerk webhook verification failed:', err.message);
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Handle events
        const eventType = evt.type;
        console.log(`[Clerk Webhook] Received: ${eventType}`);

        if (eventType === 'user.created') {
            const { id, email_addresses, first_name } = evt.data;
            const primaryEmail = email_addresses?.find((e: any) => e.id === evt.data.primary_email_address_id);

            if (primaryEmail?.email_address) {
                try {
                    await sendWelcomeEmail(primaryEmail.email_address, first_name || 'there');
                    console.log(`[Clerk Webhook] Welcome email sent to ${primaryEmail.email_address}`);
                } catch (emailError: any) {
                    console.error('[Clerk Webhook] Welcome email failed:', emailError);
                    // Don't fail webhook if email fails
                }
            }
        }

        // Return success immediately (don't make Clerk wait)
        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error: any) {
        console.error('[Clerk Webhook] Error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
