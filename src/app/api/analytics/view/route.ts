import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
// Analytics logging

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';
        const ua = req.headers.get('user-agent') || 'unknown';

        // Non-blocking for the user
        await connectToDatabase();

        // Simple log for now, can be expanded to a dedicated Analytics model
        console.log(`[Analytics] ${data.type} view for ${data.creatorId} from ${ip}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
