import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AnalyticsEvent } from '@/lib/models/AnalyticsEvent';
import SequenceEnrollment from '@/lib/models/SequenceEnrollment';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');
        const creatorId = searchParams.get('cid');

        if (!email || !creatorId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // 1. Cancel all active sequence enrollments for this user + creator
        await SequenceEnrollment.updateMany(
            { email, creatorId: new mongoose.Types.ObjectId(creatorId), status: 'active' },
            { status: 'cancelled' }
        );

        // 2. Log unsubscribe event
        await AnalyticsEvent.create({
            eventType: 'error', // Reusing as 'user_action' or similar
            creatorId: new mongoose.Types.ObjectId(creatorId),
            ip: req.headers.get('x-forwarded-for') || 'unknown',
            path: '/api/marketing/unsubscribe',
            metadata: { email, action: 'unsubscribe' }
        });

        // 3. Return a friendly HTML page
        return new NextResponse(
            `<html>
                <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #000; color: #fff; text-align: center;">
                    <div style="max-width: 400px; padding: 40px; border: 1px solid #333; border-radius: 20px;">
                        <h1 style="font-size: 24px;">Unsubscribed successfully</h1>
                        <p style="color: #888;">You will no longer receive marketing emails from this creator.</p>
                        <a href="https://creatorly.in" style="color: #6366f1; text-decoration: none; font-weight: bold;">Back to Creatorly</a>
                    </div>
                </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html' } }
        );

    } catch (error) {
        console.error('Unsubscribe error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
