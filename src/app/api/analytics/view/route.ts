import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';

/**
 * POST /api/analytics/view
 * Public endpoint to track store and product views
 * Body: { creatorId, productId?, source?, campaign?, medium? }
 */
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const body = await req.json();
        const { creatorId, productId, source, campaign, medium } = body;

        if (!creatorId) {
            return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
        }

        // Get IP and User Agent for tracking
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const userAgent = req.headers.get('user-agent') || '';

        // Determine event type
        const eventType = productId ? 'product_view' : 'store_view';

        // Create analytics event
        const event = await (AnalyticsEvent as any).create({
            creatorId,
            productId: productId || null,
            eventType,
            source: source || 'direct',
            medium,
            campaign,
            ip,
            userAgent,
            timestamp: new Date(),
            day: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            hour: new Date().toISOString().slice(0, 13) // YYYY-MM-DD-HH
        });

        return NextResponse.json({ success: true, eventId: event._id });
    } catch (error: any) {
        console.error('Analytics tracking error:', error);
        return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
    }
}
