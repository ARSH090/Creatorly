import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { NewsletterLead } from '@/lib/models/NewsletterLead';

import { NewsletterSchema } from '@/lib/validation/schemas';

export async function POST(req: NextRequest) {
    try {
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

        // Use UPSERT logic to handle re-subscriptions or duplicate attempts
        await NewsletterLead.findOneAndUpdate(
            { email, creatorId },
            {
                status: 'active',
                source: source || 'storefront'
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, message: 'Subscribed successfully' });
    } catch (error: any) {
        console.error('[Newsletter] Subscription error:', error);
        return NextResponse.json({
            error: 'Failed to subscribe',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
