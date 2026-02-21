import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { DMLog } from '@/lib/models/DMLog';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const logId = searchParams.get('lid');
    const url = searchParams.get('url');

    if (!url) return new Response('Missing URL', { status: 400 });

    try {
        if (logId) {
            await connectToDatabase();
            await DMLog.findByIdAndUpdate(logId, {
                $set: { 'metadata.clickedAt': new Date() },
                $inc: { 'metadata.clickCount': 1 }
            });
        }
    } catch (error) {
        console.error('[Click Tracker] Error:', error);
    }

    // Redirect to destination
    return NextResponse.redirect(url);
}
