import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Referral from '@/lib/models/Referral';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'Missing code' }, { status: 400 });
        }

        await connectToDatabase();

        // Increment click count (fire-and-forget style for performance)
        Referral.findOneAndUpdate(
            { code },
            { $inc: { clicks: 1 } },
            { new: true }
        ).catch(err => console.error('Referral click track error:', err));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Referral API Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
