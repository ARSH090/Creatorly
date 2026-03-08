import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Subscriber from '@/lib/models/Subscriber';
import SequenceEnrollment from '@/lib/models/SequenceEnrollment';

export async function PATCH(req: NextRequest) {
    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        }

        await connectToDatabase();

        const subscriber = await Subscriber.findOne({ unsubscribeToken: token });

        if (!subscriber) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
        }

        // Mark as unsubscribed
        subscriber.status = 'unsubscribed';
        subscriber.unsubscribedAt = new Date();
        await subscriber.save();

        // Cancel any active sequence enrollments for this subscriber + creator
        await SequenceEnrollment.updateMany(
            { email: subscriber.email, creatorId: subscriber.creatorId, status: 'active' },
            { status: 'cancelled' }
        );

        return NextResponse.json({ success: true, message: 'Unsubscribed successfully' });
    } catch (error: any) {
        console.error('Unsubscribe API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
