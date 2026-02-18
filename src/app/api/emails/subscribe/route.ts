import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { NewsletterLead } from '@/lib/models/NewsletterLead';
import User from '@/lib/models/User';
import { NewsletterSchema } from '@/lib/validation/schemas';
import { sendNewsletterWelcomeEmail } from '@/lib/services/email';
import { RateLimiter } from '@/lib/security/rate-limiter';

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
        const isAllowed = await RateLimiter.check('newsletter_subscribe', 5, 10 * 60 * 1000, ip);

        if (!isAllowed) {
            return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
        }

        const body = await req.json();
        const validation = NewsletterSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.format()
            }, { status: 400 });
        }

        const { email, creatorId, source } = validation.data;

        await connectToDatabase();

        // 1. Fetch Creator Info for personalization
        const creator = await User.findById(creatorId).select('displayName').lean();
        const creatorName = creator?.displayName || 'a Creator';

        // 2. Use UPSERT logic to handle re-subscriptions or duplicate attempts
        const lead = await NewsletterLead.findOneAndUpdate(
            { email, creatorId },
            {
                status: 'active',
                source: source || 'storefront'
            },
            { upsert: true, new: true }
        );

        // 3. Trigger Welcome Email
        await sendNewsletterWelcomeEmail(email, creatorName);

        // 4. Enroll in 'signup' email sequence if exists
        const { enrollInSequence } = await import('@/lib/services/marketing');
        await enrollInSequence(email, creatorId, 'signup');

        return NextResponse.json({ success: true, message: 'Subscribed successfully' });
    } catch (error: any) {
        console.error('[Newsletter] Subscription error:', error);
        return NextResponse.json({
            error: 'Failed to subscribe',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
