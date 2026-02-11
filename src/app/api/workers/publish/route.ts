import { NextRequest, NextResponse } from 'next/server';
import { PublishingWorker } from '@/lib/workers/publisher';

/**
 * API to trigger the publishing worker.
 * Secured with a secret header for Vercel Cron.
 */
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');

    // Simple secret check for Cron jobs
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await PublishingWorker.runCycle();
        return NextResponse.json({ success: true, message: 'Publishing cycle completed' });
    } catch (error: any) {
        console.error('[Publishing Cron] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
