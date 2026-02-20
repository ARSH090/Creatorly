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

        const { id, email_addresses, first_name, last_name, username, image_url } = evt.data;
        const primaryEmail = email_addresses?.find((e: any) => e.id === evt.data.primary_email_address_id)?.email_address;
        const displayName = first_name ? `${first_name} ${last_name || ''}`.trim() : (username || primaryEmail?.split('@')[0] || 'User');

        if (eventType === 'user.created' || eventType === 'user.updated') {
            const { connectToDatabase } = await import('@/lib/db/mongodb');
            const { User } = await import('@/lib/models/User');

            await connectToDatabase();

            const userUpdate = {
                clerkId: id,
                email: primaryEmail,
                displayName: displayName,
                username: username || primaryEmail?.split('@')[0] || id,
                avatar: image_url,
                role: 'creator', // Default role for new signups
                emailVerified: true, // Verification is handled by Clerk
            };

            await User.findOneAndUpdate(
                { clerkId: id },
                { $set: userUpdate },
                { upsert: true, new: true }
            );

            console.log(`[Clerk Webhook] User ${id} synchronized with MongoDB`);

            if (eventType === 'user.created' && primaryEmail) {
                try {
                    await sendWelcomeEmail(primaryEmail, first_name || 'there');
                    console.log(`[Clerk Webhook] Welcome email sent to ${primaryEmail}`);
                } catch (emailError: any) {
                    console.error('[Clerk Webhook] Welcome email failed:', emailError);
                }
            }
        }

        if (eventType === 'user.deleted') {
            const { connectToDatabase } = await import('@/lib/db/mongodb');
            const { User } = await import('@/lib/models/User');

            await connectToDatabase();

            // Soft delete: keep the record but mark as deleted and move clerkId
            await User.findOneAndUpdate(
                { clerkId: id },
                {
                    $set: { deletedAt: new Date(), status: 'suspended' },
                    $unset: { clerkId: "" }
                }
            );
            console.log(`[Clerk Webhook] User ${id} (soft) deleted from MongoDB`);
        }

        // Return success immediately
        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error: any) {
        console.error('[Clerk Webhook] Error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
