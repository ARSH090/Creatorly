import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';

/**
 * POST /api/analytics/click
 * Public endpoint to track product clicks and add-to-cart events
 * Body: { creatorId, productId, eventType: 'add_to_cart' | 'checkout_start', source?, campaign? }
 */
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const body = await req.json();
        const { creatorId, productId, eventType, source, campaign, medium } = body;

        if (!creatorId || !productId) {
            return NextResponse.json({ error: 'creatorId and productId are required' }, { status: 400 });
        }

        if (!['add_to_cart', 'checkout_start', 'product_click'].includes(eventType)) {
            return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 });
        }

        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const userAgent = req.headers.get('user-agent') || '';

        const event = await (AnalyticsEvent as any).create({
            creatorId,
            productId,
            eventType,
            source: source || 'direct',
            medium,
            campaign,
            ip,
            userAgent,
            timestamp: new Date(),
            day: new Date().toISOString().split('T')[0],
            hour: new Date().toISOString().slice(0, 13)
        });

        return NextResponse.json({ success: true, eventId: event._id });
    } catch (error: any) {
        console.error('Analytics tracking error:', error);
        return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
    }
}
